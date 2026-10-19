import { SignJWT, jwtVerify } from 'jose';

// Define esta variable en tu archivo .env.local:
// SESSION_SECRET=cualquier_texto_largo_y_seguro_de_al_menos_32_caracteres
const secretKey = process.env.SESSION_SECRET || 'clave_secreta_por_defecto_de_al_menos_32_caracteres_segura';
const key = new TextEncoder().encode(secretKey);

export async function encryptRole(role: string) {
  return await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decryptRole(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return (payload.role as string) || null;
  } catch {
    // Si la cookie fue manipulada o no es un JWT válido
    return null;
  }
}