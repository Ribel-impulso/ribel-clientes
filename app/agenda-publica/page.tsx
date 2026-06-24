import { Suspense } from 'react'
import AgendaPublicaCliente from './AgendaPublicaCliente'

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
        <p>Cargando...</p>
      </div>
    }>
      <AgendaPublicaCliente />
    </Suspense>
  )
}