import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { estado: 'Error', mensaje: 'El correo y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return NextResponse.json(
        { 
          estado: 'Error 🔴', 
          mensaje: 'Usuario o contraseña incorrectos', 
          detalle: error.message 
        },
        { status: 401 }
      );
    }

    if (data.session) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'sb-access-token',
        value: data.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, 
      });
    }

    return NextResponse.json({ 
      estado: 'Conexión Exitosa', 
      mensaje: 'Login correcto',
      data: data.user 
    });

  } catch (err: any) {
    return NextResponse.json(
      { estado: 'Error de Conexión 🔴', mensaje: err.message },
      { status: 500 }
    );
  }
}