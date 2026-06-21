'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    // Supabase procesa el token de la URL automáticamente
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setListo(true)
      }
    })
  }, [])

  async function handleReset() {
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Error al actualizar: ' + error.message)
    } else {
      setMensaje('¡Contraseña actualizada! Redirigiendo...')
      setTimeout(() => { window.location.href = '/login' }, 2000)
    }
    setCargando(false)
  }

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

        <h1 style={{ color: '#161616', margin: '0 0 4px', fontSize: '24px' }}>Nueva contraseña</h1>
        <p style={{ color: '#9e9e9e', margin: '0 0 24px', fontSize: '14px' }}>Ingresá tu nueva contraseña</p>

        {mensaje ? (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#16a34a', fontSize: '14px', margin: 0 }}>{mensaje}</p>
          </div>
        ) : !listo ? (
          <p style={{ color: '#9e9e9e', fontSize: '14px' }}>Verificando enlace...</p>
        ) : (
          <>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              style={inputStyle}
            />
            {error && <p style={{ color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
            <button
              onClick={handleReset}
              disabled={cargando}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: cargando ? '#d4b99a' : '#ba9a7d',
                color: '#ffffff', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontFamily: 'Arial',
                cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold'
              }}
            >
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}