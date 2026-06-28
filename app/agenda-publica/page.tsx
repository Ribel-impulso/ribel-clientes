import { Suspense } from 'react'
import AgendaPublicaCliente from './AgendaPublicaCliente'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata({ searchParams }: { searchParams: { u?: string } }) {
  const userId = searchParams.u
  let nombre = 'tu profesional'

  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', userId)
      .single()
    if (data?.nombre) nombre = data.nombre
  }

  const ogImageUrl = `https://ribelgestion.com/api/og?nombre=${encodeURIComponent(nombre)}`

  return {
    title: `Reservá tu turno con ${nombre}`,
    description: 'Elegí el día y horario que mejor te quede',
    openGraph: {
      title: `Reservá tu turno con ${nombre}`,
      description: 'Elegí el día y horario que mejor te quede',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      url: `https://ribelgestion.com/agenda-publica?u=${userId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Reservá tu turno con ${nombre}`,
      description: 'Elegí el día y horario que mejor te quede',
      images: [ogImageUrl],
    },
  }
}

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