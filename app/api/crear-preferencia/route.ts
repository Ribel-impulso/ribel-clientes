import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { planId, precio, nombre } = await req.json()

  const body = {
    items: [
      {
        title: `Ribel Gestión - Plan ${nombre}`,
        quantity: 1,
        unit_price: precio,
        currency_id: 'ARS'
      }
    ],
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_URL}/pago-exitoso`,
      failure: `${process.env.NEXT_PUBLIC_URL}/planes`,
      pending: `${process.env.NEXT_PUBLIC_URL}/planes`
    },
    auto_return: 'approved',
    external_reference: planId
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json({ error: data }, { status: 500 })
  }

  return NextResponse.json({ init_point: data.init_point })
}