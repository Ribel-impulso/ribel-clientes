'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Códigos de discado más comunes. Agregá o quitá según los países de tus clientes.
// "Argentina" queda primero porque es el default, el resto en orden alfabético.
const PAISES = [
  { nombre: 'Argentina', dial: '54', flag: '🇦🇷' },
  { nombre: 'Bolivia', dial: '591', flag: '🇧🇴' },
  { nombre: 'Brasil', dial: '55', flag: '🇧🇷' },
  { nombre: 'Chile', dial: '56', flag: '🇨🇱' },
  { nombre: 'Colombia', dial: '57', flag: '🇨🇴' },
  { nombre: 'España', dial: '34', flag: '🇪🇸' },
  { nombre: 'Estados Unidos', dial: '1', flag: '🇺🇸' },
  { nombre: 'México', dial: '52', flag: '🇲🇽' },
  { nombre: 'Paraguay', dial: '595', flag: '🇵🇾' },
  { nombre: 'Perú', dial: '51', flag: '🇵🇪' },
  { nombre: 'Uruguay', dial: '598', flag: '🇺🇾' },
]

interface Bloque {
  inicio: string
  fin: string
  duracion: number
}

// Genera los horarios de inicio posibles dentro de un bloque, pero SOLO si el
// servicio elegido (duracionServicio) entra completo antes de que termine el bloque.
// "intervalo" es el paso entre turnos (ej: cada 30 min), independiente de cuánto dure el servicio.
function generarSlots(horaInicio: string, horaFin: string, intervalo: number, duracionServicio: number): string[] {
  const slots: string[] = []
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)
  let totalMin = hI * 60 + mI
  const finMin = hF * 60 + mF
  while (totalMin + duracionServicio <= finMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
    const m = String(totalMin % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    totalMin += intervalo
  }
  return slots
}

function haySolapamiento(inicioA: number, finA: number, inicioB: number, finB: number): boolean {
  return inicioA < finB && finA > inicioB
}

function limpiarWA(numero: string): string {
  return numero.replace(/\D/g, '')
}

type Paso = 'whatsapp' | 'servicio' | 'fecha' | 'horario' | 'confirmado'

export default function AgendaPublicaCliente() {
  const searchParams = useSearchParams()
  const profesionalId = searchParams.get('u')

  const [paso, setPaso] = useState<Paso>('whatsapp')
  const [whatsapp, setWhatsapp] = useState('')
  const [paisDial, setPaisDial] = useState('54') // Argentina por defecto, el usuario puede cambiarlo
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [esNuevo, setEsNuevo] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [servicios, setServicios] = useState<any[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null)
  const [disponibilidad, setDisponibilidad] = useState<any[]>([])
  const [sesionesOcupadas, setSesionesOcupadas] = useState<any[]>([])
  const [bloqueosOcupados, setBloqueosOcupados] = useState<any[]>([])
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [configNegocio, setConfigNegocio] = useState<any>(null)
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([])

  const [datosListos, setDatosListos] = useState(false)

  useEffect(() => {
    if (!profesionalId) return
    async function cargar() {
      const [{ data: srv }, { data: disp }, { data: config }] = await Promise.all([
        supabase.from('servicios').select('*').eq('user_id', profesionalId).order('nombre'),
        supabase.from('disponibilidad').select('*').eq('user_id', profesionalId).order('dia_semana'),
        supabase.from('configuracion_negocio').select('*').eq('user_id', profesionalId).maybeSingle()
      ])
      if (srv) setServicios(srv)
      if (disp) setDisponibilidad(disp)
      if (config) setConfigNegocio(config)
      setDatosListos(true)
    }
    cargar()
  }, [profesionalId])

  useEffect(() => {
    if (!profesionalId) return
    async function cargarSesionesYBloqueos() {
      const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
      const ultimoDia = new Date(anio, mes + 1, 0)
      const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`

      const { data: sesiones } = await supabase.from('sesiones').select('fecha, horario, duracion').eq('user_id', profesionalId).gte('fecha', primerDia).lte('fecha', ultimoDiaStr)
      if (sesiones) setSesionesOcupadas(sesiones)

      // Bloqueos personales del profesional: nunca se muestra el motivo,
      // solo se usan para saber qué horarios NO están disponibles.
      const { data: bloqueos } = await supabase
        .from('bloqueos_personales')
        .select('fecha, hora_inicio, hora_fin')
        .eq('user_id', profesionalId)
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDiaStr)
      if (bloqueos) setBloqueosOcupados(bloqueos)

      const { data: diasBloq } = await supabase
        .from('dias_bloqueados')
        .select('fecha')
        .eq('user_id', profesionalId)
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDiaStr)
      if (diasBloq) setDiasBloqueados(diasBloq.map((d: any) => d.fecha))
    }
    cargarSesionesYBloqueos()
  }, [anio, mes, profesionalId])

  if (!profesionalId) {
    return (
      <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
        <p style={{ fontSize: '40px' }}>🔗</p>
        <p>El link no es válido. Pedile al profesional que te comparta su link correcto.</p>
      </div>
    )
  }

  // Arma el número completo con código de país, siempre sin "+" y solo dígitos.
  // Ej: paisDial "598" + whatsapp "99209088" => "59899209088"
  function numeroCompleto(): string {
    return `${paisDial}${limpiarWA(whatsapp)}`
  }

  async function buscarCliente() {
    setError('')
    const local = limpiarWA(whatsapp)
    if (local.length < 6) { setError('Ingresá un número válido'); return }
    setCargando(true)
    const numero = numeroCompleto()
    const { data } = await supabase.from('clientes').select('id, nombre').eq('user_id', profesionalId).eq('whatsapp', numero).single()
    if (data) {
      setClienteId(data.id); setClienteNombre(data.nombre); setEsNuevo(false); setPaso('servicio')
    } else {
      setEsNuevo(true); setClienteId(null)
    }
    setCargando(false)
  }

  async function crearClienteYContinuar() {
    setError('')
    if (!nombreNuevo.trim()) { setError('Ingresá tu nombre'); return }
    setCargando(true)
    const numero = numeroCompleto()
    const { data, error: err } = await supabase.from('clientes').insert([{ nombre: nombreNuevo.trim(), whatsapp: numero, user_id: profesionalId }]).select('id, nombre').single()
    if (err || !data) { setError('Hubo un error, intentá de nuevo'); setCargando(false); return }
    setClienteId(data.id); setClienteNombre(data.nombre); setPaso('servicio'); setCargando(false)
  }

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const primerDiaMes = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const celdas: (number | null)[] = [...Array(primerDiaMes).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const fechaStr = (dia: number) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

  const diaEsAtendido = (dia: number) => {
    const f = fechaStr(dia)
    if (f < hoyStr) return false
    if (diasBloqueados.includes(f)) return false
    const diaSemana = new Date(f + 'T12:00:00').getDay()
    return disponibilidad.some(d => d.dia_semana === diaSemana && d.activo)
  }

  const dispDelDia = (() => {
    if (!diaSeleccionado) return null
    const diaSemana = new Date(diaSeleccionado + 'T12:00:00').getDay()
    return disponibilidad.find(d => d.dia_semana === diaSemana && d.activo) ?? null
  })()

  const requiereSeniaEsteServicio = !!(configNegocio?.requiere_senia && servicioSeleccionado?.precio && servicioSeleccionado?.porcentaje_senia)
  const montoSenia = requiereSeniaEsteServicio ? Math.round(servicioSeleccionado.precio * (servicioSeleccionado.porcentaje_senia / 100)) : null

  function enviarComprobanteWA() {
    if (!configNegocio?.whatsapp_profesional) return
    const numero = limpiarWA(configNegocio.whatsapp_profesional)
    const msg = `Hola! Soy ${clienteNombre}, reservé ${servicioSeleccionado?.nombre} para el ${labelFecha} a las ${horarioSeleccionado}hs. Ya transferí la seña de $${montoSenia}. Te mando el comprobante 👇`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const bloquesDelDia: Bloque[] = Array.isArray(dispDelDia?.bloques) ? dispDelDia.bloques : []
  const duracionServicio: number = servicioSeleccionado?.duracion ?? 60

  // Un slot es libre si el servicio elegido (desde el horario del slot hasta
  // slot + duración) no se solapa con ninguna sesión reservada ni con
  // ningún bloqueo personal del profesional.
  const slotEsLibre = (slot: string) => {
    const [h, m] = slot.split(':').map(Number)
    const inicioNuevo = h * 60 + m
    const finNuevo = inicioNuevo + duracionServicio

    const chocaConSesion = sesionesOcupadas
      .filter(s => s.fecha === diaSeleccionado)
      .some(s => {
        if (!s.horario) return false
        const [sh, sm] = s.horario.substring(0, 5).split(':').map(Number)
        const inicioExistente = sh * 60 + sm
        const finExistente = inicioExistente + (s.duracion ?? 60)
        return haySolapamiento(inicioNuevo, finNuevo, inicioExistente, finExistente)
      })
    if (chocaConSesion) return false

    const chocaConBloqueo = bloqueosOcupados
      .filter(b => b.fecha === diaSeleccionado)
      .some(b => {
        const [bih, bim] = b.hora_inicio.substring(0, 5).split(':').map(Number)
        const [bfh, bfm] = b.hora_fin.substring(0, 5).split(':').map(Number)
        const inicioB = bih * 60 + bim
        const finB = bfh * 60 + bfm
        return haySolapamiento(inicioNuevo, finNuevo, inicioB, finB)
      })
    return !chocaConBloqueo
  }

  async function confirmarTurno() {
    if (!clienteId || !diaSeleccionado || !horarioSeleccionado || !servicioSeleccionado) return
    if (!datosListos) { setError('Todavía estamos cargando datos, esperá un segundo e intentá de nuevo'); return }
    setCargando(true)
    const res = await fetch('/api/reservar-turno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: clienteId,
        fecha: diaSeleccionado,
        horario: horarioSeleccionado,
        tipo_masaje: servicioSeleccionado.nombre,
        duracion: duracionServicio,
        user_id: profesionalId,
        monto: servicioSeleccionado.precio ?? null,
        monto_senia_esperada: montoSenia
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al confirmar'); setCargando(false); return }
    setCargando(false)
    setPaso('confirmado')
  }

  const cambiarMes = (delta: number) => {
    const nueva = new Date(anio, mes + delta, 1)
    setAnio(nueva.getFullYear()); setMes(nueva.getMonth()); setDiaSeleccionado(null); setHorarioSeleccionado(null)
  }

  const labelFecha = diaSeleccionado
    ? new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const container: React.CSSProperties = { fontFamily: 'Arial, sans-serif', backgroundColor: '#F5F0EB', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }
  const contenido: React.CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 32px' }
  const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '16px' }
  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e3dfd6', fontSize: '15px', fontFamily: 'Arial', boxSizing: 'border-box' as const, marginBottom: '12px' }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', backgroundColor: '#ba9a7d', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }

  const tieneImagen = !!configNegocio?.logo_url

  return (
    <div style={container}>
  
      {/* Contenido: logo superpuesto, nombre, ubicación, y luego las tarjetas del flujo */}
      <div style={{ ...contenido, paddingTop: '32px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          {tieneImagen && (
            <img
              src={configNegocio.logo_url}
              alt={configNegocio?.nombre_negocio || 'Logo'}
              style={{
                width: '104px', height: '104px', borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                marginBottom: '12px',
              }}
            />
          )}
          {configNegocio?.nombre_negocio && (
            <h1 style={{ color: '#161616', margin: '0 0 4px', fontSize: '20px', textAlign: 'center' }}>
              {configNegocio.nombre_negocio}
            </h1>
          )}
          {configNegocio?.ubicacion && (
            <p style={{ color: '#8a8378', margin: '0 0 10px', fontSize: '13px', textAlign: 'center' }}>
              📍 {configNegocio.ubicacion}
            </p>
          )}
          <h2 style={{ color: '#161616', margin: '4px 0 4px', fontSize: '17px' }}>Reservá tu turno</h2>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '13px', textAlign: 'center' }}>Elegí el servicio, día y horario que más te convenga</p>
        </div>

      {paso === 'whatsapp' && (
        <div style={card}>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>📱 Ingresá tu número de WhatsApp</h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>Lo usamos para identificarte. Si ya sos cliente, tomamos tus datos automáticamente.</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              value={paisDial}
              onChange={e => { setPaisDial(e.target.value); setEsNuevo(false); setError('') }}
              style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e3dfd6', fontSize: '14px', fontFamily: 'Arial', backgroundColor: '#fff', flex: '0 0 130px' }}
            >
              {PAISES.map(p => (
                <option key={p.dial} value={p.dial}>{p.flag} +{p.dial}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Ej: 3492123456"
              value={whatsapp}
              onChange={e => { setWhatsapp(e.target.value); setEsNuevo(false); setError('') }}
              style={{ ...inp, marginBottom: 0, flex: 1 }}
            />
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 12px' }}>Elegí tu país si no sos de Argentina, y escribí el número sin el 0 ni el código de país.</p>

          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
          {!esNuevo && (
            <button onClick={buscarCliente} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Buscando...' : 'Continuar'}
            </button>
          )}
          {esNuevo && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#D97706', fontSize: '13px', marginBottom: '12px' }}>No encontramos tu número. ¿Es tu primera vez? Ingresá tu nombre para registrarte.</p>
              <input type="text" placeholder="Tu nombre completo" value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} style={inp} />
              {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              <button onClick={crearClienteYContinuar} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Registrando...' : 'Registrarme y continuar'}
              </button>
            </div>
          )}
        </div>
      )}

      {paso === 'servicio' && (
        <div style={card}>
          <p style={{ color: '#16A34A', fontWeight: 'bold', fontSize: '14px', marginTop: 0 }}>¡Hola, {clienteNombre}! 👋</p>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>Elegí el servicio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {servicios.map(s => {
              const seniaDeEsteServicio = configNegocio?.requiere_senia && s.precio && s.porcentaje_senia
                ? Math.round(s.precio * (s.porcentaje_senia / 100)) : null
              return (
                <div key={s.id} onClick={() => { setServicioSeleccionado(s); setPaso('fecha') }}
                  style={{ border: `2px solid ${servicioSeleccionado?.id === s.id ? '#ba9a7d' : '#e3dfd6'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', backgroundColor: servicioSeleccionado?.id === s.id ? '#fdf9f5' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#161616', fontSize: '15px' }}>{s.nombre}</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{s.duracion ?? 60} min{s.precio ? ` · $${s.precio}` : ''}</span>
                  </div>
                  {seniaDeEsteServicio && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#D97706' }}>💰 Requiere seña de ${seniaDeEsteServicio} para confirmar</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {paso === 'fecha' && (
        <div style={card}>
          <button onClick={() => setPaso('servicio')} style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px' }}>← Volver</button>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px' }}>{servicioSeleccionado?.nombre} · Elegí el día</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => cambiarMes(-1)} disabled={anio === hoy.getFullYear() && mes === hoy.getMonth()} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
            <span style={{ fontWeight: 600, color: '#161616' }}>{MESES[mes]} {anio}</span>
            <button onClick={() => cambiarMes(1)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px' }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DIAS_SEMANA_CORTO.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={i} />
              const f = fechaStr(dia)
              const atendido = diaEsAtendido(dia)
              const seleccionado = f === diaSeleccionado
              const pasado = f < hoyStr
              return (
                <div key={i} onClick={() => { if (atendido) { setDiaSeleccionado(f); setPaso('horario') } }}
                  style={{ textAlign: 'center', padding: '10px 4px', borderRadius: '8px', fontSize: '14px', fontWeight: seleccionado ? 700 : 400, cursor: atendido ? 'pointer' : 'default', backgroundColor: seleccionado ? '#ba9a7d' : atendido ? '#fdf9f5' : 'transparent', color: seleccionado ? '#fff' : pasado ? '#D1D5DB' : atendido ? '#161616' : '#D1D5DB', border: atendido && !seleccionado ? '1px solid #e3dfd6' : seleccionado ? '1px solid #ba9a7d' : '1px solid transparent' }}>
                  {dia}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px', textAlign: 'center' }}>Solo se muestran los días disponibles para reservar</p>
        </div>
      )}

      {paso === 'horario' && diaSeleccionado && (
        <div style={card}>
          <button onClick={() => { setPaso('fecha'); setHorarioSeleccionado(null) }} style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px' }}>← Volver</button>
          <h2 style={{ color: '#161616', marginTop: 0, fontSize: '17px', textTransform: 'capitalize' }}>{labelFecha}</h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>Elegí un horario disponible</p>
          <div style={{ marginBottom: '20px' }}>
            {bloquesDelDia.map((bloque, idx) => {
              const slots = generarSlots(bloque.inicio, bloque.fin, bloque.duracion, duracionServicio)
              if (slots.length === 0) return null
              return (
                <div key={idx} style={{ marginBottom: idx < bloquesDelDia.length - 1 ? '16px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e3dfd6' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#ba9a7d', whiteSpace: 'nowrap' }}>{bloque.inicio} a {bloque.fin}</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e3dfd6' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {slots.map(slot => {
                      const libre = slotEsLibre(slot)
                      const selec = slot === horarioSeleccionado
                      return (
                        <div key={slot} onClick={() => { if (libre) setHorarioSeleccionado(slot) }}
                          style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: selec ? 700 : 500, cursor: libre ? 'pointer' : 'not-allowed', backgroundColor: selec ? '#ba9a7d' : libre ? '#fdf9f5' : '#F3F4F6', color: selec ? '#fff' : libre ? '#161616' : '#9CA3AF', border: selec ? '2px solid #ba9a7d' : libre ? '1px solid #e3dfd6' : '1px solid #E5E7EB', textDecoration: !libre ? 'line-through' : 'none' }}>
                          {slot}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {bloquesDelDia.every(b => generarSlots(b.inicio, b.fin, b.duracion, duracionServicio).length === 0) && (
              <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                No hay horarios disponibles para este servicio en el día elegido (la duración del servicio no entra en los bloques configurados).
              </p>
            )}
          </div>
          {horarioSeleccionado && (
            <button onClick={confirmarTurno} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Confirmando...' : `Confirmar turno a las ${horarioSeleccionado}`}
            </button>
          )}
        </div>
      )}

      {paso === 'confirmado' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#16A34A', marginTop: 0, fontSize: '20px' }}>¡Turno registrado!</h2>
          <p style={{ color: '#161616', fontSize: '15px', marginBottom: '8px' }}><strong>{clienteNombre}</strong>, tu turno fue agendado para el</p>
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#161616', textTransform: 'capitalize', fontSize: '15px' }}>{labelFecha}</p>
            <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '14px' }}>🕐 {horarioSeleccionado} hs</p>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>💆 {servicioSeleccionado?.nombre}</p>
          </div>
          <div style={{ backgroundColor: '#FFF8F0', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#92400E', fontSize: '13px', lineHeight: '1.5' }}>
              📲 Para cancelar o reprogramar tu turno, comunicate por WhatsApp con el profesional.
            </p>
            {requiereSeniaEsteServicio && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px', marginTop: '16px', textAlign: 'left' }}>
                <p style={{ margin: '0 0 10px', color: '#92400E', fontWeight: 700, fontSize: '14px' }}>💰 Para confirmar tu turno, transferí la seña</p>
                <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#161616' }}>Monto: <strong>${montoSenia}</strong></p>
                {configNegocio?.alias_transferencia && <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#161616' }}>Alias/CBU: {configNegocio.alias_transferencia}</p>}
                {configNegocio?.titular_cuenta && <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#161616' }}>Titular: {configNegocio.titular_cuenta}</p>}
                {configNegocio?.banco && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#161616' }}>Banco: {configNegocio.banco}</p>}
                <button onClick={enviarComprobanteWA} style={{ width: '100%', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  📲 Enviar comprobante por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}