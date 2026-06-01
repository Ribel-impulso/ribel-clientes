'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [clientes, setClientes] = useState<any[]>([])
  const [sesiones, setSesiones] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [fecha, setFecha] = useState('')
  const [tipoMasaje, setTipoMasaje] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7))
  const [mostrarClientes, setMostrarClientes] = useState(false)

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
    cargarClientes()
    cargarSesiones()
  }, [mesSeleccionado])

  async function cargarClientes() {
    const { data } = await supabase.from('clientes').select('*')
    setClientes(data || [])
  }

  async function cargarSesiones() {
    const { data } = await supabase
      .from('sesiones')
      .select('*, clientes(nombre)')
      .gte('fecha', `${mesSeleccionado}-01`)
      .lte('fecha', `${mesSeleccionado}-31`)
      .order('fecha', { ascending: false })
    setSesiones(data || [])
  }

  async function agregarCliente() {
    await supabase.from('clientes').insert([{ nombre, telefono }])
    setNombre('')
    setTelefono('')
    cargarClientes()
  }

  async function eliminarCliente(id: string) {
    const confirmar = confirm('¿Seguro? Se borrarán también todas sus sesiones.')
    if (!confirmar) return
    await supabase.from('sesiones').delete().eq('cliente_id', id)
    await supabase.from('clientes').delete().eq('id', id)
    cargarClientes()
    cargarSesiones()
  }

  async function agregarSesion() {
    await supabase.from('sesiones').insert([{
      cliente_id: clienteSeleccionado,
      fecha,
      tipo_masaje: tipoMasaje,
      monto: parseFloat(monto),
      forma_pago: formaPago
    }])
    setFecha('')
    setTipoMasaje('')
    setMonto('')
    alert('Sesión registrada!')
    cargarSesiones()
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalEfectivo = sesiones.filter(s => s.forma_pago === 'efectivo').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalTransferencia = sesiones.filter(s => s.forma_pago === 'transferencia').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalMes = totalEfectivo + totalTransferencia

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial', backgroundColor: '#e3dfd6', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#161616', margin: 0 }}>Mis Registros</h1>
        <button onClick={cerrarSesion} style={{ ...btnPrimary, backgroundColor: '#161616' }}>
          Cerrar Sesión
        </button>
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

      {/* REGISTRAR SESIÓN */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Registrar Sesión</h2>
        <select onChange={e => setClienteSeleccionado(e.target.value)} style={input}>
          <option value="">Seleccionar cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={input} />
        <input placeholder="Servicio" value={tipoMasaje} onChange={e => setTipoMasaje(e.target.value)} style={input} />
        <input placeholder="Monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={input} />
        <select value={formaPago} onChange={e => setFormaPago(e.target.value)} style={input}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <br />
        <button onClick={agregarSesion} style={btnPrimary}>Registrar Sesión</button>
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

      {/* SESIONES */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Sesiones de {mesSeleccionado}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Cliente</th>
              <th style={th}>Fecha</th>
              <th style={th}>Servicio</th>
              <th style={th}>Monto</th>
              <th style={th}>Pago</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              <tr key={s.id} style={{ backgroundColor: '#ffffff' }}>
                <td style={td}>{s.clientes?.nombre}</td>
                <td style={td}>{s.fecha}</td>
                <td style={td}>{s.tipo_masaje}</td>
                <td style={td}>${s.monto}</td>
                <td style={td}>{s.forma_pago}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  )
}