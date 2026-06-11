import { NextRequest, NextResponse } from 'next/server'

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
  const { planId, precio, nombre } = await req.json()

  const token = await getPayPalToken()

  const res = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: planId,
        description: `Ribel Gestión - Plan ${nombre}`,
        amount: {
          currency_code: 'USD',
          value: precio.toString()
        }
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/pago-exitoso`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/planes`
      }
    })
  })

  const order = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: order }, { status: 500 })
  }

  const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href

  return NextResponse.json({ approval_url: approvalUrl })
}