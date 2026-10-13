import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error && error.code === '42P01') {
      return NextResponse.json({
        estado: 'eRROR',
        mensaje: 'Tu app Next.js NO se comunicó con PostgreSQL en Supabase.',
        detalle: 'Postgres respondió indicando que la tabla no existe.'
      });
    }

    if (error) throw error;

    return NextResponse.json({ estado: 'Conexión Exitosa', data });

  } catch (err: any) {
    return NextResponse.json(
      { estado: 'Error de Conexión 🔴', mensaje: err.message },
      { status: 500 }
    );
  }
}