import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptRole } from '../../lib/session'; 

function normalizeRole(val: any): string {
  if (!val) return '';
  return String(val)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isTecnicoOrAdmin(roleStr: string): boolean {
  const norm = normalizeRole(roleStr);
  return (
    norm === 'tecnico' ||
    norm === 'admin' ||
    norm === 'administrador' ||
    norm.includes('tecnic') ||
    norm.includes('admin')
  );
}

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

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { 
          estado: 'Error 🔴', 
          mensaje: 'Usuario o contraseña incorrectos', 
          detalle: error?.message 
        },
        { status: 401 }
      );
    }

  
    const authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      },
    });

    let rawRole = '';

    try {
      const { data: dbUserAuth } = await authClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (dbUserAuth) {
        rawRole = dbUserAuth.role || dbUserAuth.rol || dbUserAuth.tipo || '';
      }
    } catch (e) {
      console.error('Error consultando users por id con authClient:', e);
    }

    if (!rawRole && email) {
      try {
        const { data: dbEmailAuth } = await authClient
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (dbEmailAuth) {
          rawRole = dbEmailAuth.role || dbEmailAuth.rol || dbEmailAuth.tipo || '';
        }
      } catch (e) {
        console.error('Error consultando users por email con authClient:', e);
      }
    }

    if (!rawRole) {
      rawRole =
        data.user.user_metadata?.role ||
        data.user.user_metadata?.rol ||
        data.user.user_metadata?.tipo ||
        data.user.app_metadata?.role ||
        data.user.app_metadata?.rol ||
        data.user.app_metadata?.tipo ||
        data.user.role ||
        '';
    }

    const cleanRole = normalizeRole(rawRole);
    const hasTecnicoOrAdmin = isTecnicoOrAdmin(rawRole);

    let finalRole = 'usuario';
    if (hasTecnicoOrAdmin) {
      finalRole = cleanRole.includes('admin') ? 'admin' : 'tecnico';
    }

    const redirectTo = hasTecnicoOrAdmin ? '/portal/dashboard' : '/soporte/dashboard';

    const encryptedRole = await encryptRole(finalRole);

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

    cookieStore.set({
      name: 'ur-token',
      value: encryptedRole, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ 
      estado: 'Conexión Exitosa', 
      mensaje: 'Login correcto',
      data: data.user,
      role: finalRole,
      redirectTo: redirectTo
    });

  } catch (err: any) {
    return NextResponse.json(
      { estado: 'Error de Conexión 🔴', mensaje: err.message },
      { status: 500 }
    );
  }
}