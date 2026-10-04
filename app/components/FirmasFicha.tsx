'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// Misma paleta que el resto de la app.
const INK = '#1B2420'
const PAPER = '#F4EFE4'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_BG = 'rgba(168,127,76,0.1)'
const SAGE = '#5E7A5A'
const CLAY = '#A85A44'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'
const FONT_SANS = "'Public Sans', sans-serif"

// Texto del consentimiento (se puede editar acá)
const TEXTO_CONSENTIMIENTO =
  'Declaro que los datos de esta ficha son correctos y autorizo su registro y uso para mi atención.'

type Quien = 'cliente' | 'profesional'

// ---------- Ayudas ----------

// Ordena las claves para que el mismo contenido dé siempre el mismo resultado
function ordenar(v: any): any {
  if (Array.isArray(v)) return v.map(ordenar)
  if (v && typeof v === 'object') {
    return Object.keys(v)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = ordenar(v[k])
        return acc
      }, {})
  }
  return v
}

// Huella (SHA-256) del contenido de la ficha, para detectar cambios posteriores a la firma
async function hashDatos(d: any): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null
    const bytes = new TextEncoder().encode(JSON.stringify(ordenar(d)))
    const buf = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

function aBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(res => c.toBlob(b => res(b), 'image/png'))
}

function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------- Recuadro para firmar con el dedo o el mouse ----------

function PadFirma({
  canvasRef,
  onTinta,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onTinta: () => void
}) {
  const dibujando = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    c.width = r.width * dpr
    c.height = r.height * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INK
  }, [canvasRef])

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={e => {
        const ctx = e.currentTarget.getContext('2d')
        if (!ctx) return
        e.currentTarget.setPointerCapture(e.pointerId)
        dibujando.current = true
        const p = punto(e)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
      }}
      onPointerMove={e => {
        if (!dibujando.current) return
        const ctx = e.currentTarget.getContext('2d')
        if (!ctx) return
        const p = punto(e)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
        onTinta()
      }}
      onPointerUp={() => {
        dibujando.current = false
      }}
      onPointerCancel={() => {
        dibujando.current = false
      }}
      style={{
        width: '100%',
        height: '120px',
        display: 'block',
        touchAction: 'none',
        border: `1px dashed ${MUTED}`,
        borderRadius: '10px',
        backgroundColor: PAPER,
        boxSizing: 'border-box',
      }}
    />
  )
}

// ---------- Sección completa de firmas ----------

export default function FirmasFicha({
  userId,
  clienteId,
  nombreCliente,
  rubro,
  version,
  btnPrimary,
}: {
  userId: string
  clienteId: string
  nombreCliente: string
  rubro: string
  version: number
  btnPrimary: React.CSSProperties
}) {
  const [cargando, setCargando] = useState(true)
  const [fila, setFila] = useState<any>(null)
  const [urls, setUrls] = useState<Partial<Record<Quien, string>>>({})
  const [modificada, setModificada] = useState(false)
  const [tinta, setTinta] = useState<Record<Quien, boolean>>({
    cliente: false,
    profesional: false,
  })
  const [reemplazo, setReemplazo] = useState<Record<Quien, boolean>>({
    cliente: false,
    profesional: false,
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const canvasCliente = useRef<HTMLCanvasElement>(null)
  const canvasProfesional = useRef<HTMLCanvasElement>(null)
  const refDe = (q: Quien) => (q === 'cliente' ? canvasCliente : canvasProfesional)

  useEffect(() => {
    cargar()
  }, [userId, clienteId, rubro, version])

  async function cargar() {
    const { data } = await supabase
      .from('fichas_tecnicas')
      .select(
        'datos, datos_hash, firma_cliente_path, firma_cliente_at, firma_profesional_path, firma_profesional_at'
      )
      .eq('cliente_id', clienteId)
      .eq('rubro', rubro)
      .eq('user_id', userId)
      .maybeSingle()

    setFila(data ?? null)

    const nuevas: Partial<Record<Quien, string>> = {}
    for (const q of ['cliente', 'profesional'] as const) {
      const path = data?.[`firma_${q}_path`]
      if (path) {
        const { data: u } = await supabase.storage
          .from('firmas')
          .createSignedUrl(path, 300)
        if (u?.signedUrl) nuevas[q] = u.signedUrl
      }
    }
    setUrls(nuevas)

    const hayFirma = !!(data?.firma_cliente_path || data?.firma_profesional_path)
    if (data?.datos_hash && hayFirma) {
      const actual = await hashDatos(data.datos || {})
      setModificada(actual !== null && actual !== data.datos_hash)
    } else {
      setModificada(false)
    }
    setCargando(false)
  }

  function marcarTinta(q: Quien) {
    setTinta(prev => (prev[q] ? prev : { ...prev, [q]: true }))
  }

  function borrar(q: Quien) {
    const c = refDe(q).current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.restore()
    setTinta(prev => ({ ...prev, [q]: false }))
  }

  async function guardarFirmas() {
    setError('')
    setMensaje('')
    const quiere: Record<Quien, boolean> = {
      cliente: tinta.cliente && !!canvasCliente.current,
      profesional: tinta.profesional && !!canvasProfesional.current,
    }
    if (!quiere.cliente && !quiere.profesional) {
      setError('Firmá en alguno de los recuadros antes de guardar.')
      return
    }
    if (
      modificada &&
      ((fila?.firma_cliente_path && !quiere.cliente) ||
        (fila?.firma_profesional_path && !quiere.profesional))
    ) {
      setError(
        'La ficha cambió después de la firma anterior. Firmá de nuevo las dos partes.'
      )
      return
    }

    setGuardando(true)

    // La huella se calcula sobre lo que está guardado en la ficha
    const { data: ficha } = await supabase
      .from('fichas_tecnicas')
      .select('datos')
      .eq('cliente_id', clienteId)
      .eq('rubro', rubro)
      .eq('user_id', userId)
      .maybeSingle()
    if (!ficha) {
      setError('Primero tocá "Guardar ficha" y después firmá.')
      setGuardando(false)
      return
    }

    const cambios: Record<string, any> = {
      datos_hash: await hashDatos(ficha.datos || {}),
    }
    const ahora = new Date().toISOString()

    for (const q of ['cliente', 'profesional'] as const) {
      if (!quiere[q]) continue
      const canvas = refDe(q).current
      const blob = canvas ? await aBlob(canvas) : null
      if (!blob) {
        setError('No se pudo leer la firma. Probá de nuevo.')
        setGuardando(false)
        return
      }
      const path = `${userId}/${clienteId}/${rubro}-${q}.png`
      const { error: errSubida } = await supabase.storage
        .from('firmas')
        .upload(path, blob, { upsert: true, contentType: 'image/png' })
      if (errSubida) {
        setError('No se pudo subir la firma: ' + errSubida.message)
        setGuardando(false)
        return
      }
      cambios[`firma_${q}_path`] = path
      cambios[`firma_${q}_at`] = ahora
    }

    const { error: errGuardar } = await supabase
      .from('fichas_tecnicas')
      .update(cambios)
      .eq('cliente_id', clienteId)
      .eq('rubro', rubro)
      .eq('user_id', userId)

    setGuardando(false)
    if (errGuardar) {
      setError('No se pudo guardar: ' + errGuardar.message)
      return
    }

    setTinta({ cliente: false, profesional: false })
    setReemplazo({ cliente: false, profesional: false })
    await cargar()
    setMensaje('¡Firmas guardadas!')
    setTimeout(() => setMensaje(''), 3000)
  }

  function bloqueFirma(q: Quien) {
    const titulo =
      q === 'cliente'
        ? `Firma de ${nombreCliente || 'el cliente'}`
        : 'Firma de la profesional'
    const path = fila?.[`firma_${q}_path`]
    const fecha = fila?.[`firma_${q}_at`]
    const yaFirmada = !!path && !reemplazo[q]

    return (
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '13px',
            fontFamily: FONT_SANS,
          }}
        >
          <span style={{ color: INK, fontWeight: 600 }}>{titulo}</span>
          {yaFirmada ? (
            <button
              type="button"
              onClick={() => setReemplazo(prev => ({ ...prev, [q]: true }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: BRASS,
                fontWeight: 600,
                fontSize: '13px',
                fontFamily: FONT_SANS,
                padding: 0,
              }}
            >
              Volver a firmar
            </button>
          ) : (
            <span>
              <span style={{ color: tinta[q] ? SAGE : MUTED }}>
                {tinta[q] ? 'Listo para guardar' : 'Sin firmar'}
              </span>
              {' · '}
              <button
                type="button"
                onClick={() => borrar(q)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: BRASS,
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: FONT_SANS,
                  padding: 0,
                }}
              >
                Borrar
              </button>
            </span>
          )}
        </div>

        {yaFirmada ? (
          <div
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: '10px',
              backgroundColor: PAPER,
              padding: '8px',
              textAlign: 'center',
            }}
          >
            {urls[q] ? (
              <img
                src={urls[q]}
                alt={titulo}
                style={{ maxWidth: '100%', maxHeight: '110px' }}
              />
            ) : (
              <span style={{ fontSize: '12px', color: MUTED }}>
                No se pudo mostrar la firma.
              </span>
            )}
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: SAGE, fontWeight: 600 }}>
              Firmado el {formatearFecha(fecha)}
            </p>
          </div>
        ) : (
          <PadFirma canvasRef={refDe(q)} onTinta={() => marcarTinta(q)} />
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: `1px solid ${LINE}`,
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontWeight: 700,
          fontSize: '14px',
          color: INK,
          fontFamily: FONT_SANS,
        }}
      >
        Consentimiento y firmas
      </p>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: MUTED }}>
        {TEXTO_CONSENTIMIENTO}
      </p>

      {cargando ? (
        <p style={{ color: MUTED, fontSize: '13px' }}>Cargando...</p>
      ) : !fila ? (
        <p style={{ color: MUTED, fontSize: '13px' }}>
          Para poder firmar, primero guardá la ficha con el botón{' '}
          <strong>Guardar ficha</strong>.
        </p>
      ) : (
        <>
          {modificada && (
            <p
              style={{
                margin: '0 0 12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: BRASS_BG,
                border: `1px solid ${BRASS}`,
                color: INK,
                fontSize: '13px',
                fontFamily: FONT_SANS,
              }}
            >
              La ficha se modificó después de la firma. Para que el consentimiento
              valga sobre estos datos, volvé a firmar.
            </p>
          )}

          {bloqueFirma('cliente')}
          {bloqueFirma('profesional')}

          {error && (
            <p style={{ color: CLAY, fontSize: '13px', fontWeight: 600 }}>{error}</p>
          )}
          <button
            type="button"
            onClick={guardarFirmas}
            disabled={guardando}
            style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}
          >
            {guardando ? 'Guardando...' : 'Guardar firmas'}
          </button>
          {mensaje && (
            <span
              style={{
                marginLeft: '12px',
                fontSize: '13px',
                color: SAGE,
                fontWeight: 600,
              }}
            >
              {mensaje}
            </span>
          )}
        </>
      )}
    </div>
  )
}