// Capa de datos en la nube (Supabase): fichas en la tabla `fichas` (RLS por usuario,
// admin ve todas) y banco de bases gráficas en el bucket `bases`.
import { supabase } from './supabase.js';
import { getUserId } from './auth.js';

const BUCKET = 'bases';

// fila de Supabase -> objeto que usa la app
function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    width: row.width,
    height: row.height,
    backgroundPath: row.background_path,
    canvasState: row.canvas_state,
    thumbnail: row.thumbnail,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/* ---------- fichas ---------- */

export async function listFichas() {
  const { data, error } = await supabase
    .from('fichas')
    .select('id, name, user_id, width, height, background_path, thumbnail, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getFicha(id) {
  const { data, error } = await supabase.from('fichas').select('*').eq('id', id).single();
  if (error) return null;
  return fromRow(data);
}

export async function createFicha({ name, backgroundPath, width, height }) {
  const { data, error } = await supabase
    .from('fichas')
    .insert({
      user_id: getUserId(),
      name,
      background_path: backgroundPath,
      width,
      height,
      canvas_state: null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function saveFicha(ficha) {
  const { error } = await supabase
    .from('fichas')
    .update({
      name: ficha.name,
      canvas_state: ficha.canvasState,
      thumbnail: ficha.thumbnail,
      background_path: ficha.backgroundPath,
      width: ficha.width,
      height: ficha.height,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ficha.id);
  if (error) throw error;
  return ficha;
}

export async function deleteFicha(id) {
  const { error } = await supabase.from('fichas').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateFicha(id) {
  const orig = await getFicha(id);
  if (!orig) return null;
  const { data, error } = await supabase
    .from('fichas')
    .insert({
      user_id: getUserId(),
      name: `${orig.name} (copia)`,
      background_path: orig.backgroundPath,
      width: orig.width,
      height: orig.height,
      canvas_state: orig.canvasState,
      thumbnail: orig.thumbnail,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

/* ---------- banco de bases gráficas ---------- */

export function baseUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listBases() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list('', { sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter((f) => f.id) // ignora carpetas/placeholders
    .map((f) => ({ path: f.name, url: baseUrl(f.name) }));
}

export async function uploadBase(file) {
  const safe = file.name.replace(/[^\p{L}\p{N}._-]/gu, '_');
  const path = `${crypto.randomUUID().slice(0, 8)}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return { path, url: baseUrl(path) };
}
