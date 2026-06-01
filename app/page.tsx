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

  const th: React.CSSProperties = { border: '1px solid #ccc', padding: '8px', textAlign: 'left', backgroundColor: '#f0f0f0' }
  const td: React.CSSProperties = { border: '1px solid #ccc', padding: '8px' }

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
    <main style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mis Registros</h1>
        <button onClick={cerrarSesion} style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      <h2>Agregar Cliente</h2>
      <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
      <button onClick={agregarCliente}>Agregar Cliente</button>

      <h2>
        Clientes ({clientes.length})
        <button onClick={() => setMostrarClientes(!mostrarClientes)} style={{ marginLeft: '10px', fontSize: '14px' }}>
          {mostrarClientes ? 'Ocultar' : 'Ver'}
        </button>
      </h2>
      {mostrarClientes && (
        <ul>
          {clientes.map(c => (
            <li key={c.id}>
              {c.nombre} - {c.telefono}
              <button onClick={() => eliminarCliente(c.id)} style={{ marginLeft: '10px', color: 'red' }}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Registrar Sesión</h2>
      <select onChange={e => setClienteSeleccionado(e.target.value)}>
        <option value="">Seleccionar cliente</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
      <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      <input placeholder="Servicio" value={tipoMasaje} onChange={e => setTipoMasaje(e.target.value)} />
      <input placeholder="Monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} />
      <select value={formaPago} onChange={e => setFormaPago(e.target.value)}>
        <option value="efectivo">Efectivo</option>
        <option value="transferencia">Transferencia</option>
      </select>
      <button onClick={agregarSesion}>Registrar Sesión</button>

      <h2>Resumen del mes</h2>
      <input type="month" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} />
      <p>💵 Efectivo: ${totalEfectivo}</p>
      <p>🏦 Transferencia: ${totalTransferencia}</p>
      <p><strong>💰 Total: ${totalMes}</strong></p>

      <h2>Sesiones de {mesSeleccionado}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
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
            <tr key={s.id}>
              <td style={td}>{s.clientes?.nombre}</td>
              <td style={td}>{s.fecha}</td>
              <td style={td}>{s.tipo_masaje}</td>
              <td style={td}>${s.monto}</td>
              <td style={td}>{s.forma_pago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}