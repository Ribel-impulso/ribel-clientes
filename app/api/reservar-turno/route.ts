import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cliente_id, fecha, horario, tipo_masaje, duracion, user_id } = body

    const { data: cliente, error: errCliente } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre')
      .eq('id', cliente_id)
      .eq('user_id', user_id)
      .single()

    if (errCliente || !cliente) {
      return NextResponse.json({ error: 'Cliente no válido' }, { status: 403 })
    }

    const { data: sesion, error } = await supabaseAdmin
      .from('sesiones')
      .insert([{
        cliente_id, fecha, horario, tipo_masaje, duracion,
        user_id, facturado: false, cobrado: false
      }])
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabaseAdmin.from('notificaciones').insert([{
      user_id,
      titulo: '📅 Nuevo turno reservado',
      mensaje: `${cliente.nombre} agendó un turno para el ${fecha} a las ${horario}hs`,
      leida: false,
      sesion_id: sesion.id,
      fecha_sesion: fecha
    }])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}