// Capa de datos de fichas. Hoy: IndexedDB local.
// Fase 2: adaptador Supabase con esta misma interfaz (fichas por usuario).
import { dbGet, dbPut, dbDelete, dbList } from './db.js';

export async function listFichas() {
  const fichas = await dbList();
  return fichas.sort((a, b) => b.updatedAt - a.updatedAt);
}

export const getFicha = (id) => dbGet(id);

export async function createFicha({ name, backgroundBlob = null, width, height }) {
  const now = Date.now();
  const ficha = {
    id: crypto.randomUUID(),
    name,
    backgroundBlob,
    width,
    height,
    canvasState: null,
    thumbnail: null,
    createdAt: now,
    updatedAt: now,
  };
  await dbPut(ficha);
  return ficha;
}

export async function saveFicha(ficha) {
  ficha.updatedAt = Date.now();
  await dbPut(ficha);
  return ficha;
}

export const deleteFicha = (id) => dbDelete(id);

export async function duplicateFicha(id) {
  const original = await dbGet(id);
  if (!original) return null;
  const now = Date.now();
  const copy = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (copia)`,
    createdAt: now,
    updatedAt: now,
  };
  await dbPut(copy);
  return copy;
}
