import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    cookieStore.delete('sb-access-token');
    cookieStore.delete('ur-token');

    return NextResponse.json({ 
      estado: 'Éxito', 
      mensaje: 'Sesión cerrada correctamente' 
    });
  } catch (error) {
    return NextResponse.json(
      { estado: 'Error', mensaje: 'No se pudo cerrar la sesión' },
      { status: 500 }
    );
  }
}