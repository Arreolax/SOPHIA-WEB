import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Obtener todos los tickets con sus categorías y creadores
export async function GET() {
  const { data, error } = await supabase
    .from('Ticket')
    .select('*, Category(name), User!created_by(name)');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

// POST: Crear un nuevo ticket desde la API
export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase
    .from('Ticket')
    .insert([body])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}