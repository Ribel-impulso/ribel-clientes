'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TabConfiguracion from './components/TabConfiguracion'
import TabTurnos from './components/TabTurnos'
import TabAgenda from './components/TabAgenda'
import TabFinanzas from './components/TabFinanzas'

export default function Home() {
  const [pestanaActiva, setPestanaActiva] = useState<'configuracion' | 'turnos' | 'finanzas' | 'agenda'>('agenda')
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
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [mostrarServicios, setMostrarServicios] = useState(false)
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('')
  const [nuevoServicioDuracion, setNuevoServicioDuracion] = useState(60) 
  const [userId, setUserId] = useState<string | null>(null)
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
  const [montoSenia, setMontoSenia] = useState('')
  const [fechaSenia, setFechaSenia] = useState('')

  const card: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e3dfd6',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }
  const input: React.CSSProperties = {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e3dfd6',
    marginRight: '8px',
    marginBottom: '8px',
    fontFamily: 'Arial'
  }
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#ba9a7d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Arial'
  }
  const btnSecondary: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#e3dfd6',
    color: '#161616',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginLeft: '10px',
    fontFamily: 'Arial'
  }
  const th: React.CSSProperties = {
    border: '1px solid #e3dfd6',
    padding: '10px',
    textAlign: 'left',
    backgroundColor: '#e3dfd6',
    color: '#161616'
  }
  const td: React.CSSProperties = {
    border: '1px solid #e3dfd6',
    padding: '10px',
    color: '#161616'
  }

  const tabStyle = (activa: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontFamily: 'Arial',
    fontWeight: activa ? 'bold' : 'normal',
    backgroundColor: activa ? '#ffffff' : '#d4cfc6',
    color: activa ? '#ba9a7d' : '#161616',
    borderBottom: activa ? '3px solid #ba9a7d' : 'none',
    marginRight: '4px',
    fontSize: '14px'
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

        if (diffDias < 0) {
          window.location.href = '/planes'
          return
        }
        if (diffDias <= 5) {
          setDiasRestantes(diffDias)
        }
      }

      setUserId(data.user.id)
      cargarClientes(data.user.id)
      cargarSesiones(data.user.id)
      cargarServicios(data.user.id)
      cargarGastos(data.user.id, mesGastos)
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

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // La seña impacta en el mes de su fecha_senia
  const totalEfectivo = sesiones.reduce((sum, s) => {
  const yaPaso = new Date(`${s.fecha}T${s.horario || '23:59'}`) <= new Date()
  const enMes = s.fecha?.startsWith(mesSeleccionado)
  const m1 = enMes && yaPaso && s.forma_pago?.toLowerCase() === 'efectivo' && !s.monto_senia ? (s.monto || 0) : 0
  const m2 = enMes && yaPaso && s.forma_pago2?.toLowerCase() === 'efectivo' ? (s.monto2 || 0) : 0
  const cobro = s.forma_pago_cobro?.toLowerCase() === 'efectivo' && s.fecha_cobro?.startsWith(mesSeleccionado) ? ((s.monto || 0) - (s.monto_senia || 0)) : 0
  const senia = s.fecha_senia?.startsWith(mesSeleccionado) && s.monto_senia ? s.monto_senia : 0
  return sum + m1 + m2 + cobro + senia
}, 0)

  const totalTransferencia = sesiones.reduce((sum, s) => {
  const enMes = s.fecha?.startsWith(mesSeleccionado)
  const yaPaso = new Date(`${s.fecha}T${s.horario || '23:59'}`) <= new Date()
  const m1 = enMes && yaPaso && s.forma_pago?.toLowerCase() === 'transferencia' && !s.monto_senia ? (s.monto || 0) : 0
  const m2 = enMes && yaPaso && s.forma_pago2?.toLowerCase() === 'transferencia' ? (s.monto2 || 0) : 0
  const cobro = s.forma_pago_cobro?.toLowerCase() === 'transferencia' && s.fecha_cobro?.startsWith(mesSeleccionado) ? ((s.monto || 0) - (s.monto_senia || 0)) : 0
  return sum + m1 + m2 + cobro
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
    <main style={{ padding: '24px', fontFamily: 'Arial', backgroundColor: '#e3dfd6', minHeight: '100vh' }}>

      {diasRestantes !== null && (
        <div style={{
          backgroundColor: '#fff8e1',
          border: '1px solid #f9a825',
          borderRadius: '10px',
          padding: '12px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#e65100', fontSize: '14px' }}>
            ⏳ Tu período de prueba vence en <strong>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</strong>
          </span>
          <a href="/planes" style={{
            backgroundColor: '#ba9a7d',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 'bold'
          }}>Ver planes</a>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#161616', margin: 0 }}>Mis Registros</h1>
        <button onClick={cerrarSesion} style={{ ...btnPrimary, backgroundColor: '#161616' }}>Cerrar Sesión</button>
      </div>

      <div style={{ marginBottom: '0px' }}>
        <button style={tabStyle(pestanaActiva === 'configuracion')} onClick={() => setPestanaActiva('configuracion')}>
          ⚙️ Configuración
        </button>
        <button style={tabStyle(pestanaActiva === 'turnos')} onClick={() => setPestanaActiva('turnos')}>
          📋 Turnos
        </button>
        <button style={tabStyle(pestanaActiva === 'finanzas')} onClick={() => setPestanaActiva('finanzas')}>
          💰 Finanzas
        </button>
        <button style={tabStyle(pestanaActiva === 'agenda')} onClick={() => setPestanaActiva('agenda')}>
          📅 Agenda
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '0 12px 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

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
            eliminarCliente={eliminarCliente} eliminarServicio={eliminarServicio}
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
            agregarSesion={agregarSesion} eliminarSesion={eliminarSesion}
            toggleFacturado={toggleFacturado} iniciarEdicion={iniciarEdicion}
            cobrarSesion={cobrarSesion}
            guardarEdicion={guardarEdicion} cargarHistorial={cargarHistorial}
            card={card} input={input} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
            th={th} td={td}
          />
        )}

        {pestanaActiva === 'agenda' && (
          <TabAgenda userId={userId!} />
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
            agregarGasto={agregarGasto} eliminarGasto={eliminarGasto}
            card={card} input={input} btnPrimary={btnPrimary} th={th} td={td}
          />
        )}

      </div>
    </main>
  )
}