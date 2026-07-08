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

export async function PUT(req: Request) {
  const { user_id, nuevo_email } = await req.json()

  if (!user_id || !nuevo_email) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(user_id, {
    email: nuevo_email
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
const diasPorPlan: Record<string, number> = {
  mensual: 30,
  semestral: 180,
  anual: 365,
  ilimitado: 36500,
  prueba: 15
}

export async function POST(req: Request) {
  const { user_id, plan } = await req.json()

  if (!user_id || !plan) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const dias = diasPorPlan[plan] || 30
  const hoy = new Date()
  const vencimiento = new Date()
  vencimiento.setDate(hoy.getDate() + dias)

  const { error } = await supabase
    .from('suscripciones')
    .update({
      plan,
      fecha_inicio: hoy.toISOString().split('T')[0],
      fecha_vencimiento: vencimiento.toISOString().split('T')[0]
    })
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}