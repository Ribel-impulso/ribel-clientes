'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function generarSlots(horaInicio: string, horaFin: string, duracion: number): string[] {
  const slots: string[] = []
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)
  let totalMin = hI * 60 + mI
  const finMin = hF * 60 + mF
  while (totalMin + duracion <= finMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
    const m = String(totalMin % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    totalMin += duracion
  }
  return slots
}

function limpiarWA(numero: string): string {
  const soloDigitos = numero.replace(/\D/g, '')
  if (soloDigitos.startsWith('54')) return soloDigitos
  const sinCero = soloDigitos.startsWith('0') ? soloDigitos.slice(1) : soloDigitos
  return '54' + sinCero
}

type Paso = 'whatsapp' | 'servicio' | 'fecha' | 'horario' | 'confirmado'

export default function AgendaPublica() {
  const searchParams = useSearchParams()
  const profesionalId = searchParams.get('u')

  const [paso, setPaso] = useState<Paso>('whatsapp')
  const [whatsapp, setWhatsapp] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [esNuevo, setEsNuevo] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [servicios, setServicios] = useState<any[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null)
  const [disponibilidad, setDisponibilidad] = useState<any[]>([])
  const [sesionesOcupadas, setSesionesOcupadas] = useState<any[]>([])
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profesionalId) return
    async function cargar() {
      const { data: srv } = await supabase
        .from('servicios')
        .select('*')
        .eq('user_id', profesionalId)
        .order('nombre')
      if (srv) setServicios(srv)

      const { data: disp } = await supabase
        .from('disponibilidad')
        .select('*')
        .eq('user_id', profesionalId)
        .order('dia_semana')
      if (disp) setDisponibilidad(disp)
    }
    cargar()
  }, [profesionalId])

  useEffect(() => {
    if (!profesionalId) return
    async function cargarSesiones() {
      const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
      const ultimoDia = new Date(anio, mes + 1, 0)
      const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`
      const { data } = await supabase
        .from('sesiones')
        .select('fecha, horario, duracion')
        .eq('user_id', profesionalId)
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDiaStr)
      if (data) setSesionesOcupadas(data)
    }
    cargarSesiones()
  }, [anio, mes, profesionalId])

  // Sin user_id en la URL → pantalla de error
  if (!profesionalId) {
    return (
      <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
        <p style={{ fontSize: '40px' }}>🔗</p>
        <p>El link no es válido. Pedile al profesional que te comparta su link correcto.</p>
      </div>
    )
  }

  async function buscarCliente() {
    setError('')
    const numero = limpiarWA(whatsapp)
    if (numero.length < 10) { setError('Ingresá un número válido'); return }
    setCargando(true)

    const { data } = await supabase
      .from('clientes')
      .select('id, nombre')
      .eq('user_id', profesionalId)
      .eq('whatsapp', numero)
      .single()

    if (data) {
      setClienteId(data.id)
      setClienteNombre(data.nombre)
      setEsNuevo(false)
      setPaso('servicio')
    } else {
      setEsNuevo(true)
      setClienteId(null)
    }
    setCargando(false)
  }

  async function crearClienteYContinuar() {
    setError('')
    if (!nombreNuevo.trim()) { setError('Ingresá tu nombre'); return }
    setCargando(true)
    const numero = limpiarWA(whatsapp)
    const { data, error: err } = await supabase
      .from('clientes')
      .insert([{ nombre: nombreNuevo.trim(), whatsapp: numero, user_id: profesionalId }])
      .select('id, nombre')
      .single()

    if (err || !data) { setError('Hubo un error, intentá de nuevo'); setCargando(false); return }
    setClienteId(data.id)
    setClienteNombre(data.nombre)
    setPaso('servicio')
    setCargando(false)
  }

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const primerDiaMes = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const celdas: (number | null)[] = [
    ...Array(primerDiaMes).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1)
  ]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const fechaStr = (dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

  const diaEsAtendido = (dia: number) => {
    const f = fechaStr(dia)
    if (f < hoyStr) return false
    const diaSemana = new Date(f + 'T12:00:00').getDay()
    return disponibilidad.some(d => d.dia_semana === diaSemana && d.activo)
  }

  const dispDelDia = (() => {
    if (!diaSeleccionado) return null
    const diaSemana = new Date(diaSeleccionado + 'T12:00:00').getDay()
    return disponibilidad.find(d => d.dia_semana === diaSemana && d.activo) ?? null
  })()

  const slotsDelDia = dispDelDia
    ? generarSlots(dispDelDia.hora_inicio, dispDelDia.hora_fin, dispDelDia.duracion_turno)
    : []

  const slotEsLibre = (slot: string) => {
    const sesionesDelDia = sesionesOcupadas.filter(s => s.fecha === diaSeleccionado)
    const [h, m] = slot.split(':').map(Number)
    const slotMin = h * 60 + m
    return !sesionesDelDia.some(s => {
      if (!s.horario) return false
      const [sh, sm] = s.horario.substring(0, 5).split(':').map(Number)
      const inicio = sh * 60 + sm
      const dur = s.duracion ?? dispDelDia?.duracion_turno ?? 60
      return slotMin >= inicio && slotMin < inicio + dur
    })
  }

  async function confirmarTurno() {
    if (!clienteId || !diaSeleccionado || !horarioSeleccionado || !servicioSeleccionado) return
    setCargando(true)
    await supabase.from('sesiones').insert([{
      cliente_id: clienteId,
      fecha: diaSeleccionado,
      horario: horarioSeleccionado,
      tipo_masaje: servicioSeleccionado.nombre,
      duracion: servicioSeleccionado.duracion ?? dispDelDia?.duracion_turno ?? null,
      user_id: profesionalId,
      facturado: false,
      cobrado: false,
    }])
    setCargando(false)
    setPaso('confirmado')
  }

  const cambiarMes = (delta: number) => {
    const nueva = new Date(anio, mes + delta, 1)
    setAnio(nueva.getFullYear())
    setMes(nueva.getMonth())
    setDiaSeleccionado(null)
    setHorarioSeleccionado(null)
  }

  const labelFecha = diaSeleccionado
    ? new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const container: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#F5F0EB',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
  }
  const card: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  }
  const inp: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e3dfd6',
    fontSize: '15px',
    fontFamily: 'Arial',
    boxSizing: 'border-box' as const,
    marginBottom: '12px',
  }
  const btn: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    backgroundColor: '#ba9a7d',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'Arial',
  }

  return (
    <div style={container}>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ color: '#161616', margin: '0 0 6px', fontSize: '22px' }}>Reservá tu turno</h1>
        <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>Elegí el servicio, día y horario que más te convenga</p>
      </div>

      {/* PASO 1: WhatsApp */}
      {paso === 'whatsapp' && (
        <div style={card}>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>📱 Ingresá tu número de WhatsApp</h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
            Lo usamos para identificarte. Si ya sos cliente, tomamos tus datos automáticamente.
          </p>
          <input
            type="tel"
            placeholder="Ej: 3492123456"
            value={whatsapp}
            onChange={e => { setWhatsapp(e.target.value); setEsNuevo(false); setError('') }}
            style={inp}
          />
          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}

          {!esNuevo && (
            <button onClick={buscarCliente} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Buscando...' : 'Continuar'}
            </button>
          )}

          {esNuevo && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#D97706', fontSize: '13px', marginBottom: '12px' }}>
                No encontramos tu número. ¿Es tu primera vez? Ingresá tu nombre para registrarte.
              </p>
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={nombreNuevo}
                onChange={e => setNombreNuevo(e.target.value)}
                style={inp}
              />
              {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              <button onClick={crearClienteYContinuar} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Registrando...' : 'Registrarme y continuar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 2: Servicio */}
      {paso === 'servicio' && (
        <div style={card}>
          <p style={{ color: '#16A34A', fontWeight: 'bold', fontSize: '14px', marginTop: 0 }}>
            ¡Hola, {clienteNombre}! 👋
          </p>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>Elegí el servicio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {servicios.map(s => (
              <div
                key={s.id}
                onClick={() => { setServicioSeleccionado(s); setPaso('fecha') }}
                style={{
                  border: `2px solid ${servicioSeleccionado?.id === s.id ? '#ba9a7d' : '#e3dfd6'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  backgroundColor: servicioSeleccionado?.id === s.id ? '#fdf9f5' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <span style={{ fontWeight: 600, color: '#161616', fontSize: '15px' }}>{s.nombre}</span>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{s.duracion ?? 60} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASO 3: Fecha */}
      {paso === 'fecha' && (
        <div style={card}>
          <button onClick={() => setPaso('servicio')} style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px' }}>
            ← Volver
          </button>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>
            {servicioSeleccionado?.nombre} · Elegí el día
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              onClick={() => cambiarMes(-1)}
              disabled={anio === hoy.getFullYear() && mes === hoy.getMonth()}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px' }}>
              ‹
            </button>
            <span style={{ fontWeight: 600, color: '#161616' }}>{MESES[mes]} {anio}</span>
            <button onClick={() => cambiarMes(1)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DIAS_SEMANA_CORTO.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={i} />
              const f = fechaStr(dia)
              const atendido = diaEsAtendido(dia)
              const seleccionado = f === diaSeleccionado
              const pasado = f < hoyStr
              return (
                <div
                  key={i}
                  onClick={() => { if (atendido) { setDiaSeleccionado(f); setPaso('horario') } }}
                  style={{
                    textAlign: 'center',
                    padding: '10px 4px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: seleccionado ? 700 : 400,
                    cursor: atendido ? 'pointer' : 'default',
                    backgroundColor: seleccionado ? '#ba9a7d' : atendido ? '#fdf9f5' : 'transparent',
                    color: seleccionado ? '#fff' : pasado ? '#D1D5DB' : atendido ? '#161616' : '#D1D5DB',
                    border: atendido && !seleccionado ? '1px solid #e3dfd6' : seleccionado ? '1px solid #ba9a7d' : '1px solid transparent',
                  }}>
                  {dia}
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px', textAlign: 'center' }}>
            Solo se muestran los días disponibles para reservar
          </p>
        </div>
      )}

      {/* PASO 4: Horario */}
      {paso === 'horario' && diaSeleccionado && (
        <div style={card}>
          <button onClick={() => { setPaso('fecha'); setHorarioSeleccionado(null) }} style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px' }}>
            ← Volver
          </button>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px', textTransform: 'capitalize' }}>
            {labelFecha}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>Elegí un horario disponible</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {slotsDelDia.map(slot => {
              const libre = slotEsLibre(slot)
              const selec = slot === horarioSeleccionado
              return (
                <div
                  key={slot}
                  onClick={() => { if (libre) setHorarioSeleccionado(slot) }}
                  style={{
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: selec ? 700 : 500,
                    cursor: libre ? 'pointer' : 'not-allowed',
                    backgroundColor: selec ? '#ba9a7d' : libre ? '#fdf9f5' : '#F3F4F6',
                    color: selec ? '#fff' : libre ? '#161616' : '#9CA3AF',
                    border: selec ? '2px solid #ba9a7d' : libre ? '1px solid #e3dfd6' : '1px solid #E5E7EB',
                    textDecoration: !libre ? 'line-through' : 'none',
                  }}>
                  {slot}
                </div>
              )
            })}
          </div>

          {horarioSeleccionado && (
            <button onClick={confirmarTurno} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Confirmando...' : `Confirmar turno a las ${horarioSeleccionado}`}
            </button>
          )}
        </div>
      )}

      {/* PASO 5: Confirmado */}
      {paso === 'confirmado' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#16A34A', marginTop: 0, fontSize: '20px' }}>¡Turno registrado!</h2>
          <p style={{ color: '#161616', fontSize: '15px', marginBottom: '8px' }}>
            <strong>{clienteNombre}</strong>, tu turno fue agendado para el
          </p>
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#161616', textTransform: 'capitalize', fontSize: '15px' }}>{labelFecha}</p>
            <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '14px' }}>🕐 {horarioSeleccionado} hs</p>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>💆 {servicioSeleccionado?.nombre}</p>
          </div>
          <div style={{ backgroundColor: '#FFF8F0', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#92400E', fontSize: '13px', lineHeight: '1.5' }}>
              📲 Para cancelar o reprogramar tu turno, comunicate por WhatsApp con el profesional.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}