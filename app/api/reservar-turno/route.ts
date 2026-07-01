import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Bloque {
  inicio: string
  fin: string
  duracion: number
}

function aMinutos(horaStr: string): number {
  const [h, m] = horaStr.substring(0, 5).split(':').map(Number)
  return h * 60 + m
}

function haySolapamiento(inicioA: number, finA: number, inicioB: number, finB: number): boolean {
  return inicioA < finB && finA > inicioB
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cliente_id, fecha, horario, tipo_masaje, duracion, user_id } = body

    if (!cliente_id || !fecha || !horario || !duracion || !user_id) {
      return NextResponse.json({ error: 'Faltan datos para reservar el turno' }, { status: 400 })
    }

    const { data: cliente, error: errCliente } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre')
      .eq('id', cliente_id)
      .eq('user_id', user_id)
      .single()

    if (errCliente || !cliente) {
      return NextResponse.json({ error: 'Cliente no válido' }, { status: 403 })
    }

    // 1) El día tiene que estar activo y el horario + duración del servicio
    //    tiene que entrar completo dentro de alguno de los bloques configurados.
    const diaSemana = new Date(fecha + 'T12:00:00').getDay()
    const { data: disp } = await supabaseAdmin
      .from('disponibilidad')
      .select('activo, bloques')
      .eq('user_id', user_id)
      .eq('dia_semana', diaSemana)
      .single()

    if (!disp || !disp.activo) {
      return NextResponse.json({ error: 'El profesional no atiende ese día' }, { status: 409 })
    }

    const bloques: Bloque[] = Array.isArray(disp.bloques) ? disp.bloques : []
    const inicioNuevo = aMinutos(horario)
    const finNuevo = inicioNuevo + duracion

    const entraEnAlgunBloque = bloques.some(b => {
      const inicioBloque = aMinutos(b.inicio)
      const finBloque = aMinutos(b.fin)
      return inicioNuevo >= inicioBloque && finNuevo <= finBloque
    })

    if (!entraEnAlgunBloque) {
      return NextResponse.json({ error: 'El horario elegido no está dentro de la disponibilidad del profesional, o el servicio no entra antes del cierre de ese bloque' }, { status: 409 })
    }

    // 2) No puede solaparse con una sesión ya reservada.
    const { data: sesionesDelDia } = await supabaseAdmin
      .from('sesiones')
      .select('horario, duracion')
      .eq('user_id', user_id)
      .eq('fecha', fecha)

    const chocaConSesion = (sesionesDelDia || []).some(s => {
      if (!s.horario) return false
      const inicioExistente = aMinutos(s.horario)
      const finExistente = inicioExistente + (s.duracion ?? 60)
      return haySolapamiento(inicioNuevo, finNuevo, inicioExistente, finExistente)
    })

    if (chocaConSesion) {
      return NextResponse.json({ error: 'Ese horario ya fue reservado, elegí otro' }, { status: 409 })
    }

    // 3) No puede solaparse con un bloqueo personal del profesional.
    const { data: bloqueosDelDia } = await supabaseAdmin
      .from('bloqueos_personales')
      .select('hora_inicio, hora_fin')
      .eq('user_id', user_id)
      .eq('fecha', fecha)

    const chocaConBloqueo = (bloqueosDelDia || []).some(b => {
      const inicioB = aMinutos(b.hora_inicio)
      const finB = aMinutos(b.hora_fin)
      return haySolapamiento(inicioNuevo, finNuevo, inicioB, finB)
    })

    if (chocaConBloqueo) {
      return NextResponse.json({ error: 'Ese horario no está disponible, elegí otro' }, { status: 409 })
    }

    // Todo validado, se guarda el turno.
    const { data: sesion, error } = await supabaseAdmin
      .from('sesiones')
      .insert({
        cliente_id, fecha, horario, tipo_masaje, duracion,
        user_id, facturado: false, cobrado: false
      })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const sesionId = sesion?.[0]?.id ?? null

    await supabaseAdmin.from('notificaciones').insert([{
      user_id,
      titulo: '📅 Nuevo turno reservado',
      mensaje: `${cliente.nombre} agendó un turno para el ${fecha} a las ${horario}hs`,
      leida: false,
      sesion_id: sesionId,
      fecha_sesion: fecha
    }])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}