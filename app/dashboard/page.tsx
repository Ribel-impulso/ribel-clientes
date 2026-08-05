'use client'
import { useState, useEffect, ReactElement } from 'react'
import { supabase } from '../../lib/supabase'
import TabConfiguracion from '../components/TabConfiguracion'
import TabTurnos from '../components/TabTurnos'
import TabAgenda from '../components/TabAgenda'
import TabFinanzas from '../components/TabFinanzas'
import NotificacionesCampana from '../components/NotificacionesCampana'
import TabAgendaPersonal from '../components/TabAgendaPersonal'

// Paleta y tipografía compartidas con el login.
// Recomendado: cuando tengas tiempo, mover esto a un archivo único
// (ej. lib/theme.ts) e importarlo acá y en login/page.tsx, para no
// tener las mismas constantes copiadas en dos archivos.
const INK = '#1B2420'
const PAPER = '#F4EFE4'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_LIGHT = '#C9A876'
const SAGE = '#5E7A5A'
const SAGE_BG = '#EAF0E8'
const CLAY = '#A85A44'
const CLAY_BG = '#F5E9E5'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'
const FONT_SERIF = "'Source Serif 4', serif"
const FONT_SANS = "'Public Sans', sans-serif"

export default function Home() {
const [pestanaActiva, setPestanaActiva] = useState<'configuracion' | 'turnos' | 'finanzas' | 'agenda' | 'agendaPersonal'>('agenda')
  const [clientes, setClientes] = useState<any[]>([])
  const [sesiones, setSesiones] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [fecha, setFecha] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
  const [busquedaServicio, setBusquedaServicio] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7))
  const [turnoResaltado, setTurnoResaltado] = useState<string | null>(null)
  const [fechaInicialAgenda, setFechaInicialAgenda] = useState<string | null>(null)
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [mostrarServicios, setMostrarServicios] = useState(false)
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('')
  const [nuevoServicioDuracion, setNuevoServicioDuracion] = useState(60) 
  const [userId, setUserId] = useState<string | null>(null)
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editFecha, setEditFecha] = useState('')
  const [editServicio, setEditServicio] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editFormaPago, setEditFormaPago] = useState('efectivo')
  const [gastoFecha, setGastoFecha] = useState('')
  const [gastoDescripcion, setGastoDescripcion] = useState('')
  const [gastoMonto, setGastoMonto] = useState('')
  const [gastoTipo, setGastoTipo] = useState('egreso')
  const [mesGastos, setMesGastos] = useState(new Date().toISOString().slice(0, 7))
  const [clienteHistorial, setClienteHistorial] = useState('')
  const [horario, setHorario] = useState('')
  const [monto2, setMonto2] = useState('')
  const [formaPago2, setFormaPago2] = useState('')
  const [historial, setHistorial] = useState<any[]>([])
  const [gastoCategoria, setGastoCategoria] = useState('negocio')
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [accesoRestringido, setAccesoRestringido] = useState(false)
  const [mostrarModalUpgrade, setMostrarModalUpgrade] = useState(false)
  const [montoSenia, setMontoSenia] = useState('')
  const [fechaSenia, setFechaSenia] = useState('')
  const [planActual, setPlanActual] = useState<string | null>(null)

  const card: React.CSSProperties = {
    backgroundColor: PAPER_2,
    border: `1px solid ${LINE}`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(27,36,32,0.05)'
  }
  const input: React.CSSProperties = {
    padding: '11px 13px',
    borderRadius: '10px',
    border: `1.5px solid ${LINE}`,
    marginRight: '8px',
    marginBottom: '8px',
    fontFamily: FONT_SANS,
    fontSize: '14px',
    color: INK,
    backgroundColor: PAPER_2,
    outline: 'none'
  }
  const btnPrimary: React.CSSProperties = {
    padding: '11px 20px',
    backgroundColor: INK,
    color: PAPER_2,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: FONT_SANS,
    fontWeight: 600,
    fontSize: '14px'
  }
  const btnSecondary: React.CSSProperties = {
    padding: '9px 16px',
    backgroundColor: PAPER_2,
    color: INK,
    border: `1.5px solid ${LINE}`,
    borderRadius: '10px',
    cursor: 'pointer',
    marginLeft: '10px',
    fontFamily: FONT_SANS,
    fontWeight: 600,
    fontSize: '13.5px'
  }
  const th: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    padding: '10px',
    textAlign: 'left',
    backgroundColor: PAPER,
    color: INK,
    fontFamily: FONT_SANS,
    fontWeight: 700,
    fontSize: '12.5px',
    letterSpacing: '0.02em'
  }
  const td: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    padding: '10px',
    color: INK,
    fontFamily: FONT_SANS,
    fontSize: '13.5px'
  }

  // Iconos SVG por pestaña (reemplazan los emoji)
  const tabIcons: Record<string, ReactElement> = {
    configuracion: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015.4 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.36.15.63.4 1 .51H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    turnos: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M9 2v4M15 2v4M4 10h16M9 15l2 2 4-4" />
      </svg>
    ),
    finanzas: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20M6 15h2" />
      </svg>
    ),
    agenda: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    agendaPersonal: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    )
  }

  const tabStyle = (activa: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 16px',
    border: `1px solid ${activa ? INK : LINE}`,
    borderRadius: '100px',
    cursor: 'pointer',
    fontFamily: FONT_SANS,
    fontWeight: 600,
    backgroundColor: activa ? INK : PAPER_2,
    color: activa ? PAPER_2 : MUTED,
    marginRight: '8px',
    fontSize: '13.5px',
    whiteSpace: 'nowrap'
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }

      const { data: suscripcion } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (suscripcion) {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const vencimiento = new Date(suscripcion.fecha_vencimiento + 'T00:00:00')
        const diffMs = vencimiento.getTime() - hoy.getTime()
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        const estadoBloqueado = suscripcion.estado === 'vencida' || suscripcion.estado === 'cancelada'

        if (diffDias < 0 || estadoBloqueado) {
          setAccesoRestringido(true)
        } else {
          setDiasRestantes(diffDias)
          setPlanActual(suscripcion.plan)
        }
      }
      

      setUserId(data.user.id)
cargarClientes(data.user.id)
cargarSesiones(data.user.id)
cargarServicios(data.user.id)
cargarGastos(data.user.id, mesGastos)

const { data: config } = await supabase
  .from('configuracion_negocio')
  .select('nombre_negocio')
  .eq('user_id', data.user.id)
  .single()

if (config?.nombre_negocio) setNombreNegocio(config.nombre_negocio)
    })
  }, [mesSeleccionado])

  useEffect(() => {
    if (userId) cargarGastos(userId, mesGastos)
  }, [mesGastos, userId])

  async function cargarClientes(uid: string) {
    const { data } = await supabase.from('clientes').select('*').eq('user_id', uid)
    setClientes(data || [])
  }

  async function cargarSesiones(uid: string, mes?: string) {
    const { data } = await supabase
      .from('sesiones')
      .select('*, clientes(nombre)')
      .eq('user_id', uid)
      .order('fecha', { ascending: false })
    setSesiones(data || [])
  }

  async function cargarServicios(uid: string) {
    const { data } = await supabase.from('servicios').select('*').eq('user_id', uid)
    setServicios(data || [])
  }

  async function cargarGastos(uid: string, mes: string) {
    const ultimoDia = new Date(parseInt(mes.slice(0,4)), parseInt(mes.slice(5,7)), 0).toISOString().slice(0,10)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('user_id', uid)
      .gte('fecha', mes + '-01')
      .lte('fecha', ultimoDia)
      .order('fecha', { ascending: false })
    if (error) console.log('Error gastos:', error.message)
    setGastos(data || [])
  }

  async function cargarHistorial(clienteId: string) {
    const { data } = await supabase
      .from('sesiones')
      .select('*, clientes(nombre)')
      .eq('user_id', userId!)
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
    setHistorial(data || [])
  }

  async function eliminarCliente(id: string) {
    const confirmar = confirm('¿Seguro? Se borrarán también todos sus turnos.')
    if (!confirmar) return
    await supabase.from('sesiones').delete().eq('cliente_id', id)
    await supabase.from('clientes').delete().eq('id', id)
    cargarClientes(userId!)
    cargarSesiones(userId!)
  }

  async function eliminarServicio(id: string) {
    const confirmar = confirm('¿Eliminar este servicio?')
    if (!confirmar) return
    await supabase.from('servicios').delete().eq('id', id)
    cargarServicios(userId!)
  }

  async function agregarSesion() {
    if (!userId) return
    const servicioFinal = servicioSeleccionado || busquedaServicio
    await supabase.from('sesiones').insert([{
      cliente_id: clienteSeleccionado,
      fecha,
      tipo_masaje: servicioFinal,
      monto: parseFloat(monto) || 0,
      forma_pago: formaPago,
      facturado: false,
      horario: horario,
      monto2: monto2 ? parseFloat(monto2) : null,
      forma_pago2: formaPago2 || null,
      monto_senia: montoSenia ? parseFloat(montoSenia) : null,
      fecha_senia: fechaSenia || null,
      user_id: userId
    }])
    setFecha('')
    setServicioSeleccionado('')
    setBusquedaServicio('')
    setMonto('')
    setHorario('')
    setMonto2('')
    setFormaPago2('')
    setMontoSenia('')
    setFechaSenia('')
    alert('Turno registrado!')
    cargarSesiones(userId)
  }

  async function eliminarSesion(id: string) {
    const confirmar = confirm('¿Eliminar este turno?')
    if (!confirmar) return
    await supabase.from('sesiones').delete().eq('id', id).eq('user_id', userId!)
    cargarSesiones(userId!)
  }

  async function toggleFacturado(id: string, valorActual: boolean) {
    await supabase.from('sesiones').update({ facturado: !valorActual }).eq('id', id)
    cargarSesiones(userId!)
  }

  async function cobrarSesion(id: string, formaPago: string) {
    const hoy = new Date().toISOString().split('T')[0]
    await supabase.from('sesiones').update({ cobrado: true, forma_pago_cobro: formaPago, fecha_cobro: hoy }).eq('id', id)
    cargarSesiones(userId!)
  }

  function iniciarEdicion(s: any) {
    setEditandoId(s.id)
    setEditFecha(s.fecha)
    setEditServicio(s.tipo_masaje || '')
    setEditMonto(s.monto?.toString() || '')
    setEditFormaPago(s.forma_pago || 'efectivo')
  }

  async function guardarEdicion(id: string) {
    await supabase.from('sesiones').update({
      fecha: editFecha,
      tipo_masaje: editServicio,
      monto: parseFloat(editMonto),
      forma_pago: editFormaPago
    }).eq('id', id)
    setEditandoId(null)
    cargarSesiones(userId!)
  }

  async function agregarGasto() {
    if (!userId) return
    const { error } = await supabase.from('gastos').insert([{
      fecha: gastoFecha,
      descripcion: gastoDescripcion,
      monto: parseFloat(gastoMonto),
      tipo: gastoTipo,
      categoria: gastoCategoria,
      user_id: userId
    }])
    if (error) { alert('Error: ' + error.message); return }
    setGastoFecha('')
    setGastoDescripcion('')
    setGastoMonto('')
    setGastoTipo('egreso')
    setGastoCategoria('negocio')
    cargarGastos(userId, mesGastos)
  }

  async function eliminarGasto(id: string) {
    const confirmar = confirm('¿Eliminar este registro?')
    if (!confirmar) return
    await supabase.from('gastos').delete().eq('id', id)
    cargarGastos(userId!, mesGastos)
  }

  async function editarGasto(id: string, datos: { fecha: string; descripcion: string; monto: number; tipo: string; categoria: string }) {
  const { error } = await supabase.from('gastos').update(datos).eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  cargarGastos(userId!, mesGastos)
}

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  function protegido<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    if (accesoRestringido) {
      setMostrarModalUpgrade(true)
      return
    }
    return fn(...args)
  }) as T
}

  // La seña impacta en el mes de su fecha_senia
  const totalEfectivo = sesiones.reduce((sum, s) => {
  const yaPaso = new Date(`${s.fecha}T${s.horario || '23:59'}`) <= new Date()
  const enMes = s.fecha?.startsWith(mesSeleccionado)
  const m1 = enMes && yaPaso && s.forma_pago?.toLowerCase() === 'efectivo' && !s.monto_senia ? (s.monto || 0) : 0
  const m2 = enMes && yaPaso && s.forma_pago2?.toLowerCase() === 'efectivo' ? (s.monto2 || 0) : 0
  const cobro = s.forma_pago_cobro?.toLowerCase() === 'efectivo' && s.fecha_cobro?.startsWith(mesSeleccionado) ? ((s.monto || 0) - (s.monto_senia || 0)) : 0
  const senia = s.fecha_senia?.startsWith(mesSeleccionado) && s.monto_senia ? s.monto_senia : 0
  return sum + m1 + m2 + cobro
}, 0)

  const totalTransferencia = sesiones.reduce((sum, s) => {
  const enMes = s.fecha?.startsWith(mesSeleccionado)
  const yaPaso = new Date(`${s.fecha}T${s.horario || '23:59'}`) <= new Date()
  const m1 = enMes && yaPaso && s.forma_pago?.toLowerCase() === 'transferencia' && !s.monto_senia ? (s.monto || 0) : 0
  const m2 = enMes && yaPaso && s.forma_pago2?.toLowerCase() === 'transferencia' ? (s.monto2 || 0) : 0
  const cobro = s.forma_pago_cobro?.toLowerCase() === 'transferencia' && s.fecha_cobro?.startsWith(mesSeleccionado) ? ((s.monto || 0) - (s.monto_senia || 0)) : 0
  const senia = s.estado === 'confirmado' && s.monto_senia && s.fecha_senia?.startsWith(mesSeleccionado) ? s.monto_senia : 0
  return sum + m1 + m2 + cobro + senia
}, 0)

  const totalCuentaCorriente = sesiones.reduce((sum, s) => {
    const fp = s.forma_pago?.toLowerCase().replace(' ', '_')
    const fp2 = s.forma_pago2?.toLowerCase().replace(' ', '_')
    const m1 = fp === 'cuenta_corriente' && !s.cobrado ? (s.monto || 0) : 0
    const m2 = fp2 === 'cuenta_corriente' && !s.cobrado ? (s.monto2 || 0) : 0
    return sum + m1 + m2
  }, 0)

  const totalMes = totalEfectivo + totalTransferencia
  const totalIngresos = gastos.filter(g => g.tipo === 'ingreso').reduce((sum, g) => sum + (g.monto || 0), 0) + totalMes + totalCuentaCorriente
  const totalEgresos = gastos.filter(g => g.tipo === 'egreso').reduce((sum, g) => sum + (g.monto || 0), 0)
  const balanceNeto = totalIngresos - totalEgresos

  const rankingServicios: [string, number][] = (Object.entries(
    sesiones
      .filter(s => s.fecha?.startsWith(mesSeleccionado))
      .reduce((acc: Record<string, number>, s) => {
        const key = s.tipo_masaje || 'Sin servicio'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
  ) as [string, number][]).sort((a, b) => b[1] - a[1])

  return (
    <main style={{
      padding: '24px',
      fontFamily: FONT_SANS,
      backgroundColor: PAPER,
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(27,36,32,0.035) 28px), radial-gradient(rgba(27,36,32,0.05) 1px, transparent 1px)',
      backgroundSize: 'auto, 14px 14px',
      minHeight: '100vh'
    }}>

      <link
        href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Public+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

{accesoRestringido && (
  <div style={{
    backgroundColor: CLAY_BG, border: `1px solid ${CLAY}55`, borderRadius: '12px',
    padding: '12px 20px', marginBottom: '16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
  }}>
    <span style={{ color: CLAY, fontSize: '13.5px', fontWeight: 600 }}>
      🔒 Tu período de prueba venció. Podés ver tu info, pero para agendar, cobrar o modificar necesitás activar un plan.
    </span>
    <button onClick={() => setMostrarModalUpgrade(true)} style={{
      backgroundColor: INK, color: PAPER_2, border: 'none', padding: '7px 15px',
      borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
    }}>Ver planes</button>
  </div>
)}
      {diasRestantes !== null && planActual && (
        <div style={{
          backgroundColor: CLAY_BG,
          border: `1px solid ${CLAY}55`,
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: CLAY, fontSize: '13.5px', fontWeight: 600 }}>
            {planActual === 'ilimitado'
              ? 'Tenés un plan Ilimitado activo'
              : planActual === 'prueba'
              ? `Te quedan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} de prueba gratis`
              : `Tu plan ${planActual.charAt(0).toUpperCase() + planActual.slice(1)} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`}
          </span>
          <a href="/planes" style={{
            backgroundColor: INK,
            color: PAPER_2,
            padding: '7px 15px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700
          }}>Ver planes</a>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '22px', color: INK, margin: 0 }}>
            Ribel Gestión
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: SAGE, fontWeight: 600, letterSpacing: '0.03em' }}>
  {nombreNegocio ? `Hola, ${nombreNegocio}` : 'Panel de negocio'}
</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificacionesCampana
          userId={userId!}
  onVerTurno={(sesionId, fecha) => {
    setTurnoResaltado(null)
    setFechaInicialAgenda(null)
    setTimeout(() => {
      setTurnoResaltado(sesionId)
      setFechaInicialAgenda(fecha)
      setPestanaActiva('agenda')
    }, 50)
  }}
/>
          <button
            onClick={cerrarSesion}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              backgroundColor: PAPER_2,
              color: INK,
              border: `1px solid ${LINE}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Salir
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '18px', display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '2px' }}>
        <button style={tabStyle(pestanaActiva === 'configuracion')} onClick={() => setPestanaActiva('configuracion')}>
          {tabIcons.configuracion} Configuración
        </button>
        <button style={tabStyle(pestanaActiva === 'turnos')} onClick={() => setPestanaActiva('turnos')}>
          {tabIcons.turnos} Turnos
        </button>
        <button style={tabStyle(pestanaActiva === 'finanzas')} onClick={() => setPestanaActiva('finanzas')}>
          {tabIcons.finanzas} Finanzas
        </button>
        <button style={tabStyle(pestanaActiva === 'agenda')} onClick={() => setPestanaActiva('agenda')}>
          {tabIcons.agenda} Agenda
        </button>
        <button style={tabStyle(pestanaActiva === 'agendaPersonal')} onClick={() => setPestanaActiva('agendaPersonal')}>
          {tabIcons.agendaPersonal} Agenda Personal
        </button>
      </div>

      <div style={{ backgroundColor: 'transparent' }}>

        {pestanaActiva === 'configuracion' && (
          <TabConfiguracion
            clientes={clientes} servicios={servicios}
            mostrarClientes={mostrarClientes} setMostrarClientes={setMostrarClientes}
            mostrarServicios={mostrarServicios} setMostrarServicios={setMostrarServicios}
            nombre={nombre} setNombre={setNombre}
            telefono={telefono} setTelefono={setTelefono}
            nuevoServicioNombre={nuevoServicioNombre} setNuevoServicioNombre={setNuevoServicioNombre}
nuevoServicioDuracion={nuevoServicioDuracion} setNuevoServicioDuracion={setNuevoServicioDuracion}
            userId={userId!} cargarClientes={cargarClientes} cargarServicios={cargarServicios}
            eliminarCliente={protegido(eliminarCliente)} eliminarServicio={protegido(eliminarServicio)}
            card={card} input={input} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
          />
        )}

        {pestanaActiva === 'turnos' && (
          <TabTurnos
            clientes={clientes} sesiones={sesiones} servicios={servicios}
            busquedaCliente={busquedaCliente} setBusquedaCliente={setBusquedaCliente}
            clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado}
            busquedaServicio={busquedaServicio} setBusquedaServicio={setBusquedaServicio}
            servicioSeleccionado={servicioSeleccionado} setServicioSeleccionado={setServicioSeleccionado}
            fecha={fecha} setFecha={setFecha}
            monto={monto} setMonto={setMonto}
            horario={horario} setHorario={setHorario}
            monto2={monto2} setMonto2={setMonto2}
            formaPago2={formaPago2} setFormaPago2={setFormaPago2}
            formaPago={formaPago} setFormaPago={setFormaPago}
            montoSenia={montoSenia} setMontoSenia={setMontoSenia}
            fechaSenia={fechaSenia} setFechaSenia={setFechaSenia}
            mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado}
            totalEfectivo={totalEfectivo} totalTransferencia={totalTransferencia} totalMes={totalMes}
            totalCuentaCorriente={totalCuentaCorriente}
            rankingServicios={rankingServicios}
            editandoId={editandoId} setEditandoId={setEditandoId}
            editFecha={editFecha} setEditFecha={setEditFecha}
            editServicio={editServicio} setEditServicio={setEditServicio}
            editMonto={editMonto} setEditMonto={setEditMonto}
            editFormaPago={editFormaPago} setEditFormaPago={setEditFormaPago}
            clienteHistorial={clienteHistorial} setClienteHistorial={setClienteHistorial}
            historial={historial}
            agregarSesion={protegido(agregarSesion)} eliminarSesion={protegido(eliminarSesion)}
            toggleFacturado={protegido(toggleFacturado)} iniciarEdicion={iniciarEdicion}
            cobrarSesion={protegido(cobrarSesion)}
            guardarEdicion={protegido(guardarEdicion)} cargarHistorial={cargarHistorial}
            card={card} input={input} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
            th={th} td={td}
          />
        )}

        {pestanaActiva === 'agenda' && (
           <TabAgenda
  userId={userId!}
  turnoResaltado={turnoResaltado}
  fechaInicial={fechaInicialAgenda}
  onTurnoResaltadoVisto={() => setTurnoResaltado(null)}
  accesoRestringido={accesoRestringido}
  onAccionBloqueada={() => setMostrarModalUpgrade(true)}
/>
        )}

        {pestanaActiva === 'agendaPersonal' && (
  <TabAgendaPersonal userId={userId!} card={card} btnPrimary={btnPrimary} />
)}

        {pestanaActiva === 'finanzas' && (
          <TabFinanzas
            gastos={gastos}
            gastoFecha={gastoFecha} setGastoFecha={setGastoFecha}
            gastoDescripcion={gastoDescripcion} setGastoDescripcion={setGastoDescripcion}
            gastoMonto={gastoMonto} setGastoMonto={setGastoMonto}
            gastoTipo={gastoTipo} setGastoTipo={setGastoTipo}
            gastoCategoria={gastoCategoria} setGastoCategoria={setGastoCategoria}
            mesGastos={mesGastos} setMesGastos={setMesGastos}
            totalIngresos={totalIngresos} totalEgresos={totalEgresos} balanceNeto={balanceNeto}
            agregarGasto={protegido(agregarGasto)} eliminarGasto={protegido(eliminarGasto)} editarGasto={protegido(editarGasto)}
            card={card} input={input} btnPrimary={btnPrimary} th={th} td={td}
          />
        )}

      </div>
      {mostrarModalUpgrade && (
  <div onClick={() => setMostrarModalUpgrade(false)} style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(27,36,32,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      backgroundColor: PAPER_2, borderRadius: '16px', padding: '28px',
      maxWidth: '380px', textAlign: 'center'
    }}>
      <h3 style={{ fontFamily: FONT_SERIF, color: INK, marginTop: 0 }}>Tu prueba terminó</h3>
      <p style={{ color: MUTED, fontSize: '14px' }}>
        Para seguir agendando, cobrando y gestionando tu negocio, activá un plan.
      </p>
      <a href="/planes" style={{
        display: 'inline-block', backgroundColor: INK, color: PAPER_2,
        padding: '11px 24px', borderRadius: '10px', textDecoration: 'none',
        fontWeight: 700, marginTop: '10px'
      }}>Ver planes</a>
      <div style={{ marginTop: '12px' }}>
        <button onClick={() => setMostrarModalUpgrade(false)} style={{
          background: 'none', border: 'none', color: MUTED, fontSize: '13px', cursor: 'pointer'
        }}>Cerrar</button>
      </div>
    </div>
  </div>
)}
    </main>
  )
}