import { createClient } from '@supabase/supabase-js';

// Reemplaza estas dos constantes con las llaves de tu proyecto en Supabase (Settings -> API)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
