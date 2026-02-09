const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/static-images`;

export const getImageUrl = (path: string) => `${STORAGE_BASE}/${path}`;
