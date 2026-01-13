import { supabase } from "@/integrations/supabase/client";

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Export all filaments from the database to a CSV file
 */
export async function exportFilamentDatabaseCSV(): Promise<{ success: boolean; count: number; error?: string }> {
  const PAGE_SIZE = 1000;
  const allFilaments: Array<{
    product_title: string | null;
    material: string | null;
    product_url: string | null;
    color_family: string | null;
    featured_image: string | null;
    color_hex: string | null;
    tds_url: string | null;
  }> = [];

  try {
    // Fetch all filaments with pagination
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('filaments')
        .select('product_title, material, product_url, color_family, featured_image, color_hex, tds_url')
        .order('vendor', { ascending: true })
        .order('product_title', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        allFilaments.push(...data);
        hasMore = data.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    if (allFilaments.length === 0) {
      return { success: false, count: 0, error: 'No filaments found in database' };
    }

    // Build CSV content
    const headers = [
      'Filament Name',
      'Material',
      'Filament Link',
      'Color',
      'Color Image Link',
      'Color Hex',
      'TDS Link'
    ];

    const csvRows = [headers.join(',')];

    for (const filament of allFilaments) {
      const row = [
        escapeCSV(filament.product_title),
        escapeCSV(filament.material),
        escapeCSV(filament.product_url),
        escapeCSV(filament.color_family),
        escapeCSV(filament.featured_image),
        escapeCSV(filament.color_hex ? `#${filament.color_hex.replace('#', '')}` : null),
        escapeCSV(filament.tds_url)
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `filascope_filaments_export_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: allFilaments.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return { success: false, count: 0, error: message };
  }
}
