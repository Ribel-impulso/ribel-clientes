'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [clientes, setClientes] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [fecha, setFecha] = useState('')
  const [tipoMasaje, setTipoMasaje] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    const { data } = await supabase.from('clientes').select('*')
    setClientes(data || [])
  }

  async function agregarCliente() {
    await supabase.from('clientes').insert([{ nombre, telefono }])
    setNombre('')
    setTelefono('')
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
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Ribel Clientes</h1>

      <h2>Agregar Cliente</h2>
      <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
      <button onClick={agregarCliente}>Agregar Cliente</button>

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

      <h2>Clientes ({clientes.length})</h2>
      <ul>
        {clientes.map(c => <li key={c.id}>{c.nombre} - {c.telefono}</li>)}
      </ul>
    </main>
  )
}