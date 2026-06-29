'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Vista = 'login' | 'registro' | 'recuperar'

export default function Login() {
  const [vista, setVista] = useState<Vista>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e3dfd6',
    marginBottom: '12px',
    fontSize: '15px',
    fontFamily: 'Arial',
    boxSizing: 'border-box' as const,
    outline: 'none'
  }

  async function handleLogin() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setCargando(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  async function handleRegistro() {
    setCargando(true)
    setError('')
    if (!nombre || !email || !password) {
      setError('Completá todos los campos')
      setCargando(false)
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setCargando(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('Error al registrarse: ' + error.message)
      setCargando(false)
      return
    }
    if (data.user) {
      const hoy = new Date()
      const fechaVencimiento = new Date()
      fechaVencimiento.setDate(hoy.getDate() + 15)

      await supabase.from('profiles').insert({
        id: data.user.id,
        nombre: nombre
      })

      await supabase.from('suscripciones').insert({
        user_id: data.user.id,
        plan: 'prueba',
        estado: 'activa',
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      })

      await fetch('/api/email/bienvenida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre })
      })
    }
    setMensaje('¡Registro exitoso! Ya podés ingresar a tu cuenta.')
    setCargando(false)
  }

  async function handleRecuperar() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://ribel-clientes.vercel.app/reset-password'
    })
    if (error) {
      setError('Error al enviar el email')
    } else {
      setMensaje('Te enviamos un email para resetear tu contraseña.')
    }
    setCargando(false)
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
        <div style={{
          width: '64px', height: '64px',
          backgroundColor: '#ba9a7d', borderRadius: '50%',
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: '28px' }}>🌿</span>
        </div>

        <h1 style={{ color: '#161616', margin: '0 0 4px', fontSize: '24px' }}>Mis Registros</h1>
        <p style={{ color: '#9e9e9e', margin: '0 0 24px', fontSize: '14px' }}>
          {vista === 'login' && 'Ingresá a tu cuenta'}
          {vista === 'registro' && '15 días gratis, sin tarjeta'}
          {vista === 'recuperar' && 'Recuperá tu contraseña'}
        </p>

        {mensaje ? (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#16a34a', fontSize: '14px', margin: 0 }}>{mensaje}</p>
          </div>
        ) : (
          <>
            {vista === 'registro' && (
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                style={inputStyle}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />

            {vista !== 'recuperar' && (
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && vista === 'login' && handleLogin()}
                style={inputStyle}
              />
            )}

            {error && (
              <p style={{ color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              onClick={vista === 'login' ? handleLogin : vista === 'registro' ? handleRegistro : handleRecuperar}
              disabled={cargando}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: cargando ? '#d4b99a' : '#ba9a7d',
                color: '#ffffff', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontFamily: 'Arial',
                cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                marginBottom: '16px'
              }}
            >
              {cargando ? 'Espera...' : vista === 'login' ? 'Entrar' : vista === 'registro' ? 'Comenzar prueba gratis' : 'Enviar email'}
            </button>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {vista === 'login' && (
            <>
              <button onClick={() => { setVista('registro'); setError(''); setMensaje('') }}
                style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '14px' }}>
                ¿No tenés cuenta? Registrate gratis
              </button>
              <button onClick={() => { setVista('recuperar'); setError(''); setMensaje('') }}
                style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '13px' }}>
                Olvidé mi contraseña
              </button>
            </>
          )}
          {vista !== 'login' && (
            <button onClick={() => { setVista('login'); setError(''); setMensaje('') }}
              style={{ background: 'none', border: 'none', color: '#ba9a7d', cursor: 'pointer', fontSize: '14px' }}>
              ← Volver al login
            </button>
          )}
        </div>
      </div>
    </main>
  )
}