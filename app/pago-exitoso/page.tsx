'use client'
export default function PagoExitoso() {
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
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ color: '#161616', fontSize: '22px', margin: '0 0 8px' }}>¡Pago exitoso!</h1>
        <p style={{ color: '#666', fontSize: '15px', margin: '0 0 24px' }}>
          Tu suscripción está activa. Ya podés seguir usando Ribel Gestión.
        </p>
        <a href="/" style={{
          backgroundColor: '#ba9a7d',
          color: '#ffffff',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '15px'
        }}>
          Ir a la app →
        </a>
      </div>
    </main>
  )
}