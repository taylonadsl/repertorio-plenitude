import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || // nome usado pela integração da Vercel
  SUPABASE_ANON_KEY;

export const isConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(
  isConfigured ? url : 'https://placeholder.supabase.co',
  isConfigured ? key : 'placeholder'
);
