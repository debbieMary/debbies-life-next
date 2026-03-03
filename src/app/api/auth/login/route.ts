import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { usuario, contrasenia } = await request.json();

  if (!usuario || !contrasenia) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const { data: row } = await supabase
    .from('usuarios')
    .select('id, nombre, usuario, contrasenia')
    .eq('usuario', usuario)
    .single();

  if (!row) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const ok = await bcrypt.compare(contrasenia, row.contrasenia);
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = row.id;
  session.nombre = row.nombre;
  session.usuario = row.usuario;
  await session.save();

  return NextResponse.json({ ok: true });
}
