// Cliente de Supabase. Las claves vienen de variables de entorno (Vite).
// La "anon key" es pública por diseño; la seguridad la dan las políticas RLS.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured ? createClient(url, anonKey) : null;
