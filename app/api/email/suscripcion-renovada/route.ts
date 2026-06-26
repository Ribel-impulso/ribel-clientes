import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, nombre, fechaVencimiento } = await req.json()

  const { error } = await resend.emails.send({
    from: 'Ribel Gestión <hola@ribelgestion.com>',
    replyTo: 'ribel.contacto@gmail.com',
    to: email,
    subject: '¡Tu suscripción fue renovada! 🌿',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #161616; padding: 32px; text-align: center;">
          <h1 style="color: #ba9a7d; margin: 0; font-size: 28px;">🌿 Ribel Gestión</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #e3dfd6;">
          <h2 style="color: #161616;">¡Hola ${nombre}! 🎉</h2>
          <p style="color: #161616; font-size: 16px; line-height: 1.6;">
            Tu suscripción a <strong>Ribel Gestión</strong> fue renovada exitosamente.
          </p>
          <p style="color: #161616; font-size: 16px; line-height: 1.6;">
            Seguís teniendo acceso completo hasta el <strong>${fechaVencimiento}</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ribelgestion.com" style="background-color: #ba9a7d; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Ir a mi cuenta
            </a>
          </div>
          <p style="color: #9e9e9e; font-size: 13px; text-align: center;">
            Si tenés alguna duda, respondé este email y te ayudamos.
          </p>
        </div>
      </div>
    `
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}