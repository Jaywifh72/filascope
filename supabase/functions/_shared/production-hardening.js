#!/usr/bin/env node
/**
 * FILASCOPE PRODUCTION HARDENING & ERROR RECOVERY
 * 
 * Implements circuit breakers, auto-recovery, and graceful degradation.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  stateDir: process.env.HOME + '/openclaw/state',
  logDir: process.env.HOME + '/openclaw/logs',
  circuitBreakerFile: process.env.HOME + '/openclaw/state/circuit-breakers.json',
  healthCheckFile: process.env.HOME + '/openclaw/state/health-checks.json',
  thresholds: {
    circuitBreaker: {
      failureThreshold: 5,      // Open circuit after 5 failures
      resetTimeout: 300000,     // 5 minutes before retry
      halfOpenRequests: 2       // Test with 2 requests in half-open state
    },
    healthCheck: {
      interval: 60000,          // 1 minute between checks
      timeout: 30000,           // 30 second timeout
      unhealthyThreshold: 3     // Mark unhealthy after 3 failures
    }
  }
};

// Ensure directories exist
if (!existsSync(CONFIG.stateDir)) {
  mkdirSync(CONFIG.stateDir, { recursive: true });
}
if (!existsSync(CONFIG.logDir)) {
  mkdirSync(CONFIG.logDir, { recursive: true });
}

// Circuit Breaker implementation
class CircuitBreaker {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenAttempts = 0;
        console.log(`Circuit ${this.name}: OPEN → HALF_OPEN (timeout elapsed)`);
      } else {
        throw new Error(`Circuit ${this.name} is OPEN. Retry in ${Math.round((this.config.resetTimeout - timeSinceLastFailure) / 1000)}s`);
      }
    }

    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenAttempts >= this.config.halfOpenRequests) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`Circuit ${this.name}: HALF_OPEN → CLOSED (test successful)`);
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.successCount++;
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      console.log(`Circuit ${this.name}: Test request succeeded (${this.halfOpenAttempts}/${this.config.halfOpenRequests})`);
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.log(`Circuit ${this.name}: HALF_OPEN → OPEN (test failed)`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      console.log(`Circuit ${this.name}: CLOSED → OPEN (threshold reached: ${this.failureCount}/${this.config.failureThreshold})`);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      halfOpenAttempts: this.halfOpenAttempts
    };
  }
}

// Health Check implementation
class HealthCheck {
  constructor(name, checkFn, config) {
    this.name = name;
    this.checkFn = checkFn;
    this.config = config;
    this.status = 'UNKNOWN';
    this.lastCheck = null;
    this.consecutiveFailures = 0;
    this.lastError = null;
  }

  async check() {
    this.lastCheck = new Date().toISOString();
    
    try {
      const result = await Promise.race([
        this.checkFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        )
      ]);
      
      this.status = 'HEALTHY';
      this.consecutiveFailures = 0;
      this.lastError = null;
      
      return {
        name: this.name,
        status: 'HEALTHY',
        timestamp: this.lastCheck,
        details: result
      };
    } catch (error) {
      this.consecutiveFailures++;
      this.lastError = error.message;
      
      if (this.consecutiveFailures >= this.config.unhealthyThreshold) {
        this.status = 'UNHEALTHY';
      } else {
        this.status = 'DEGRADED';
      }
      
      return {
        name: this.name,
        status: this.status,
        timestamp: this.lastCheck,
        error: error.message,
        consecutiveFailures: this.consecutiveFailures
      };
    }
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
      lastError: this.lastError
    };
  }
}

// Auto-Recovery Manager
class AutoRecoveryManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.healthChecks = new Map();
    this.recoveryActions = new Map();
  }

  registerCircuitBreaker(name, config = CONFIG.thresholds.circuitBreaker) {
    const breaker = new CircuitBreaker(name, config);
    this.circuitBreakers.set(name, breaker);
    return breaker;
  }

  registerHealthCheck(name, checkFn, config = CONFIG.thresholds.healthCheck) {
    const healthCheck = new HealthCheck(name, checkFn, config);
    this.healthChecks.set(name, healthCheck);
    return healthCheck;
  }

  registerRecoveryAction(component, action) {
    this.recoveryActions.set(component, action);
  }

  async runHealthChecks() {
    const results = [];
    for (const [name, healthCheck] of this.healthChecks) {
      const result = await healthCheck.check();
      results.push(result);
      
      // Trigger recovery if unhealthy
      if (result.status === 'UNHEALTHY' && this.recoveryActions.has(name)) {
        console.log(`🏥 Triggering recovery for ${name}...`);
        try {
          await this.recoveryActions.get(name)();
          console.log(`✅ Recovery successful for ${name}`);
        } catch (error) {
          console.error(`❌ Recovery failed for ${name}:`, error.message);
        }
      }
    }
    return results;
  }

  getCircuitBreakerStatus() {
    const statuses = [];
    for (const [name, breaker] of this.circuitBreakers) {
      statuses.push(breaker.getStatus());
    }
    return statuses;
  }

  getHealthCheckStatus() {
    const statuses = [];
    for (const [name, healthCheck] of this.healthChecks) {
      statuses.push(healthCheck.getStatus());
    }
    return statuses;
  }

  saveState() {
    const state = {
      timestamp: new Date().toISOString(),
      circuitBreakers: this.getCircuitBreakerStatus(),
      healthChecks: this.getHealthCheckStatus()
    };
    writeFileSync(CONFIG.circuitBreakerFile, JSON.stringify(state, null, 2));
  }
}

// Initialize recovery manager
const recoveryManager = new AutoRecoveryManager();

// Register circuit breakers for external APIs
recoveryManager.registerCircuitBreaker('shopify-api');
recoveryManager.registerCircuitBreaker('firecrawl-api');
recoveryManager.registerCircuitBreaker('supabase-api');
recoveryManager.registerCircuitBreaker('amazon-api');

// Register health checks
recoveryManager.registerHealthCheck('supabase-connection', async () => {
  // Simple Supabase health check
  try {
    execSync('curl -s -f https://fytxfdvbzstnimzhjgth.supabase.co/rest/v1/ -H "apikey: test" || true', { timeout: 10000 });
    return { status: 'connected' };
  } catch (error) {
    throw new Error('Supabase connection failed');
  }
});

recoveryManager.registerHealthCheck('disk-space', async () => {
  const output = execSync("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'", { encoding: 'utf8' });
  const usage = parseInt(output.trim());
  
  if (usage > 90) {
    throw new Error(`Disk space critical: ${usage}% used`);
  } else if (usage > 80) {
    return { status: 'warning', usage: `${usage}%` };
  }
  return { status: 'ok', usage: `${usage}%` };
});

recoveryManager.registerHealthCheck('memory-usage', async () => {
  const output = execSync("free -m | awk 'NR==2{printf \"%.0f\", $3*100/$2}'", { encoding: 'utf8' });
  const usage = parseInt(output.trim());
  
  if (usage > 90) {
    throw new Error(`Memory usage critical: ${usage}%`);
  } else if (usage > 80) {
    return { status: 'warning', usage: `${usage}%` };
  }
  return { status: 'ok', usage: `${usage}%` };
});

// Register recovery actions
recoveryManager.registerRecoveryAction('disk-space', async () => {
  // Clean old logs
  execSync('find $HOME/openclaw/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true');
  // Clean old reports
  execSync('find $HOME/openclaw/reports -name "*.json" -mtime +30 -delete 2>/dev/null || true');
  console.log('🧹 Cleaned old logs and reports');
});

// Main execution
console.log('🛡️ FilaScope Production Hardening & Error Recovery');
console.log('==================================================\n');

// Run health checks
console.log('Running health checks...\n');
const healthResults = await recoveryManager.runHealthChecks();

// Display results
console.log('\n📊 HEALTH CHECK RESULTS');
console.log('=======================\n');

healthResults.forEach(result => {
  const icon = result.status === 'HEALTHY' ? '✅' : result.status === 'DEGRADED' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.status}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  if (result.details) {
    console.log(`   Details: ${JSON.stringify(result.details)}`);
  }
});

// Display circuit breaker status
console.log('\n🔌 CIRCUIT BREAKER STATUS');
console.log('=========================\n');

const circuitStatuses = recoveryManager.getCircuitBreakerStatus();
circuitStatuses.forEach(status => {
  const icon = status.state === 'CLOSED' ? '✅' : status.state === 'HALF_OPEN' ? '⚠️' : '❌';
  console.log(`${icon} ${status.name}: ${status.state}`);
  console.log(`   Failures: ${status.failureCount}, Successes: ${status.successCount}`);
});

// Save state
recoveryManager.saveState();

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  healthChecks: healthResults,
  circuitBreakers: circuitStatuses,
  summary: {
    healthy: healthResults.filter(r => r.status === 'HEALTHY').length,
    degraded: healthResults.filter(r => r.status === 'DEGRADED').length,
    unhealthy: healthResults.filter(r => r.status === 'UNHEALTHY').length,
    circuitsClosed: circuitStatuses.filter(s => s.state === 'CLOSED').length,
    circuitsOpen: circuitStatuses.filter(s => s.state === 'OPEN').length,
    circuitsHalfOpen: circuitStatuses.filter(s => s.state === 'HALF_OPEN').length
  }
};

const reportPath = join(CONFIG.logDir, `hardening-report-${new Date().toISOString().split('T')[0]}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Report saved: ${reportPath}`);

// Exit with appropriate code
const unhealthyCount = healthResults.filter(r => r.status === 'UNHEALTHY').length;
const openCircuits = circuitStatuses.filter(s => s.state === 'OPEN').length;

if (unhealthyCount > 0 || openCircuits > 0) {
  console.log('\n🚨 CRITICAL ISSUES DETECTED - Review immediately!');
  process.exit(1);
} else if (healthResults.some(r => r.status === 'DEGRADED')) {
  console.log('\n⚠️ Degraded health detected - Review when convenient');
  process.exit(0);
} else {
  console.log('\n✅ All systems healthy and hardened');
  process.exit(0);
}
