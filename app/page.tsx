'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function CambiarPassword() {
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function handleCambio() {
    setMensaje('')
    setError('')
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: nueva })
    if (error) {
      setError('Hubo un error al cambiar la contraseña')
    } else {
      setMensaje('¡Contraseña actualizada correctamente!')
      setNueva('')
      setConfirmar('')
    }
  }

  const inp: React.CSSProperties = {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e3dfd6',
    marginRight: '8px',
    marginBottom: '8px',
    fontFamily: 'Arial',
    width: '220px'
  }

  return (
    <div>
      <input type="password" placeholder="Nueva contraseña" value={nueva} onChange={e => setNueva(e.target.value)} style={inp} />
      <input type="password" placeholder="Confirmar contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)} style={inp} />
      <br />
      <button onClick={handleCambio} style={{ padding: '10px 20px', backgroundColor: '#ba9a7d', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Arial' }}>
        Actualizar contraseña
      </button>
      {mensaje && <p style={{ color: 'green', marginTop: '12px' }}>{mensaje}</p>}
      {error && <p style={{ color: '#c0392b', marginTop: '12px' }}>{error}</p>}
    </div>
  )
}

export default function Home() {
  const [clientes, setClientes] = useState<any[]>([])
  const [sesiones, setSesiones] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [fecha, setFecha] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
  const [busquedaServicio, setBusquedaServicio] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7))
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [mostrarServicios, setMostrarServicios] = useState(false)
  const [nuevoServicioCodigo, setNuevoServicioCodigo] = useState('')
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('')
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
  const [historial, setHistorial] = useState<any[]>([])

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
      } else {
        setUserId(data.user.id)
        cargarClientes(data.user.id)
        cargarSesiones(data.user.id)
        cargarServicios(data.user.id)
        cargarGastos(data.user.id)
      }
    })
  }, [mesSeleccionado, mesGastos])

  async function cargarClientes(uid: string) {
    const { data } = await supabase.from('clientes').select('*').eq('user_id', uid)
    setClientes(data || [])
  }

  async function cargarSesiones(uid: string) {
    const { data } = await supabase
      .from('sesiones')
      .select('*, clientes(nombre)')
      .eq('user_id', uid)
      .gte('fecha', mesSeleccionado + '-01')
      .lte('fecha', new Date(parseInt(mesSeleccionado.slice(0,4)), parseInt(mesSeleccionado.slice(5,7)), 0).toISOString().slice(0,10))
      .order('fecha', { ascending: false })
    setSesiones(data || [])
  }

  async function cargarServicios(uid: string) {
    const { data } = await supabase.from('servicios').select('*').eq('user_id', uid)
    setServicios(data || [])
  }

  async function cargarGastos(uid: string) {
    const { data } = await supabase
      .from('gastos')
      .select('*')
      .eq('user_id', uid)
      .gte('fecha', mesGastos + '-01')
      .lte('fecha', new Date(parseInt(mesGastos.slice(0,4)), parseInt(mesGastos.slice(5,7)), 0).toISOString().slice(0,10))
      .order('fecha', { ascending: false })
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

  async function agregarCliente() {
    if (!userId) return
    await supabase.from('clientes').insert([{ nombre, telefono, user_id: userId }])
    setNombre('')
    setTelefono('')
    cargarClientes(userId)
  }

  async function eliminarCliente(id: string) {
    const confirmar = confirm('¿Seguro? Se borrarán también todos sus turnos.')
    if (!confirmar) return
    await supabase.from('sesiones').delete().eq('cliente_id', id)
    await supabase.from('clientes').delete().eq('id', id)
    cargarClientes(userId!)
    cargarSesiones(userId!)
  }

  async function agregarServicio() {
    if (!userId) return
    await supabase.from('servicios').insert([{ codigo: nuevoServicioCodigo, nombre: nuevoServicioNombre, user_id: userId }])
    setNuevoServicioCodigo('')
    setNuevoServicioNombre('')
    cargarServicios(userId)
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
      monto: parseFloat(monto),
      forma_pago: formaPago,
      facturado: false,
      user_id: userId
    }])
    setFecha('')
    setServicioSeleccionado('')
    setBusquedaServicio('')
    setMonto('')
    alert('Turno registrado!')
    cargarSesiones(userId)
  }

  async function eliminarSesion(id: string) {
    const confirmar = confirm('¿Eliminar este turno?')
    if (!confirmar) return
    await supabase.from('sesiones').delete().eq('id', id)
    cargarSesiones(userId!)
  }

  async function toggleFacturado(id: string, valorActual: boolean) {
    await supabase.from('sesiones').update({ facturado: !valorActual }).eq('id', id)
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
    await supabase.from('gastos').insert([{
      fecha: gastoFecha,
      descripcion: gastoDescripcion,
      monto: parseFloat(gastoMonto),
      tipo: gastoTipo,
      user_id: userId
    }])
    setGastoFecha('')
    setGastoDescripcion('')
    setGastoMonto('')
    setGastoTipo('egreso')
    cargarGastos(userId)
  }

  async function eliminarGasto(id: string) {
    const confirmar = confirm('¿Eliminar este registro?')
    if (!confirmar) return
    await supabase.from('gastos').delete().eq('id', id)
    cargarGastos(userId!)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const serviciosFiltrados = servicios.filter(s =>
    s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()) ||
    s.codigo.toLowerCase().includes(busquedaServicio.toLowerCase())
  )

  const totalEfectivo = sesiones.filter(s => s.forma_pago === 'efectivo').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalTransferencia = sesiones.filter(s => s.forma_pago === 'transferencia').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalMes = totalEfectivo + totalTransferencia
  const totalIngresos = gastos.filter(g => g.tipo === 'ingreso').reduce((sum, g) => sum + (g.monto || 0), 0) + totalMes
const totalEgresos = gastos.filter(g => g.tipo === 'egreso').reduce((sum, g) => sum + (g.monto || 0), 0)
const balanceNeto = totalIngresos - totalEgresos

  const rankingServicios = Object.entries(
    sesiones.reduce((acc, s) => {
      const key = s.tipo_masaje || 'Sin servicio'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => (b[1] as number) - (a[1] as number))

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial', backgroundColor: '#e3dfd6', minHeight: '100vh' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#161616', margin: 0 }}>Mis Registros</h1>
        <button onClick={cerrarSesion} style={{ ...btnPrimary, backgroundColor: '#161616' }}>Cerrar Sesión</button>
      </div>

      {/* AGREGAR CLIENTE */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Agregar Cliente</h2>
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={input} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={input} />
        <button onClick={agregarCliente} style={btnPrimary}>Agregar Cliente</button>
      </div>

      {/* LISTA CLIENTES */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ color: '#161616', marginTop: 0, marginBottom: 0 }}>Clientes ({clientes.length})</h2>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} style={btnSecondary}>
            {mostrarClientes ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {mostrarClientes && (
          <ul style={{ marginTop: '16px', paddingLeft: '16px' }}>
            {clientes.map(c => (
              <li key={c.id} style={{ marginBottom: '8px', color: '#161616' }}>
                {c.nombre} - {c.telefono}
                <button onClick={() => eliminarCliente(c.id)} style={{ marginLeft: '10px', color: '#ba9a7d', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SERVICIOS */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ color: '#161616', marginTop: 0, marginBottom: 0 }}>Servicios ({servicios.length})</h2>
          <button onClick={() => setMostrarServicios(!mostrarServicios)} style={btnSecondary}>
            {mostrarServicios ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        <input placeholder="Código (ej: M001)" value={nuevoServicioCodigo} onChange={e => setNuevoServicioCodigo(e.target.value)} style={input} />
        <input placeholder="Nombre (ej: Masaje relajante)" value={nuevoServicioNombre} onChange={e => setNuevoServicioNombre(e.target.value)} style={input} />
        <button onClick={agregarServicio} style={btnPrimary}>Agregar Servicio</button>
        {mostrarServicios && (
          <ul style={{ marginTop: '16px', paddingLeft: '16px' }}>
            {servicios.map(s => (
              <li key={s.id} style={{ marginBottom: '8px', color: '#161616' }}>
                <strong>{s.codigo}</strong> - {s.nombre}
                <button onClick={() => eliminarServicio(s.id)} style={{ marginLeft: '10px', color: '#ba9a7d', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* REGISTRAR TURNO */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Registrar Turno</h2>
        <select onChange={e => setClienteSeleccionado(e.target.value)} style={input}>
          <option value="">Seleccionar cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={input} />
        <input
          placeholder="Buscar servicio por código o nombre"
          value={busquedaServicio}
          onChange={e => { setBusquedaServicio(e.target.value); setServicioSeleccionado('') }}
          style={{ ...input, width: '280px' }}
        />
        {busquedaServicio && serviciosFiltrados.length > 0 && !servicioSeleccionado && (
          <ul style={{ border: '1px solid #e3dfd6', borderRadius: '8px', padding: '8px', listStyle: 'none', marginBottom: '8px' }}>
            {serviciosFiltrados.map(s => (
              <li key={s.id}
                onClick={() => { setServicioSeleccionado(s.nombre); setBusquedaServicio(s.codigo + ' - ' + s.nombre) }}
                style={{ padding: '6px', cursor: 'pointer', color: '#161616' }}>
                {s.codigo} - {s.nombre}
              </li>
            ))}
          </ul>
        )}
        <input placeholder="Monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={input} />
        <select value={formaPago} onChange={e => setFormaPago(e.target.value)} style={input}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <br />
        <button onClick={agregarSesion} style={btnPrimary}>Registrar Turno</button>
      </div>

      {/* RESUMEN DEL MES */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Resumen del mes</h2>
        <input type="month" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} style={input} />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>💵 Efectivo</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalEfectivo}</p>
          </div>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>🏦 Transferencia</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalTransferencia}</p>
          </div>
          <div style={{ backgroundColor: '#ba9a7d', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#ffffff' }}>💰 Total</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>${totalMes}</p>
          </div>
        </div>
      </div>

      {/* RANKING SERVICIOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Servicios del mes</h2>
        {rankingServicios.length === 0 ? (
          <p style={{ color: '#161616' }}>No hay turnos este mes.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Servicio</th>
                <th style={th}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {rankingServicios.map(([nombre, cantidad]) => (
                <tr key={nombre} style={{ backgroundColor: '#ffffff' }}>
                  <td style={td}>{nombre}</td>
                  <td style={td}>{cantidad as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TURNOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Turnos de {mesSeleccionado}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Cliente</th>
              <th style={th}>Fecha</th>
              <th style={th}>Servicio</th>
              <th style={th}>Monto</th>
              <th style={th}>Pago</th>
              <th style={th}>Facturado</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              editandoId === s.id ? (
                <tr key={s.id} style={{ backgroundColor: '#fffaf7' }}>
                  <td style={td}>{s.clientes?.nombre}</td>
                  <td style={td}><input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                  <td style={td}><input value={editServicio} onChange={e => setEditServicio(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                  <td style={td}><input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} style={{ ...input, marginBottom: 0, width: '80px' }} /></td>
                  <td style={td}>
                    <select value={editFormaPago} onChange={e => setEditFormaPago(e.target.value)} style={{ ...input, marginBottom: 0 }}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </td>
                  <td style={td}>-</td>
                  <td style={td}>
                    <button onClick={() => guardarEdicion(s.id)} style={{ ...btnPrimary, padding: '6px 12px', marginRight: '6px' }}>Guardar</button>
                    <button onClick={() => setEditandoId(null)} style={{ ...btnSecondary, marginLeft: 0 }}>Cancelar</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={td}>{s.clientes?.nombre}</td>
                  <td style={td}>{s.fecha}</td>
                  <td style={td}>{s.tipo_masaje}</td>
                  <td style={td}>${s.monto}</td>
                  <td style={td}>{s.forma_pago}</td>
                  <td style={td}>
                    {s.forma_pago === 'transferencia' ? (
                      <input type="checkbox" checked={s.facturado || false} onChange={() => toggleFacturado(s.id, s.facturado || false)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ba9a7d' }} />
                    ) : (
                      <span style={{ color: '#9e9e9e', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    <button onClick={() => iniciarEdicion(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', marginRight: '8px' }}>Editar</button>
                    <button onClick={() => eliminarSesion(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* HISTORIAL POR CLIENTE */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Historial por Cliente</h2>
        <select
          value={clienteHistorial}
          onChange={e => { setClienteHistorial(e.target.value); if (e.target.value) cargarHistorial(e.target.value) }}
          style={input}
        >
          <option value="">Seleccionar cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {historial.length > 0 && (
          <>
            <p style={{ color: '#161616', marginTop: '12px' }}>
              <strong>Total de turnos:</strong> {historial.length} &nbsp;|&nbsp;
              <strong>Total facturado:</strong> ${historial.reduce((sum, s) => sum + (s.monto || 0), 0)}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Servicio</th>
                  <th style={th}>Monto</th>
                  <th style={th}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(s => (
                  <tr key={s.id} style={{ backgroundColor: '#ffffff' }}>
                    <td style={td}>{s.fecha}</td>
                    <td style={td}>{s.tipo_masaje}</td>
                    <td style={td}>${s.monto}</td>
                    <td style={td}>{s.forma_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {clienteHistorial && historial.length === 0 && (
          <p style={{ color: '#9e9e9e', marginTop: '12px' }}>Este cliente no tiene turnos registrados.</p>
        )}
      </div>

      {/* GASTOS E INGRESOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Registrar Ingreso / Egreso</h2>
        <input type="date" value={gastoFecha} onChange={e => setGastoFecha(e.target.value)} style={input} />
        <input placeholder="Descripción" value={gastoDescripcion} onChange={e => setGastoDescripcion(e.target.value)} style={{ ...input, width: '220px' }} />
        <input placeholder="Monto" type="number" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} style={{ ...input, width: '100px' }} />
        <select value={gastoTipo} onChange={e => setGastoTipo(e.target.value)} style={input}>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <br />
        <button onClick={agregarGasto} style={btnPrimary}>Registrar</button>
      </div>

      {/* RESUMEN GASTOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Resumen Ingresos y Egresos</h2>
        <input type="month" value={mesGastos} onChange={e => setMesGastos(e.target.value)} style={input} />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>📈 Ingresos</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalIngresos}</p>
          </div>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>📉 Egresos</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalEgresos}</p>
          </div>
          <div style={{ backgroundColor: balanceNeto >= 0 ? '#ba9a7d' : '#c0392b', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#ffffff' }}>💰 Balance</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>${balanceNeto}</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={th}>Fecha</th>
              <th style={th}>Descripción</th>
              <th style={th}>Monto</th>
              <th style={th}>Tipo</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map(g => (
              <tr key={g.id} style={{ backgroundColor: g.tipo === 'ingreso' ? '#f0fff4' : '#fff5f5' }}>
                <td style={td}>{g.fecha}</td>
                <td style={td}>{g.descripcion}</td>
                <td style={td}>${g.monto}</td>
                <td style={td}>
                  <span style={{ color: g.tipo === 'ingreso' ? 'green' : '#c0392b', fontWeight: 'bold' }}>
                    {g.tipo === 'ingreso' ? '▲ Ingreso' : '▼ Egreso'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => eliminarGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CAMBIAR CONTRASEÑA */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Cambiar Contraseña</h2>
        <CambiarPassword />
      </div>

    </main>
  )
}