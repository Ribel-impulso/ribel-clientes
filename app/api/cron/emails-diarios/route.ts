import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  // Verificación de seguridad
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date()
  const en3Dias = new Date()
  en3Dias.setDate(hoy.getDate() + 3)
  const hoyStr = hoy.toISOString().split('T')[0]
  const en3DiasStr = en3Dias.toISOString().split('T')[0]

  // 1. Trial por vencer en 3 días
  const { data: porVencer } = await supabase
    .from('suscripciones')
    .select('user_id, fecha_vencimiento, usuarios:user_id(email, nombre)')
    .eq('estado', 'activa')
    .eq('fecha_vencimiento', en3DiasStr)

  for (const s of porVencer || []) {
    const usuario = s.usuarios as any
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/email/trial-por-vencer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        nombre: usuario.nombre,
        diasRestantes: 3
      })
    })
  }

  // 2. Suscripción vencida hoy
  const { data: vencidas } = await supabase
    .from('suscripciones')
    .select('user_id, usuarios:user_id(email, nombre)')
    .eq('estado', 'activa')
    .eq('fecha_vencimiento', hoyStr)

  for (const s of vencidas || []) {
    const usuario = s.usuarios as any
    // Actualizar estado a vencida
    await supabase
      .from('suscripciones')
      .update({ estado: 'vencida' })
      .eq('user_id', s.user_id)

    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/email/suscripcion-vencida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usuario.email,
        nombre: usuario.nombre
      })
    })
  }

  return NextResponse.json({ ok: true, porVencer: porVencer?.length || 0, vencidas: vencidas?.length || 0 })
}