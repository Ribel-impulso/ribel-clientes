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

async function getPayPalToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.event_type !== 'CHECKOUT.ORDER.APPROVED' &&
      body.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ ok: true })
  }

  const token = await getPayPalToken()

  const orderId = body.resource?.id
  if (!orderId) return NextResponse.json({ ok: true })

  const res = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const order = await res.json()

  if (order.status !== 'APPROVED' && order.status !== 'COMPLETED') {
    return NextResponse.json({ ok: true })
  }

  const planId = order.purchase_units?.[0]?.reference_id
  const email = order.payer?.email_address

  if (!planId || !email) return NextResponse.json({ ok: true })

  const { data: usuarios } = await supabase.auth.admin.listUsers()
  const usuario = usuarios?.users?.find(u => u.email === email)

  if (!usuario) return NextResponse.json({ ok: true })

  const dias = diasPorPlan[planId] || 30
  const hoy = new Date()
  const vencimiento = new Date()
  vencimiento.setDate(hoy.getDate() + dias)
  const fechaVencimientoStr = vencimiento.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

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

  // Buscar nombre del usuario
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', usuario.id)
    .single()

  // Enviar email de suscripción renovada
  await fetch(`${process.env.NEXT_PUBLIC_URL}/api/email/suscripcion-renovada`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      nombre: perfil?.nombre || 'Profesional',
      fechaVencimiento: fechaVencimientoStr
    })
  })

  return NextResponse.json({ ok: true })
}