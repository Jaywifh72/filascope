const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/static-images`;
const RENDER_BASE = `${SUPABASE_URL}/storage/v1/render/image/public/static-images`;

export const getImageUrl = (path: string) => `${RENDER_BASE}/${path}`;

/** Direct object URL (no transform) – use only when render endpoint isn't needed */
export const getImageObjectUrl = (path: string) => `${STORAGE_BASE}/${path}`;
