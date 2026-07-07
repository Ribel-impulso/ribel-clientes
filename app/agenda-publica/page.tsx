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
  let logoUrl: string | null = null

  if (userId) {
    const { data } = await supabase
      .from('configuracion_negocio')
      .select('nombre_negocio, logo_url')
      .eq('user_id', userId)
      .maybeSingle()
    if (data?.nombre_negocio) nombre = data.nombre_negocio
    if (data?.logo_url) logoUrl = data.logo_url
  }

  // Si el profesional ya subió su logo, lo usamos directo como imagen del preview.
  // Si no, caemos al generador automático con el nombre (/api/og).
  const ogImageUrl = logoUrl || `https://ribelgestion.com/api/og?nombre=${encodeURIComponent(nombre)}`

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