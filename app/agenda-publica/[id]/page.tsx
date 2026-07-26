import { Suspense } from 'react'
import AgendaPublicaCliente from '../AgendaPublicaCliente'
import { createClient } from '@supabase/supabase-js'

// Ruta dinámica: /agenda-publica/[id] en vez de /agenda-publica?u=[id].
// Al ser una URL distinta por cada profesional (no un query param sobre la
// misma ruta), WhatsApp/Meta la tratan como una URL nueva para cachear el
// preview — no hay riesgo de que quede "pegado" el caché de otro profesional
// ni de pruebas viejas.
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params
  let nombre = 'tu profesional'
  let ubicacion: string | null = null
  let logoUrl: string | null = null

  if (userId) {
    const { data } = await supabase
      .from('configuracion_negocio')
      .select('nombre_negocio, ubicacion, logo_url')
      .eq('user_id', userId)
      .maybeSingle()
    if (data?.nombre_negocio) nombre = data.nombre_negocio
    if (data?.ubicacion) ubicacion = data.ubicacion
    if (data?.logo_url) logoUrl = data.logo_url
  }

  const ogParams = new URLSearchParams({ nombre })
  if (ubicacion) ogParams.set('ubicacion', ubicacion)
  if (logoUrl) ogParams.set('logo', logoUrl)
  const ogImageUrl = `https://ribelgestion.com/api/og?${ogParams.toString()}`

  return {
    title: `Reservá tu turno con ${nombre}`,
    description: 'Elegí el día y horario que mejor te quede',
    openGraph: {
      title: `Reservá tu turno con ${nombre}`,
      description: 'Elegí el día y horario que mejor te quede',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      url: `https://ribelgestion.com/agenda-publica/${userId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Reservá tu turno con ${nombre}`,
      description: 'Elegí el día y horario que mejor te quede',
      images: [ogImageUrl],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={
      <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
        <p>Cargando...</p>
      </div>
    }>
      <AgendaPublicaCliente profesionalIdProp={id} />
    </Suspense>
  )
}