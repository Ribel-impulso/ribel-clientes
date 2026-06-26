import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, nombre, diasRestantes } = await req.json()

  const { error } = await resend.emails.send({
    from: 'Ribel Gestión <hola@ribelgestion.com>',
    replyTo: 'ribel.contacto@gmail.com',
    to: email,
    subject: `Tu período de prueba vence en ${diasRestantes} días 🌿`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #161616; padding: 32px; text-align: center;">
          <h1 style="color: #ba9a7d; margin: 0; font-size: 28px;">🌿 Ribel Gestión</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #e3dfd6;">
          <h2 style="color: #161616;">¡Hola ${nombre}! 👋</h2>
          <p style="color: #161616; font-size: 16px; line-height: 1.6;">
            Te avisamos que tu período de prueba gratuita <strong>vence en ${diasRestantes} días</strong>.
          </p>
          <p style="color: #161616; font-size: 16px; line-height: 1.6;">
            Para seguir disfrutando de todas las funcionalidades sin interrupciones, elegí tu plan antes de que se termine el tiempo.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ribelgestion.com/planes" style="background-color: #ba9a7d; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Ver planes
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