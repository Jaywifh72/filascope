#!/usr/bin/env python3
"""
FilaScope Performance Optimizer & Monitor
==========================================

Automated performance optimization and monitoring for the Master Scraper v2 system.
Runs daily to optimize database queries, monitor coverage trends, and generate alerts.

Usage:
    python3 performance-optimizer.py [--full] [--alerts] [--optimize]
    
Cron:
    0 9 * * * /home/jay/filascope/scripts/performance-optimizer.py >> /home/jay/openclaw/logs/performance-optimizer.log 2>&1
"""

import urllib.request
import json
import os
import sys
import time
from datetime import datetime, timedelta
import argparse
import statistics

# Configuration
SUPABASE_URL = "https://fytxfdvbzstnimzhjgth.supabase.co"
SUPABASE_REST = f"{SUPABASE_URL}/rest/v1"
LOG_DIR = "/home/jay/openclaw/logs"
REPORT_DIR = "/home/jay/.openclaw/workspace/reports"
DATA_DIR = "/home/jay/openclaw/dashboard"

# Field categories for monitoring
FIELD_CATEGORIES = {
    'basic': ['product_title', 'brand_name', 'vendor', 'material', 'color_family', 'diameter_nominal_mm'],
    'pricing': ['variant_price', 'price_eur', 'price_gbp', 'price_cad', 'price_aud', 'price_jpy', 'price_cny'],
    'images': ['image_url', 'featured_image', 'variant_image'],
    'technical': ['density_g_cm3', 'tensile_strength_xy_mpa', 'nozzle_temp_min_c', 'nozzle_temp_max_c', 
                  'bed_temp_min_c', 'bed_temp_max_c', 'melt_temp_c', 'transmission_distance'],
    'regional': ['product_url_au', 'product_url_ca', 'product_url_cn', 'product_url_eu', 
                 'product_url_jp', 'product_url_uk'],
    'amazon': ['amazon_link_us', 'amazon_link_uk', 'amazon_link_de', 'amazon_link_ca', 
               'amazon_link_fr', 'amazon_link_jp', 'amazon_link_au']
}

class PerformanceOptimizer:
    def __init__(self):
        self.service_key = self._load_service_key()
        self.headers = {
            'apikey': self.service_key,
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/json'
        }
        self.metrics = {}
        self.alerts = []
        
    def _load_service_key(self):
        """Load Supabase service role key"""
        with open(os.path.expanduser('~/.hermes/.env')) as f:
            for line in f:
                if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    return line.strip().split('=', 1)[1]
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY not found")
    
    def _api_get(self, endpoint, params=None):
        """Make GET request to Supabase"""
        url = f"{SUPABASE_REST}/{endpoint}"
        if params:
            # Convert params to proper query string
            query_parts = []
            for k, v in params.items():
                if k == 'head' and v == 'true':
                    # Use GET with Prefer: count=exact to get count
                    req = urllib.request.Request(url + '?select=count&limit=1', headers={**self.headers, 'Prefer': 'count=exact'})
                    response = urllib.request.urlopen(req)
                    # Get count from content-range header
                    content_range = response.headers.get('content-range', '0-0/0')
                    # Format: "0-0/36180"
                    count_str = content_range.split('/')[-1]
                    return int(count_str)
                else:
                    query_parts.append(f"{k}={v}")
            url = f"{url}?{'&'.join(query_parts)}"
        
        req = urllib.request.Request(url, headers=self.headers)
        response = urllib.request.urlopen(req)
        return json.loads(response.read().decode())
    
    def run_performance_analysis(self, full=False):
        """Run comprehensive performance analysis"""
        print("🔍 Starting FilaScope Performance Analysis")
        print("=" * 60)
        
        # 1. Database performance metrics
        print("\n📊 Database Performance Metrics:")
        self._analyze_database_performance()
        
        # 2. Coverage trends
        print("\n📈 Coverage Trend Analysis:")
        self._analyze_coverage_trends()
        
        # 3. Data freshness analysis
        print("\n⏰ Data Freshness Analysis:")
        self._analyze_data_freshness()
        
        # 4. Query performance
        print("\n⚡ Query Performance Analysis:")
        self._analyze_query_performance()
        
        if full:
            # 5. Brand-specific optimization
            print("\n🔧 Brand-Specific Optimization:")
            self._optimize_brand_queries()
            
            # 6. Index recommendations
            print("\n📇 Index Recommendations:")
            self._generate_index_recommendations()
        
        # 7. Generate alerts
        print("\n🚨 Generating Alerts:")
        self._generate_alerts()
        
        # 8. Save report
        self._save_performance_report()
        
        print("\n✅ Performance analysis complete!")
    
    def _analyze_database_performance(self):
        """Analyze database performance metrics"""
        start_time = time.time()
        
        # Get total counts
        total_filaments = self._api_get('filaments', {'select': 'count', 'head': 'true'})
        print(f"  • Total filaments: {total_filaments:,}")
        
        # Get brand count (fetch all brand names and count unique)
        brand_data = self._api_get('filaments', {'select': 'brand_name', 'limit': '10000'})
        unique_brands = set(f.get('brand_name') for f in brand_data if f.get('brand_name'))
        print(f"  • Total brands: {len(unique_brands)}")
        
        # Calculate storage metrics (estimated)
        avg_fields = 50  # Average fields per filament
        avg_field_size = 100  # Average bytes per field
        estimated_storage = total_filaments * avg_fields * avg_field_size
        print(f"  • Estimated storage: {estimated_storage / (1024**3):.2f} GB")
        
        # Response time
        response_time = time.time() - start_time
        print(f"  • API response time: {response_time:.2f}s")
        
        self.metrics['database'] = {
            'total_filaments': total_filaments,
            'total_brands': len(unique_brands),
            'estimated_storage_gb': round(estimated_storage / (1024**3), 2),
            'response_time_seconds': round(response_time, 2)
        }
    
    def _analyze_coverage_trends(self):
        """Analyze coverage trends over time"""
        # Load historical data if available
        history_file = f"{DATA_DIR}/coverage-history.json"
        
        if os.path.exists(history_file):
            with open(history_file) as f:
                history = json.load(f)
            
            if len(history) >= 2:
                latest = history[-1]
                previous = history[-2]
                
                coverage_change = latest['overall_coverage'] - previous['overall_coverage']
                print(f"  • Coverage change: {coverage_change:+.1f}%")
                
                if coverage_change < 0:
                    self.alerts.append({
                        'type': 'coverage_decline',
                        'message': f"Coverage declined by {abs(coverage_change):.1f}%",
                        'severity': 'warning'
                    })
            else:
                print("  • Insufficient historical data for trend analysis")
        else:
            print("  • No historical data found")
        
        # Current coverage analysis
        try:
            sample = self._api_get('filaments', {'select': '*', 'limit': '1000'})
            coverage = self._calculate_sample_coverage(sample)
            
            print(f"  • Current sample coverage: {coverage:.1f}%")
            
            # Store for history
            history_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'overall_coverage': coverage,
                'sample_size': len(sample)
            }
            
            if os.path.exists(history_file):
                with open(history_file) as f:
                    history = json.load(f)
                history.append(history_entry)
                # Keep last 30 entries
                history = history[-30:]
            else:
                history = [history_entry]
            
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
            
            self.metrics['coverage'] = {
                'current': round(coverage, 1),
                'sample_size': len(sample)
            }
            
        except Exception as e:
            print(f"  • Error calculating coverage: {e}")
    
    def _calculate_sample_coverage(self, sample):
        """Calculate coverage for a sample of filaments"""
        if not sample:
            return 0.0
        
        all_fields = []
        for fields in FIELD_CATEGORIES.values():
            all_fields.extend(fields)
        
        total_possible = len(sample) * len(all_fields)
        total_populated = 0
        
        for filament in sample:
            for field in all_fields:
                value = filament.get(field)
                if value is not None and value != '' and value != 0:
                    total_populated += 1
        
        return (total_populated / total_possible * 100) if total_possible > 0 else 0.0
    
    def _analyze_data_freshness(self):
        """Analyze how fresh the data is"""
        try:
            # Get filaments with last_scraped_at
            scraped = self._api_get('filaments', {
                'select': 'last_scraped_at',
                'last_scraped_at': 'not.is.null',
                'order': 'last_scraped_at.desc',
                'limit': '100'
            })
            
            if scraped:
                latest_scraped = scraped[0]['last_scraped_at']
                print(f"  • Latest scrape: {latest_scraped}")
                
                # Check for stale data (older than 7 days)
                week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
                stale = self._api_get('filaments', {
                    'select': 'count',
                    'or': f'(last_scraped_at.lt.{week_ago},last_scraped_at.is.null)',
                    'head': 'true'
                })
                
                print(f"  • Stale filaments (>7 days): {stale:,}")
                
                if stale > 1000:
                    self.alerts.append({
                        'type': 'stale_data',
                        'message': f"{stale:,} filaments have stale data (>7 days)",
                        'severity': 'warning'
                    })
                
                self.metrics['freshness'] = {
                    'latest_scrape': latest_scraped,
                    'stale_filaments': stale
                }
            else:
                print("  • No scrape timestamps found")
                
        except Exception as e:
            print(f"  • Error analyzing freshness: {e}")
    
    def _analyze_query_performance(self):
        """Analyze query performance patterns"""
        try:
            # Test common query patterns
            queries = [
                ('brand_filter', {'brand_name': 'eq.Bambu Lab', 'select': 'count', 'head': 'true'}),
                ('price_filter', {'variant_price': 'not.is.null', 'select': 'count', 'head': 'true'}),
                ('image_filter', {'image_url': 'not.is.null', 'select': 'count', 'head': 'true'}),
                ('material_filter', {'material': 'eq.PLA', 'select': 'count', 'head': 'true'})
            ]
            
            query_times = {}
            for name, params in queries:
                start = time.time()
                self._api_get('filaments', params)
                query_times[name] = time.time() - start
            
            avg_time = statistics.mean(query_times.values())
            print(f"  • Average query time: {avg_time:.3f}s")
            
            for name, t in query_times.items():
                print(f"  • {name}: {t:.3f}s")
            
            self.metrics['query_performance'] = {
                'average_seconds': round(avg_time, 3),
                'query_times': {k: round(v, 3) for k, v in query_times.items()}
            }
            
            # Alert on slow queries
            if avg_time > 1.0:
                self.alerts.append({
                    'type': 'slow_queries',
                    'message': f"Average query time is {avg_time:.2f}s (threshold: 1.0s)",
                    'severity': 'critical'
                })
                
        except Exception as e:
            print(f"  • Error analyzing query performance: {e}")
    
    def _optimize_brand_queries(self):
        """Generate optimization recommendations for brand queries"""
        try:
            # Get brands with most filaments
            brands = self._api_get('filaments', {
                'select': 'brand_name',
                'group': 'brand_name',
                'order': 'count.desc',
                'limit': '10'
            })
            
            print("  Top brands by filament count:")
            for brand in brands[:5]:
                print(f"  • {brand['brand_name']}: {brand['count']:,} filaments")
            
            # Recommendations
            print("\n  Optimization recommendations:")
            print("  1. Add composite index on (brand_name, material)")
            print("  2. Add partial index on (variant_price) WHERE variant_price IS NOT NULL")
            print("  3. Add covering index for brand listing queries")
            print("  4. Consider materialized views for dashboard queries")
            
            self.metrics['optimization'] = {
                'top_brands': [b['brand_name'] for b in brands[:5]],
                'recommendations': [
                    "Add composite index on (brand_name, material)",
                    "Add partial index on (variant_price) WHERE variant_price IS NOT NULL",
                    "Add covering index for brand listing queries",
                    "Consider materialized views for dashboard queries"
                ]
            }
            
        except Exception as e:
            print(f"  • Error optimizing brand queries: {e}")
    
    def _generate_index_recommendations(self):
        """Generate database index recommendations"""
        recommendations = [
            {
                'name': 'idx_filaments_brand_material',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filaments_brand_material ON filaments (brand_name, material)',
                'purpose': 'Speed up brand + material filtering'
            },
            {
                'name': 'idx_filaments_price_not_null',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filaments_price_not_null ON filaments (variant_price) WHERE variant_price IS NOT NULL',
                'purpose': 'Speed up price-based queries'
            },
            {
                'name': 'idx_filaments_image_not_null',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filaments_image_not_null ON filaments (image_url) WHERE image_url IS NOT NULL',
                'purpose': 'Speed up image coverage queries'
            },
            {
                'name': 'idx_filaments_last_scraped',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filaments_last_scraped ON filaments (last_scraped_at)',
                'purpose': 'Speed up freshness checks'
            }
        ]
        
        print("  Recommended indexes:")
        for rec in recommendations:
            print(f"  • {rec['name']}: {rec['purpose']}")
        
        self.metrics['indexes'] = recommendations
    
    def _generate_alerts(self):
        """Generate performance alerts"""
        print(f"  Generated {len(self.alerts)} alerts:")
        
        for alert in self.alerts:
            severity_icon = "🔴" if alert['severity'] == 'critical' else "🟡"
            print(f"  {severity_icon} {alert['type']}: {alert['message']}")
        
        # Save alerts to file
        alert_file = f"{REPORT_DIR}/performance-alerts-{datetime.now().strftime('%Y-%m-%d')}.json"
        with open(alert_file, 'w') as f:
            json.dump({
                'timestamp': datetime.utcnow().isoformat(),
                'alerts': self.alerts,
                'metrics': self.metrics
            }, f, indent=2)
        
        print(f"  Alerts saved to: {alert_file}")
    
    def _save_performance_report(self):
        """Save comprehensive performance report"""
        report_file = f"{REPORT_DIR}/performance-report-{datetime.now().strftime('%Y-%m-%d')}.json"
        
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'metrics': self.metrics,
            'alerts': self.alerts,
            'summary': {
                'total_filaments': self.metrics.get('database', {}).get('total_filaments', 0),
                'overall_coverage': self.metrics.get('coverage', {}).get('current', 0),
                'alert_count': len(self.alerts),
                'critical_alerts': sum(1 for a in self.alerts if a['severity'] == 'critical')
            }
        }
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"  Performance report saved to: {report_file}")

def main():
    parser = argparse.ArgumentParser(description='FilaScope Performance Optimizer')
    parser.add_argument('--full', action='store_true', help='Run full analysis with optimizations')
    parser.add_argument('--alerts', action='store_true', help='Generate alerts only')
    parser.add_argument('--optimize', action='store_true', help='Run optimizations only')
    
    args = parser.parse_args()
    
    optimizer = PerformanceOptimizer()
    
    if args.alerts:
        optimizer._generate_alerts()
    elif args.optimize:
        optimizer._optimize_brand_queries()
        optimizer._generate_index_recommendations()
    else:
        optimizer.run_performance_analysis(full=args.full)

if __name__ == '__main__':
    main()