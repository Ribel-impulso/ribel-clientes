'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Vista = 'login' | 'registro' | 'recuperar'

// Paleta y tipografía compartidas con el resto de la app.
// Recomendado: mover estas fuentes a next/font en el layout raíz para
// evitar el parpadeo de carga y mejorar performance (te lo dejo así por
// ahora para que puedas ver el resultado sin tocar el layout todavía).
const INK = '#1B2420'
const PAPER = '#F4EFE4'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_LIGHT = '#C9A876'
const SAGE = '#5E7A5A'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'

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
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${LINE}`,
    marginBottom: '14px',
    fontSize: '14px',
    fontFamily: "'Public Sans', sans-serif",
    color: INK,
    backgroundColor: PAPER_2,
    boxSizing: 'border-box' as const,
    outline: 'none'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: INK,
    marginBottom: '6px',
    fontFamily: "'Public Sans', sans-serif"
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
    // Antes apuntaba a https://ribel-clientes.vercel.app/reset-password
    // (dominio viejo de Vercel). Ahora usa tu dominio propio.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ribelgestion.com/reset-password'
    })
    if (error) {
      setError('Error al enviar el email')
    } else {
      setMensaje('Te enviamos un email para resetear tu contraseña.')
    }
    setCargando(false)
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Public+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style jsx>{`
        .shell {
          min-height: 100vh;
          background-color: ${PAPER};
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(27,36,32,0.035) 28px),
            radial-gradient(rgba(27,36,32,0.05) 1px, transparent 1px);
          background-size: auto, 14px 14px;
          font-family: 'Public Sans', sans-serif;
          padding: 24px 16px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .backpill-row {
          width: 100%;
          max-width: 1040px;
          margin-bottom: 24px;
        }
        .grid {
          width: 100%;
          max-width: 1040px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          flex: 1;
        }
        .brand-panel {
          display: none;
        }
        .form-col {
          width: 100%;
          max-width: 400px;
        }
        @media (min-width: 960px) {
          .shell {
            justify-content: center;
            padding: 40px 32px;
          }
          .grid {
            flex-direction: row;
            align-items: center;
            gap: 64px;
          }
          .brand-panel {
            display: block;
            flex: 1;
            max-width: 480px;
          }
          .form-col {
            flex: 0 0 400px;
          }
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 18px;
        }
        .feature-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(94,122,90,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      <main className="shell">
        <div className="backpill-row">
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: PAPER_2,
              border: `1px solid ${LINE}`,
              padding: '9px 16px 9px 12px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 600,
              color: INK,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(27,36,32,0.06)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </button>
        </div>

        <div className="grid">
          <div className="brand-panel">
            <h2
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontWeight: 700,
                fontSize: '38px',
                lineHeight: 1.15,
                color: INK,
                margin: '0 0 20px',
                letterSpacing: '-0.01em'
              }}
            >
              Tu negocio, tus turnos y tus finanzas en un solo lugar.
            </h2>
            <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.6, margin: '0 0 32px', maxWidth: '420px' }}>
              Ribel Gestión te ayuda a organizar tu agenda, controlar ingresos y egresos, y llevar tu negocio con claridad, desde un panel privado.
            </p>

            <div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: INK }}>Agenda y turnos</p>
                  <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Organizá tu disponibilidad y evitá superposiciones.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: INK }}>Finanzas claras</p>
                  <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Registrá ingresos y egresos, y mirá tu balance al instante.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: INK }}>Todo en un panel privado</p>
                  <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Acceso exclusivo para vos, sin vueltas.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-col">
            <div style={{ marginBottom: '20px' }}>
              <h1
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontWeight: 600,
                  fontSize: '26px',
                  color: INK,
                  margin: '0 0 4px'
                }}
              >
                Ribel Gestión
              </h1>
              <p style={{ color: SAGE, margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
                Orden y claridad para tu negocio
              </p>
            </div>

            <div
              style={{
                backgroundColor: PAPER_2,
                border: `1px solid ${LINE}`,
                borderRadius: '18px',
                padding: '28px 24px'
              }}
            >
              <p
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: BRASS,
                  backgroundColor: 'rgba(168,127,76,0.1)',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  margin: '0 0 16px'
                }}
              >
                {vista === 'login' && 'Acceso profesional'}
                {vista === 'registro' && 'Prueba gratuita'}
                {vista === 'recuperar' && 'Recuperar acceso'}
              </p>

              <h2
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontWeight: 600,
                  fontSize: '24px',
                  color: INK,
                  margin: '0 0 8px'
                }}
              >
                {vista === 'login' && 'Ingresá a tu cuenta'}
                {vista === 'registro' && 'Creá tu cuenta'}
                {vista === 'recuperar' && 'Recuperá tu contraseña'}
              </h2>

              <p style={{ color: MUTED, margin: '0 0 24px', fontSize: '13.5px', lineHeight: 1.5 }}>
                {vista === 'login' && 'Gestioná tus ingresos, turnos y agenda desde un solo lugar.'}
                {vista === 'registro' && '15 días gratis, sin tarjeta.'}
                {vista === 'recuperar' && 'Te enviamos un email para restablecerla.'}
              </p>

              {mensaje ? (
                <div
                  style={{
                    backgroundColor: '#EAF0E8',
                    border: '1px solid #CFDDC9',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '16px'
                  }}
                >
                  <p style={{ color: SAGE, fontSize: '13.5px', margin: 0, fontWeight: 600 }}>{mensaje}</p>
                </div>
              ) : (
                <>
                  {vista === 'registro' && (
                    <div>
                      <label style={labelStyle}>Nombre completo</label>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {vista !== 'recuperar' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <label style={{ ...labelStyle, marginBottom: '6px' }}>Contraseña</label>
                        {vista === 'login' && (
                          <button
                            onClick={() => { setVista('recuperar'); setError(''); setMensaje('') }}
                            style={{ background: 'none', border: 'none', color: BRASS, cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}
                          >
                            ¿La olvidaste?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && vista === 'login' && handleLogin()}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {error && (
                    <p style={{ color: '#B5573E', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>{error}</p>
                  )}

                  <button
                    onClick={vista === 'login' ? handleLogin : vista === 'registro' ? handleRegistro : handleRecuperar}
                    disabled={cargando}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: cargando ? BRASS_LIGHT : INK,
                      color: PAPER_2,
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14.5px',
                      fontFamily: "'Public Sans', sans-serif",
                      cursor: cargando ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      marginBottom: '18px'
                    }}
                  >
                    {cargando ? 'Espera...' : vista === 'login' ? 'Entrar a mi cuenta' : vista === 'registro' ? 'Comenzar prueba gratis' : 'Enviar email'}
                  </button>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                {vista === 'login' && (
                  <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
                    ¿No tenés cuenta?{' '}
                    <button
                      onClick={() => { setVista('registro'); setError(''); setMensaje('') }}
                      style={{ background: 'none', border: 'none', color: INK, cursor: 'pointer', fontSize: '13px', fontWeight: 700, padding: 0, borderBottom: `1.5px solid ${BRASS_LIGHT}` }}
                    >
                      Creála gratis
                    </button>
                  </p>
                )}
                {vista !== 'login' && (
                  <button
                    onClick={() => { setVista('login'); setError(''); setMensaje('') }}
                    style={{ background: 'none', border: 'none', color: BRASS, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    ← Volver al login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}