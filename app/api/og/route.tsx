import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nombre = searchParams.get('nombre') || 'tu profesional'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #2C2825 0%, #3d3430 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          position: 'relative',
        }}
      >
        {/* Círculo decorativo */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '300px',
          height: '300px',
          background: 'rgba(186, 154, 125, 0.12)',
          borderRadius: '50%',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '220px',
          height: '220px',
          background: 'rgba(186, 154, 125, 0.08)',
          borderRadius: '50%',
          display: 'flex',
        }} />

        {/* Marca */}
        <div style={{
          fontSize: '18px',
          color: '#ba9a7d',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          fontFamily: 'serif',
          display: 'flex',
        }}>
          RIBEL GESTIÓN
        </div>

        {/* Línea */}
        <div style={{
          width: '60px',
          height: '2px',
          background: '#ba9a7d',
          display: 'flex',
        }} />

        {/* Título */}
        <div style={{
          fontSize: '52px',
          color: '#ffffff',
          fontFamily: 'serif',
          textAlign: 'center',
          lineHeight: '1.2',
          padding: '0 80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>Reservá tu turno con</span>
          <span style={{ color: '#ba9a7d', fontStyle: 'italic' }}>{nombre}</span>
        </div>

        {/* Subtítulo */}
        <div style={{
          fontSize: '22px',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'sans-serif',
          letterSpacing: '1px',
          display: 'flex',
        }}>
          Elegí el día y horario que mejor te quede
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}