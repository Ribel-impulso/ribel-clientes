'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [clientes, setClientes] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

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

  return (
    <main style={{ padding: '20px' }}>
      <h1>Mis Clientes</h1>
      <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
      <button onClick={agregarCliente}>Agregar</button>
      <ul>
        {clientes.map(c => <li key={c.id}>{c.nombre} - {c.telefono}</li>)}
      </ul>
    </main>
  )
}