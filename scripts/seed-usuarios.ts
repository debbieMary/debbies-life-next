/**
 * Script de un solo uso para insertar usuarios iniciales con contraseñas hasheadas.
 * Ejecutar con: npx tsx scripts/seed-usuarios.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar .env.local manualmente
try {
  const envPath = resolve(process.cwd(), '.env.local');
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^([^#=][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
} catch {
  console.warn('No se pudo leer .env.local — asegúrate de que existe');
}

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const SALT_ROUNDS = 10;

const usuarios = [
  { nombre: 'Debbie', usuario: 'debbie', contrasenia: 'Debbie1989!' },
  { nombre: 'Admin',  usuario: 'admin',  contrasenia: 'Admin1989!'  },
];

async function seed() {
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.contrasenia, SALT_ROUNDS);

    const { error } = await supabase.from('usuarios').insert({
      nombre:     u.nombre,
      usuario:    u.usuario,
      contrasenia: hash,
    });

    if (error) {
      console.error(`Error insertando ${u.usuario}:`, error.message);
    } else {
      console.log(`✓ Usuario "${u.usuario}" insertado correctamente`);
    }
  }
}

seed().catch(console.error);
