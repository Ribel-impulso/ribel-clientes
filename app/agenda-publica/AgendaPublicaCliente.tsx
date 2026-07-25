'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// Misma paleta que el resto de la app.
const INK = '#1B2420'
const PAPER = '#F4EFE4'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_BG = 'rgba(168,127,76,0.1)'
const SAGE = '#5E7A5A'
const SAGE_BG = '#EAF0E8'
const CLAY = '#A85A44'
const CLAY_BG = '#F5E9E5'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'
const FONT_SERIF = "'Source Serif 4', serif"
const FONT_SANS = "'Public Sans', sans-serif"

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
  const [filtroCategoriaPublico, setFiltroCategoriaPublico] = useState('')
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

  // Trial vencido: mismo criterio que en el panel interno (tabla suscripciones,
  // último registro por user_id, estado vencida/cancelada o fecha_vencimiento pasada).
  const [agendaBloqueada, setAgendaBloqueada] = useState(false)

  const [datosListos, setDatosListos] = useState(false)

  useEffect(() => {
    if (!profesionalId) return
    async function cargar() {
      const [{ data: srv }, { data: disp }, { data: config }, { data: suscripcion }] = await Promise.all([
        supabase.from('servicios').select('*').eq('user_id', profesionalId).order('nombre'),
        supabase.from('disponibilidad').select('*').eq('user_id', profesionalId).order('dia_semana'),
        supabase.from('configuracion_negocio_publica').select('*').eq('user_id', profesionalId).maybeSingle(),
        supabase.from('suscripciones').select('*').eq('user_id', profesionalId).order('created_at', { ascending: false }).limit(1).single()
      ])
      if (srv) setServicios(srv)
      if (disp) setDisponibilidad(disp)
      if (config) setConfigNegocio(config)

      // Si no hay registro de suscripción (ej: los usuarios con acceso manual/canje),
      // no se bloquea: se comporta igual que en el panel interno.
      if (suscripcion) {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const vencimiento = new Date(suscripcion.fecha_vencimiento + 'T00:00:00')
        const vencida = vencimiento.getTime() < hoy.getTime()
        const estadoBloqueado = suscripcion.estado === 'vencida' || suscripcion.estado === 'cancelada'
        if (vencida || estadoBloqueado) setAgendaBloqueada(true)
      }

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
      <div style={{ fontFamily: FONT_SANS, textAlign: 'center', padding: '60px 24px', color: MUTED, backgroundColor: PAPER, minHeight: '100vh' }}>
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

  // Categorías para el filtro del paso "servicio"
  const categoriasUnicasPublico = Array.from(new Set(servicios.map((s: any) => s.categoria).filter(Boolean))) as string[]
  const serviciosFiltradosPublico = filtroCategoriaPublico
    ? servicios.filter((s: any) => s.categoria === filtroCategoriaPublico)
    : servicios

  const container: React.CSSProperties = {
    fontFamily: FONT_SANS,
    backgroundColor: PAPER,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(27,36,32,0.035) 28px), radial-gradient(rgba(27,36,32,0.05) 1px, transparent 1px)',
    backgroundSize: 'auto, 14px 14px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
  const contenido: React.CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 32px' }
  const card: React.CSSProperties = { backgroundColor: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '18px', padding: '28px 24px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 12px rgba(27,36,32,0.06)', marginBottom: '16px' }
  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${LINE}`, fontSize: '15px', fontFamily: FONT_SANS, boxSizing: 'border-box' as const, marginBottom: '12px', color: INK, backgroundColor: PAPER_2 }
  const btn: React.CSSProperties = { width: '100%', padding: '13px', backgroundColor: INK, color: PAPER_2, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT_SANS }

  const categoriaPillBtn = (activa: boolean): React.CSSProperties => ({
    padding: '6px 13px',
    borderRadius: '100px',
    border: activa ? `1px solid ${BRASS}` : `1px solid ${LINE}`,
    backgroundColor: activa ? BRASS_BG : PAPER_2,
    color: activa ? BRASS : MUTED,
    fontFamily: FONT_SANS,
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  const tieneImagen = !!configNegocio?.logo_url

  const IconPin = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
  )
  const IconCheck = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
  )
  const IconClock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  )
  const IconClosed = () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
  )

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
                border: `4px solid ${PAPER_2}`,
                boxShadow: '0 4px 16px rgba(27,36,32,0.2)',
                marginBottom: '12px',
              }}
            />
          )}
          {configNegocio?.nombre_negocio && (
            <h1 style={{ color: INK, margin: '0 0 4px', fontSize: '22px', textAlign: 'center', fontFamily: FONT_SERIF, fontWeight: 600 }}>
              {configNegocio.nombre_negocio}
            </h1>
          )}
          {configNegocio?.ubicacion && (
            <p style={{ color: MUTED, margin: '0 0 10px', fontSize: '13px', textAlign: 'center' }}>
              <IconPin />{configNegocio.ubicacion}
            </p>
          )}
          {!agendaBloqueada && (
            <>
              <h2 style={{ color: INK, margin: '4px 0 4px', fontSize: '16px', fontFamily: FONT_SERIF, fontWeight: 600 }}>Reservá tu turno</h2>
              <p style={{ color: MUTED, margin: 0, fontSize: '13px', textAlign: 'center' }}>Elegí el servicio, día y horario que más te convenga</p>
            </>
          )}
        </div>

      {agendaBloqueada ? (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}><IconClosed /></div>
          <h2 style={{ color: INK, marginTop: 0, fontSize: '17px', fontFamily: FONT_SERIF, fontWeight: 600 }}>Agenda no disponible temporalmente</h2>
          <p style={{ color: MUTED, fontSize: '14px', margin: 0 }}>
            Por el momento no se pueden reservar turnos por acá. Volvé a intentarlo más tarde.
          </p>
        </div>
      ) : (
      <>
      {paso === 'whatsapp' && (
        <div style={card}>
          <h2 style={{ color: INK, marginTop: 0, fontSize: '17px', fontFamily: FONT_SERIF, fontWeight: 600 }}>Ingresá tu número de WhatsApp</h2>
          <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }}>Lo usamos para identificarte. Si ya sos cliente, tomamos tus datos automáticamente.</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              value={paisDial}
              onChange={e => { setPaisDial(e.target.value); setEsNuevo(false); setError('') }}
              style={{ padding: '12px 8px', borderRadius: '10px', border: `1.5px solid ${LINE}`, fontSize: '14px', fontFamily: FONT_SANS, backgroundColor: PAPER_2, color: INK, flex: '0 0 130px' }}
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
          <p style={{ color: MUTED, fontSize: '12px', margin: '0 0 12px' }}>Elegí tu país si no sos de Argentina, y escribí el número sin el 0 ni el código de país.</p>

          {error && <p style={{ color: CLAY, fontSize: '13px', margin: '0 0 12px', fontWeight: 600 }}>{error}</p>}
          {!esNuevo && (
            <button onClick={buscarCliente} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Buscando...' : 'Continuar'}
            </button>
          )}
          {esNuevo && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: BRASS, fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>No encontramos tu número. ¿Es tu primera vez? Ingresá tu nombre para registrarte.</p>
              <input type="text" placeholder="Tu nombre completo" value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} style={inp} />
              {error && <p style={{ color: CLAY, fontSize: '13px', margin: '0 0 12px', fontWeight: 600 }}>{error}</p>}
              <button onClick={crearClienteYContinuar} disabled={cargando} style={{ ...btn, opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Registrando...' : 'Registrarme y continuar'}
              </button>
            </div>
          )}
        </div>
      )}

      {paso === 'servicio' && (
        <div style={card}>
          <p style={{ color: SAGE, fontWeight: 700, fontSize: '14px', marginTop: 0 }}>¡Hola, {clienteNombre}!</p>
          <h2 style={{ color: INK, marginTop: 0, fontSize: '17px', fontFamily: FONT_SERIF, fontWeight: 600 }}>Elegí el servicio</h2>

          {categoriasUnicasPublico.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button onClick={() => setFiltroCategoriaPublico('')} style={categoriaPillBtn(filtroCategoriaPublico === '')}>Todas</button>
              {categoriasUnicasPublico.map(cat => (
                <button key={cat} onClick={() => setFiltroCategoriaPublico(cat)} style={categoriaPillBtn(filtroCategoriaPublico === cat)}>{cat}</button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {serviciosFiltradosPublico.map((s: any) => {
              const seniaDeEsteServicio = configNegocio?.requiere_senia && s.precio && s.porcentaje_senia
                ? Math.round(s.precio * (s.porcentaje_senia / 100)) : null
              const seleccionado = servicioSeleccionado?.id === s.id
              return (
                <div key={s.id} onClick={() => { setServicioSeleccionado(s); setPaso('fecha') }}
                  style={{ border: `2px solid ${seleccionado ? INK : LINE}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', backgroundColor: seleccionado ? PAPER : PAPER_2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: INK, fontSize: '15px', fontFamily: FONT_SANS }}>{s.nombre}</span>
                    <span style={{ fontSize: '13px', color: MUTED }}>{s.duracion ?? 60} min{s.precio ? ` · $${s.precio}` : ''}</span>
                  </div>
                  {s.categoria && (
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontWeight: 700, color: BRASS, backgroundColor: BRASS_BG, padding: '2px 9px', borderRadius: '100px' }}>
                      {s.categoria}
                    </span>
                  )}
                  {seniaDeEsteServicio && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: BRASS, fontWeight: 600 }}>Requiere seña de ${seniaDeEsteServicio} para confirmar</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {paso === 'fecha' && (
        <div style={card}>
          <button onClick={() => setPaso('servicio')} style={{ background: 'none', border: 'none', color: BRASS, cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px', fontWeight: 600, fontFamily: FONT_SANS }}>← Volver</button>
          <h2 style={{ color: INK, marginTop: 0, fontSize: '17px', fontFamily: FONT_SERIF, fontWeight: 600 }}>{servicioSeleccionado?.nombre} · Elegí el día</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => cambiarMes(-1)} disabled={anio === hoy.getFullYear() && mes === hoy.getMonth()} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px', color: INK }}>‹</button>
            <span style={{ fontWeight: 600, color: INK, fontFamily: FONT_SERIF }}>{MESES[mes]} {anio}</span>
            <button onClick={() => cambiarMes(1)} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '16px', color: INK }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DIAS_SEMANA_CORTO.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: MUTED, padding: '4px 0' }}>{d}</div>)}
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
                  style={{ textAlign: 'center', padding: '10px 4px', borderRadius: '8px', fontSize: '14px', fontWeight: seleccionado ? 700 : 400, cursor: atendido ? 'pointer' : 'default', backgroundColor: seleccionado ? INK : atendido ? PAPER : 'transparent', color: seleccionado ? PAPER_2 : pasado ? '#C7BFA9' : atendido ? INK : '#C7BFA9', border: atendido && !seleccionado ? `1px solid ${LINE}` : seleccionado ? `1px solid ${INK}` : '1px solid transparent' }}>
                  {dia}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '12px', color: MUTED, marginTop: '12px', textAlign: 'center' }}>Solo se muestran los días disponibles para reservar</p>
        </div>
      )}

      {paso === 'horario' && diaSeleccionado && (
        <div style={card}>
          <button onClick={() => { setPaso('fecha'); setHorarioSeleccionado(null) }} style={{ background: 'none', border: 'none', color: BRASS, cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '12px', fontWeight: 600, fontFamily: FONT_SANS }}>← Volver</button>
          <h2 style={{ color: INK, marginTop: 0, fontSize: '17px', textTransform: 'capitalize', fontFamily: FONT_SERIF, fontWeight: 600 }}>{labelFecha}</h2>
          <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }}>Elegí un horario disponible</p>
          <div style={{ marginBottom: '20px' }}>
            {bloquesDelDia.map((bloque, idx) => {
              const slots = generarSlots(bloque.inicio, bloque.fin, bloque.duracion, duracionServicio)
              if (slots.length === 0) return null
              return (
                <div key={idx} style={{ marginBottom: idx < bloquesDelDia.length - 1 ? '16px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: LINE }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: BRASS, whiteSpace: 'nowrap' }}>{bloque.inicio} a {bloque.fin}</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: LINE }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {slots.map(slot => {
                      const libre = slotEsLibre(slot)
                      const selec = slot === horarioSeleccionado
                      return (
                        <div key={slot} onClick={() => { if (libre) setHorarioSeleccionado(slot) }}
                          style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: selec ? 700 : 500, cursor: libre ? 'pointer' : 'not-allowed', backgroundColor: selec ? INK : libre ? SAGE_BG : PAPER, color: selec ? PAPER_2 : libre ? SAGE : MUTED, border: selec ? `2px solid ${INK}` : libre ? `1px solid ${LINE}` : `1px solid ${LINE}`, textDecoration: !libre ? 'line-through' : 'none' }}>
                          {slot}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {bloquesDelDia.every(b => generarSlots(b.inicio, b.fin, b.duracion, duracionServicio).length === 0) && (
              <p style={{ color: MUTED, fontSize: '13px', textAlign: 'center' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><IconCheck /></div>
          <h2 style={{ color: SAGE, marginTop: 0, fontSize: '20px', fontFamily: FONT_SERIF, fontWeight: 600 }}>¡Turno registrado!</h2>
          <p style={{ color: INK, fontSize: '15px', marginBottom: '8px' }}><strong>{clienteNombre}</strong>, tu turno fue agendado para el</p>
          <div style={{ backgroundColor: SAGE_BG, borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: INK, textTransform: 'capitalize', fontSize: '15px' }}>{labelFecha}</p>
            <p style={{ margin: '0 0 4px', color: MUTED, fontSize: '14px' }}><IconClock />{horarioSeleccionado} hs</p>
            <p style={{ margin: 0, color: MUTED, fontSize: '14px' }}>{servicioSeleccionado?.nombre}</p>
          </div>
          <div style={{ backgroundColor: BRASS_BG, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px' }}>
            <p style={{ margin: 0, color: BRASS, fontSize: '13px', lineHeight: '1.5', fontWeight: 600 }}>
              Para cancelar o reprogramar tu turno, comunicate por WhatsApp con el profesional.
            </p>
            {requiereSeniaEsteServicio && (
              <div style={{ backgroundColor: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '16px', marginTop: '16px', textAlign: 'left' }}>
                <p style={{ margin: '0 0 10px', color: BRASS, fontWeight: 700, fontSize: '14px' }}>Para confirmar tu turno, transferí la seña</p>
                <p style={{ margin: '0 0 6px', fontSize: '14px', color: INK }}>Monto: <strong>${montoSenia}</strong></p>
                {configNegocio?.alias_transferencia && <p style={{ margin: '0 0 4px', fontSize: '13px', color: INK }}>Alias/CBU: {configNegocio.alias_transferencia}</p>}
                {configNegocio?.titular_cuenta && <p style={{ margin: '0 0 4px', fontSize: '13px', color: INK }}>Titular: {configNegocio.titular_cuenta}</p>}
                {configNegocio?.banco && <p style={{ margin: '0 0 12px', fontSize: '13px', color: INK }}>Banco: {configNegocio.banco}</p>}
                <button onClick={enviarComprobanteWA} style={{ width: '100%', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT_SANS }}>
                  Enviar comprobante por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
      </div>
    </div>
  )
}