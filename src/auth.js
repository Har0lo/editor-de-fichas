// Sesión y rol del usuario. Las cuentas las crea Harold desde el panel de Supabase
// (no hay registro abierto), por eso aquí solo hay iniciar/cerrar sesión.
import { supabase, isConfigured } from './supabase.js';

let session = null;
let profile = null; // { id, email, role }

export async function initAuth() {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  session = data.session;
  if (session) await loadProfile();
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession;
    profile = null;
  });
  return session;
}

async function loadProfile() {
  if (!session) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', session.user.id)
    .single();
  profile = data || { id: session.user.id, email: session.user.email, role: 'sales' };
  return profile;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  session = data.session;
  await loadProfile();
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  session = null;
  profile = null;
}

export function getSession() {
  return session;
}

export function getUserId() {
  return session?.user?.id || null;
}

export function getEmail() {
  return profile?.email || session?.user?.email || null;
}

export async function isAdmin() {
  if (!profile) await loadProfile();
  return profile?.role === 'admin';
}
