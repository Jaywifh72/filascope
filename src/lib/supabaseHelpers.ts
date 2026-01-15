import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches all filaments by paginating through results.
 * Supabase/PostgREST has a default limit of 1000 rows per request,
 * so we need to fetch in batches to get all data.
 * 
 * @param queryBuilder - A function that returns the base query with filters applied
 * @param pageSize - Number of rows per page (default 1000)
 * @returns All matching filaments
 */
export async function fetchAllFilaments(
  queryBuilder: () => any,
  pageSize: number = 1000
): Promise<any[]> {
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await queryBuilder()
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      offset += pageSize;
      // If we got less than pageSize rows, we've reached the end
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`[fetchAllFilaments] Total rows fetched: ${allData.length} (${Math.ceil(offset / pageSize)} pages)`);
  
  return allData;
}
