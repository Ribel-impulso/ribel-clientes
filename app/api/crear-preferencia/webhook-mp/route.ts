import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const diasPorPlan: Record<string, number> = {
  mensual: 30,
  semestral: 180,
  anual: 365,
  ilimitado: 36500
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  // Consultar el pago a MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  })
  const pago = await mpRes.json()

  if (pago.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const planId = pago.external_reference
  const userEmail = pago.payer?.email

  if (!planId || !userEmail) {
    return NextResponse.json({ ok: true })
  }

  // Buscar el usuario por email
  const { data: usuarios } = await supabase.auth.admin.listUsers()
  const usuario = usuarios?.users?.find(u => u.email === userEmail)

  if (!usuario) return NextResponse.json({ ok: true })

  const dias = diasPorPlan[planId] || 30
  const hoy = new Date()
  const vencimiento = new Date()
  vencimiento.setDate(hoy.getDate() + dias)

  // Actualizar o insertar suscripción
  const { data: suscExistente } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('user_id', usuario.id)
    .single()

  if (suscExistente) {
    await supabase
      .from('suscripciones')
      .update({
        plan: planId,
        estado: 'activa',
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_vencimiento: vencimiento.toISOString().split('T')[0]
      })
      .eq('user_id', usuario.id)
  } else {
    await supabase
      .from('suscripciones')
      .insert({
        user_id: usuario.id,
        plan: planId,
        estado: 'activa',
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_vencimiento: vencimiento.toISOString().split('T')[0]
      })
  }

  return NextResponse.json({ ok: true })
}