'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton'

type Vista = 'login' | 'registro' | 'recuperar'

// Paleta y tipografía compartidas con el resto de la app.
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
  const [mostrarPasswordPrincipal, setMostrarPasswordPrincipal] = useState(false)

  // Flujo de recuperación con código
  const [otpEnviado, setOtpEnviado] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

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

  // Paso 1 de recuperar: pide el email y envía el código
  async function handleEnviarCodigo() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setError('Error al enviar el código')
    } else {
      setOtpEnviado(true)
    }
    setCargando(false)
  }

  // Paso 2 de recuperar: valida el código e ingresa la nueva clave
  async function handleConfirmarCodigo() {
    setCargando(true)
    setError('')

    if (!codigo) {
      setError('Ingresá el código que te enviamos por email')
      setCargando(false)
      return
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setCargando(false)
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden')
      setCargando(false)
      return
    }

    const { error: errorVerify } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: 'recovery'
    })

    if (errorVerify) {
      setError('Código incorrecto o vencido. Pedí uno nuevo.')
      setCargando(false)
      return
    }

    const { error: errorUpdate } = await supabase.auth.updateUser({ password: nuevaPassword })

    if (errorUpdate) {
      setError('Error al actualizar la contraseña: ' + errorUpdate.message)
      setCargando(false)
      return
    }

    setMensaje('¡Contraseña actualizada! Ya podés ingresar.')
    setCargando(false)
    setTimeout(() => { window.location.href = '/login' }, 1500)
  }

  function volverALogin() {
    setVista('login')
    setError('')
    setMensaje('')
    setOtpEnviado(false)
    setCodigo('')
    setNuevaPassword('')
    setConfirmarPassword('')
  }

  // Íconos de ojo en SVG (prolijos, no emojis)
  function IconoOjo() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  function IconoOjoTachado() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </svg>
    )
  }

  function OjitoToggle({ mostrar, onClick }: { mostrar: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          position: 'absolute',
          right: '12px',
          top: '13px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: MUTED,
          padding: 0,
          lineHeight: 0,
          display: 'flex'
        }}
        tabIndex={-1}
        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {mostrar ? <IconoOjoTachado /> : <IconoOjo />}
      </button>
    )
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
                {vista === 'recuperar' && !otpEnviado && 'Recuperá tu contraseña'}
                {vista === 'recuperar' && otpEnviado && 'Ingresá el código'}
              </h2>

              <p style={{ color: MUTED, margin: '0 0 24px', fontSize: '13.5px', lineHeight: 1.5 }}>
                {vista === 'login' && 'Gestioná tus ingresos, turnos y agenda desde un solo lugar.'}
                {vista === 'registro' && '15 días gratis, sin tarjeta.'}
                {vista === 'recuperar' && !otpEnviado && 'Te enviamos un código de 6 dígitos a tu email.'}
                {vista === 'recuperar' && otpEnviado && `Revisá el email que enviamos a ${email} y completá los datos.`}
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

                  {vista !== 'recuperar' && (
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
                  )}

                  {vista === 'recuperar' && !otpEnviado && (
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEnviarCodigo()}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {vista === 'recuperar' && otpEnviado && (
                    <>
                      <div>
                        <label style={labelStyle}>Código recibido por email</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          value={codigo}
                          onChange={e => setCodigo(e.target.value)}
                          style={{ ...inputStyle, letterSpacing: '4px', fontWeight: 700 }}
                        />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Nueva contraseña</label>
                        <input
                          type={mostrarPassword ? 'text' : 'password'}
                          placeholder="Tu nueva contraseña"
                          value={nuevaPassword}
                          onChange={e => setNuevaPassword(e.target.value)}
                          style={{ ...inputStyle, paddingRight: '40px' }}
                        />
                        <OjitoToggle mostrar={mostrarPassword} onClick={() => setMostrarPassword(!mostrarPassword)} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Confirmar contraseña</label>
                        <input
                          type={mostrarConfirmar ? 'text' : 'password'}
                          placeholder="Repetí la contraseña"
                          value={confirmarPassword}
                          onChange={e => setConfirmarPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleConfirmarCodigo()}
                          style={{ ...inputStyle, paddingRight: '40px' }}
                        />
                        <OjitoToggle mostrar={mostrarConfirmar} onClick={() => setMostrarConfirmar(!mostrarConfirmar)} />
                      </div>
                    </>
                  )}

                  {vista !== 'recuperar' && (
                    <div style={{ position: 'relative' }}>
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
                        type={mostrarPasswordPrincipal ? 'text' : 'password'}
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && vista === 'login' && handleLogin()}
                        style={{ ...inputStyle, paddingRight: '40px' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '35px' }}>
                        <OjitoToggle mostrar={mostrarPasswordPrincipal} onClick={() => setMostrarPasswordPrincipal(!mostrarPasswordPrincipal)} />
                      </span>
                    </div>
                  )}

                  {error && (
                    <p style={{ color: '#B5573E', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>{error}</p>
                  )}

                  <button
                    onClick={
                      vista === 'login' ? handleLogin :
                      vista === 'registro' ? handleRegistro :
                      !otpEnviado ? handleEnviarCodigo :
                      handleConfirmarCodigo
                    }
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
                    {cargando ? 'Espera...' :
                      vista === 'login' ? 'Entrar a mi cuenta' :
                      vista === 'registro' ? 'Comenzar prueba gratis' :
                      !otpEnviado ? 'Enviar código' : 'Guardar contraseña'}
                  </button>

                  {vista === 'recuperar' && otpEnviado && (
                    <button
                      onClick={handleEnviarCodigo}
                      disabled={cargando}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: BRASS,
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        padding: 0,
                        marginTop: '-10px',
                        marginBottom: '18px'
                      }}
                    >
                      ¿No te llegó? Reenviar código
                    </button>
                  )}
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
                    onClick={volverALogin}
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

      <WhatsAppFloatingButton />
    </>
  )
}