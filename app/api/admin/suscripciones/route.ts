import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: suscripciones, error } = await supabase
    .from('suscripciones')
    .select('*')
    .order('fecha_inicio', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Traer todos los usuarios de Auth para poder mapear el email por user_id
  const { data: usuariosData } = await supabase.auth.admin.listUsers()
  const usuarios = usuariosData?.users || []

  const suscripcionesConEmail = suscripciones.map(susc => {
    const usuario = usuarios.find(u => u.id === susc.user_id)
    return {
      ...susc,
      email: usuario?.email || 'No encontrado'
    }
  })

  return NextResponse.json(suscripcionesConEmail)
}

export async function PATCH(req: Request) {
  const { user_id, estado } = await req.json()

  if (!user_id || !estado) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('suscripciones')
    .update({ estado })
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}