import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;

  // 1. Verificamos si existe la cookie de sesión que creaste en tu route.ts
  const token = request.cookies.get('sb-access-token')?.value;

  // 2. Si el usuario NO tiene el token y trata de entrar a rutas privadas
  if (!token && (path.startsWith('/portal') || path.startsWith('/soporte'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Si YA tiene el token y trata de entrar al login o registro
  // (Añadí '/registro' por si usas una ruta separada, si todo está en /login, no afecta)
  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url));
  }

  return response;
}

// Rutas que debe ejecutar este guardia
export const config = {
  matcher: [
    '/portal/:path*',
    '/soporte/:path*',
    '/login',
    '/register' // IMPORTANTE: Agrega la ruta de registro aquí si la tienes separada
  ],
};