'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setCargando(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#e3dfd6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>

        {/* Logo / Título */}
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#ba9a7d',
          borderRadius: '50%',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '28px' }}>🌿</span>
        </div>

        <h1 style={{ color: '#161616', margin: '0 0 4px', fontSize: '24px' }}>Mis Registros</h1>
        <p style={{ color: '#9e9e9e', margin: '0 0 32px', fontSize: '14px' }}>Ingresá a tu cuenta</p>

        {/* Campos */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e3dfd6',
            marginBottom: '12px',
            fontSize: '15px',
            fontFamily: 'Arial',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e3dfd6',
            marginBottom: '20px',
            fontSize: '15px',
            fontFamily: 'Arial',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />

        {error && (
          <p style={{ color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={cargando}
          style={{
            width: '100%',
            padding: '13px',
            backgroundColor: cargando ? '#d4b99a' : '#ba9a7d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontFamily: 'Arial',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {cargando ? 'Ingresando...' : 'Entrar'}
        </button>

      </div>
    </main>
  )
}