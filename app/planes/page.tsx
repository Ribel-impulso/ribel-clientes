'use client'
import { useState } from 'react'

const planes = [
  {
    id: 'mensual',
    nombre: 'Mensual',
    precio: 7999,
    precioTexto: '$7.999',
    dolar: 'USD 8',
    periodo: 'por mes',
    destacado: false,
  },
  {
    id: 'semestral',
    nombre: 'Semestral',
    precio: 29999,
    precioTexto: '$29.999',
    dolar: 'USD 30',
    periodo: 'cada 6 meses',
    destacado: true,
    ahorro: 'Ahorrás $17.995'
  },
  {
    id: 'anual',
    nombre: 'Anual',
    precio: 47999,
    precioTexto: '$47.999',
    dolar: 'USD 48',
    periodo: 'por año',
    destacado: false,
    ahorro: 'Ahorrás $47.989'
  },
  {
    id: 'ilimitado',
    nombre: 'De por vida',
    precio: 99999,
    precioTexto: '$99.999',
    dolar: 'USD 100',
    periodo: 'pago único',
    destacado: false,
    ahorro: 'Sin renovaciones, para siempre'
  }
]

export default function Planes() {
  const [moneda, setMoneda] = useState<'ars' | 'usd'>('ars')
  const [cargando, setCargando] = useState<string | null>(null)

  async function handlePagoMP(plan: typeof planes[0]) {
    setCargando(plan.id)
    try {
      const res = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          precio: plan.precio,
          nombre: plan.nombre
        })
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        alert('Error al generar el pago. Intentá de nuevo.')
      }
    } catch {
      alert('Error de conexión. Intentá de nuevo.')
    }
    setCargando(null)
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#e3dfd6',
      fontFamily: 'Arial',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>

        <div style={{
          width: '64px', height: '64px',
          backgroundColor: '#ba9a7d', borderRadius: '50%',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: '28px' }}>🌿</span>
        </div>

        <h1 style={{ color: '#161616', fontSize: '26px', margin: '0 0 8px' }}>
          Tu período de prueba terminó
        </h1>
        <p style={{ color: '#666', fontSize: '15px', margin: '0 0 32px' }}>
          Elegí el plan que mejor se adapta a vos y seguí usando Ribel Gestión sin interrupciones.
        </p>

        <div style={{
          display: 'inline-flex',
          backgroundColor: '#d4cfc6',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '32px'
        }}>
          <button onClick={() => setMoneda('ars')} style={{
            padding: '8px 20px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'Arial', fontSize: '14px',
            fontWeight: moneda === 'ars' ? 'bold' : 'normal',
            backgroundColor: moneda === 'ars' ? '#ffffff' : 'transparent',
            color: '#161616'
          }}>🇦🇷 Pesos ARS</button>
          <button onClick={() => setMoneda('usd')} style={{
            padding: '8px 20px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'Arial', fontSize: '14px',
            fontWeight: moneda === 'usd' ? 'bold' : 'normal',
            backgroundColor: moneda === 'usd' ? '#ffffff' : 'transparent',
            color: '#161616'
          }}>🌍 Dólares USD</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {planes.map(plan => (
            <div key={plan.id} style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              border: plan.destacado ? '2px solid #ba9a7d' : '1px solid #e3dfd6',
              boxShadow: plan.destacado ? '0 4px 16px rgba(186,154,125,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
              position: 'relative',
              textAlign: 'left'
            }}>
              {plan.destacado && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#ba9a7d', color: '#fff',
                  fontSize: '12px', fontWeight: 'bold',
                  padding: '4px 14px', borderRadius: '20px'
                }}>⭐ MÁS ELEGIDO</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '17px', color: '#161616' }}>
                    {plan.nombre}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>{plan.periodo}</p>
                  {plan.ahorro && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ba9a7d', fontWeight: 'bold' }}>
                      {plan.ahorro}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>
                    {moneda === 'ars' ? plan.precioTexto : plan.dolar}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                {moneda === 'ars' ? (
                  <button
                    onClick={() => handlePagoMP(plan)}
                    disabled={cargando === plan.id}
                    style={{
                      width: '100%', padding: '12px',
                      backgroundColor: cargando === plan.id ? '#7db8d4' : '#009ee3',
                      color: '#ffffff', border: 'none', borderRadius: '8px',
                      cursor: cargando === plan.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'Arial', fontWeight: 'bold', fontSize: '14px'
                    }}>
                    {cargando === plan.id ? 'Procesando...' : '💳 Pagar con Mercado Pago'}
                  </button>
                ) : (
                  <button
                    onClick={() => alert('PayPal — próximamente')}
                    style={{
                      width: '100%', padding: '12px',
                      backgroundColor: '#003087', color: '#ffffff',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontFamily: 'Arial',
                      fontWeight: 'bold', fontSize: '14px'
                    }}>
                    🅿️ Pagar con PayPal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '32px', fontSize: '13px', color: '#999' }}>
          ¿Tenés dudas? Escribime a{' '}
          <a href="mailto:ribel.contacto@gmail.com" style={{ color: '#ba9a7d' }}>
            ribel.contacto@gmail.com
          </a>
        </p>

      </div>
    </main>
  )
}