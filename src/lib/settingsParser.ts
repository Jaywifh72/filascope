// Parse settings from various input formats

export interface ParsedSettings {
  nozzleTemp?: number;
  bedTemp?: number;
  printSpeed?: number;
  cooling?: number;
  retraction?: number;
  chamberTemp?: number;
}

export interface ParseResult {
  success: boolean;
  settings: ParsedSettings;
  warnings: string[];
  errors: string[];
}

interface ValidationRange {
  min: number;
  max: number;
  default: number;
}

const VALIDATION_RANGES: Record<string, ValidationRange> = {
  nozzleTemp: { min: 150, max: 350, default: 200 },
  bedTemp: { min: 0, max: 150, default: 60 },
  printSpeed: { min: 10, max: 500, default: 60 },
  cooling: { min: 0, max: 100, default: 100 },
  retraction: { min: 0, max: 10, default: 0.8 },
  chamberTemp: { min: 0, max: 80, default: 0 },
};

function validateValue(key: string, value: number): { value: number; warning?: string } {
  const range = VALIDATION_RANGES[key];
  if (!range) return { value };

  if (value < range.min || value > range.max) {
    return {
      value: range.default,
      warning: `${key}: ${value} is out of range (${range.min}-${range.max}), using ${range.default}`,
    };
  }

  return { value };
}

function extractNumber(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Try to parse JSON format
function parseJSON(input: string): ParseResult | null {
  try {
    const data = JSON.parse(input);
    const settings: ParsedSettings = {};
    const warnings: string[] = [];

    // Handle nested settings object or flat object
    const source = data.settings || data;

    if (source.nozzle_temp || source.nozzleTemp) {
      const val = validateValue('nozzleTemp', source.nozzle_temp || source.nozzleTemp);
      settings.nozzleTemp = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    if (source.bed_temp || source.bedTemp) {
      const val = validateValue('bedTemp', source.bed_temp || source.bedTemp);
      settings.bedTemp = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    if (source.print_speed || source.printSpeed) {
      const val = validateValue('printSpeed', source.print_speed || source.printSpeed);
      settings.printSpeed = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    if (source.cooling !== undefined) {
      const val = validateValue('cooling', source.cooling);
      settings.cooling = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    if (source.retraction !== undefined) {
      const val = validateValue('retraction', source.retraction);
      settings.retraction = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    if (source.chamber_temp || source.chamberTemp) {
      const val = validateValue('chamberTemp', source.chamber_temp || source.chamberTemp);
      settings.chamberTemp = val.value;
      if (val.warning) warnings.push(val.warning);
    }

    return {
      success: Object.keys(settings).length > 0,
      settings,
      warnings,
      errors: Object.keys(settings).length === 0 ? ['No valid settings found in JSON'] : [],
    };
  } catch {
    return null;
  }
}

// Try to parse Markdown table format
function parseMarkdown(input: string): ParseResult | null {
  if (!input.includes('|')) return null;

  const settings: ParsedSettings = {};
  const warnings: string[] = [];
  const lines = input.split('\n');

  const patterns: Record<string, keyof ParsedSettings> = {
    'nozzle': 'nozzleTemp',
    'hotend': 'nozzleTemp',
    'extruder': 'nozzleTemp',
    'bed': 'bedTemp',
    'plate': 'bedTemp',
    'speed': 'printSpeed',
    'cool': 'cooling',
    'fan': 'cooling',
    'retract': 'retraction',
    'chamber': 'chamberTemp',
  };

  for (const line of lines) {
    if (!line.includes('|')) continue;
    
    const cells = line.split('|').map(c => c.trim().toLowerCase());
    
    for (const [keyword, settingKey] of Object.entries(patterns)) {
      if (cells.some(c => c.includes(keyword))) {
        // Find the cell with the number
        for (const cell of cells) {
          const num = extractNumber(cell);
          if (num !== null && !settings[settingKey]) {
            const val = validateValue(settingKey, num);
            settings[settingKey] = val.value;
            if (val.warning) warnings.push(val.warning);
            break;
          }
        }
      }
    }
  }

  return {
    success: Object.keys(settings).length > 0,
    settings,
    warnings,
    errors: Object.keys(settings).length === 0 ? ['No valid settings found in Markdown'] : [],
  };
}

// Try to parse plain text key-value format
function parsePlainText(input: string): ParseResult {
  const settings: ParsedSettings = {};
  const warnings: string[] = [];
  const lines = input.split('\n');

  const patterns: Array<{ regex: RegExp; key: keyof ParsedSettings }> = [
    { regex: /nozzle\s*(?:temp|temperature)?[:\s]*(\d+)/i, key: 'nozzleTemp' },
    { regex: /hotend\s*(?:temp|temperature)?[:\s]*(\d+)/i, key: 'nozzleTemp' },
    { regex: /extruder\s*(?:temp|temperature)?[:\s]*(\d+)/i, key: 'nozzleTemp' },
    { regex: /bed\s*(?:temp|temperature)?[:\s]*(\d+)/i, key: 'bedTemp' },
    { regex: /(?:print\s*)?speed[:\s]*(\d+)/i, key: 'printSpeed' },
    { regex: /cool(?:ing)?[:\s]*(\d+)/i, key: 'cooling' },
    { regex: /fan[:\s]*(\d+)/i, key: 'cooling' },
    { regex: /retract(?:ion)?[:\s]*(\d+(?:\.\d+)?)/i, key: 'retraction' },
    { regex: /chamber\s*(?:temp|temperature)?[:\s]*(\d+)/i, key: 'chamberTemp' },
  ];

  for (const line of lines) {
    for (const { regex, key } of patterns) {
      const match = line.match(regex);
      if (match && !settings[key]) {
        const num = parseFloat(match[1]);
        const val = validateValue(key, num);
        settings[key] = val.value;
        if (val.warning) warnings.push(val.warning);
      }
    }
  }

  return {
    success: Object.keys(settings).length > 0,
    settings,
    warnings,
    errors: Object.keys(settings).length === 0 ? ['Could not parse any settings from the input'] : [],
  };
}

export function parseSettings(input: string): ParseResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      success: false,
      settings: {},
      warnings: [],
      errors: ['No input provided'],
    };
  }

  // Try JSON first
  const jsonResult = parseJSON(trimmed);
  if (jsonResult?.success) return jsonResult;

  // Try Markdown table
  const mdResult = parseMarkdown(trimmed);
  if (mdResult?.success) return mdResult;

  // Fall back to plain text parsing
  return parsePlainText(trimmed);
}

export function getSettingLabel(key: keyof ParsedSettings): string {
  const labels: Record<keyof ParsedSettings, string> = {
    nozzleTemp: 'Nozzle Temperature',
    bedTemp: 'Bed Temperature',
    printSpeed: 'Print Speed',
    cooling: 'Cooling',
    retraction: 'Retraction',
    chamberTemp: 'Chamber Temperature',
  };
  return labels[key] || key;
}

export function getSettingUnit(key: keyof ParsedSettings): string {
  const units: Record<keyof ParsedSettings, string> = {
    nozzleTemp: '°C',
    bedTemp: '°C',
    printSpeed: 'mm/s',
    cooling: '%',
    retraction: 'mm',
    chamberTemp: '°C',
  };
  return units[key] || '';
}
