'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
    } else {
      window.location.href = '/'
    }
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Ribel Clientes</h1>
      <h2>Iniciar Sesión</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />
      <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={iniciarSesion} style={{ padding: '10px 20px' }}>Entrar</button>
    </main>
  )
}