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
      .gte('fecha', ${mesSeleccionado}-01)
      .lte('fecha', ${mesSeleccionado}-31)
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
    await supabase.from('clientes').delete().eq('id', id)
    cargarClientes()
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

  const totalEfectivo = sesiones.filter(s => s.forma_pago === 'efectivo').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalTransferencia = sesiones.filter(s => s.forma_pago === 'transferencia').reduce((sum, s) => sum + (s.monto || 0), 0)
  const totalMes = totalEfectivo + totalTransferencia

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Ribel Clientes</h1>

      <h2>Agregar Cliente</h2>
      <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
      <button onClick={agregarCliente}>Agregar Cliente</button>

      <h2>Clientes ({clientes.length})</h2>
      <ul>
        {clientes.map(c => (
          <li key={c.id}>
            {c.nombre} - {c.telefono}
            <button onClick={() => eliminarCliente(c.id)} style={{ marginLeft: '10px', color: 'red' }}>Eliminar</button>
          </li>
        ))}
      </ul>

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
      <p><strong>Total: ${totalMes}</strong></p>

      <h2>Sesiones de {mesSeleccionado}</h2>
      <ul>
        {sesiones.map(s => (
          <li key={s.id}>
            <strong>{s.clientes?.nombre}</strong> — {s.fecha} — {s.tipo_masaje} — ${s.monto} — {s.forma_pago}
          </li>
        ))}
      </ul>
    </main>
  )
}