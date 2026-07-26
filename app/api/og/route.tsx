import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Paleta clara aprobada para el preview del link (misma familia que el resto de la app).
const CREMA = '#F6F1E9'
const CREMA_2 = '#EFE3CE'
const INK = '#2E2A24'
const BRASS = '#A9713C'
const LINE = '#E4D9C4'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nombre = searchParams.get('nombre') || 'tu profesional'
  const ubicacion = searchParams.get('ubicacion') || ''
  const logo = searchParams.get('logo') || ''

  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: logo ? CREMA : `linear-gradient(135deg, ${CREMA} 0%, ${CREMA_2} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Marca chica, siempre visible */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '56px',
          fontSize: '20px',
          color: BRASS,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontFamily: 'serif',
          display: 'flex',
        }}>
          Ribel Gestión
        </div>

        {logo ? (
          // ---- Con logo: layout de dos columnas, logo a la izquierda, texto a la derecha ----
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px', padding: '0 90px' }}>
            <img
              src={logo}
              width={220}
              height={220}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: `6px solid #fff`,
                boxShadow: '0 8px 30px rgba(46,42,36,0.15)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '640px' }}>
              <div style={{
                fontSize: '50px',
                color: INK,
                fontFamily: 'serif',
                fontWeight: 700,
                lineHeight: '1.2',
                display: 'flex',
              }}>
                {nombre}
              </div>
              {ubicacion && (
                <div style={{
                  marginTop: '14px',
                  fontSize: '28px',
                  color: BRASS,
                  fontFamily: 'sans-serif',
                  display: 'flex',
                }}>
                  {ubicacion}
                </div>
              )}
              <div style={{
                marginTop: '28px',
                fontSize: '24px',
                color: 'rgba(46,42,36,0.55)',
                fontFamily: 'sans-serif',
                display: 'flex',
              }}>
                Reservá tu turno
              </div>
            </div>
          </div>
        ) : (
          // ---- Sin logo: tarjeta fallback con degradé claro, nombre grande e iniciales ----
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 100px' }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: '#fff',
              border: `1.5px solid ${LINE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'serif',
              fontSize: '52px',
              fontWeight: 700,
              color: BRASS,
              marginBottom: '32px',
            }}>
              {iniciales}
            </div>
            <div style={{
              fontSize: '54px',
              color: INK,
              fontFamily: 'serif',
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: '1.2',
              display: 'flex',
            }}>
              {nombre}
            </div>
            {ubicacion && (
              <div style={{
                marginTop: '14px',
                fontSize: '28px',
                color: BRASS,
                fontFamily: 'sans-serif',
                display: 'flex',
              }}>
                {ubicacion}
              </div>
            )}
            <div style={{
              marginTop: '28px',
              fontSize: '24px',
              color: 'rgba(46,42,36,0.55)',
              fontFamily: 'sans-serif',
              display: 'flex',
            }}>
              Reservá tu turno
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}