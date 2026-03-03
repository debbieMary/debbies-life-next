import { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { cache } from 'react';

export interface SessionData {
  userId: string;
  nombre: string;
  usuario: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: 'debbies-session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
};

// Memoiza la lectura de sesión dentro de un mismo request (no descifra la cookie más de una vez)
export const getSession = cache(async () => {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
});
