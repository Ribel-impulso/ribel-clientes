'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { generarPdfFicha } from './fichaPdf'
import { nombreDelRubro } from './fichasConfig'
import type { RubroId } from './fichasConfig'

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

function blobADataUrl(blob: Blob): Promise<string | null> {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null)
    r.onerror = () => resolve(null)
    r.readAsDataURL(blob)
  })
}

// Baja una firma guardada y la convierte en imagen para el PDF
async function firmaADataUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('firmas').download(path)
  return data ? blobADataUrl(data) : null
}

// El logo es público: se intenta bajar, y si falla el PDF sale sin logo
async function urlADataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    return await blobADataUrl(await resp.blob())
  } catch {
    return null
  }
}

type PdfListo = {
  blob: Blob
  nombre: string
  whatsapp: string | null
  negocio: string
  nombreCliente: string
}

// Deja el número listo para el link de WhatsApp (solo dígitos, con código de país)
function limpiarWhatsapp(numero: string): string {
  const n = numero.trim()
  if (n.startsWith('+')) return n.replace(/\D/g, '')
  const digitos = n.replace(/\D/g, '')
  if (digitos.startsWith('54')) return digitos
  return '54' + (digitos.startsWith('0') ? digitos.slice(1) : digitos)
}

function nombreSeguro(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
  const [pdf, setPdf] = useState<PdfListo | null>(null)
  const [preparando, setPreparando] = useState(false)
  const [guardandoCopia, setGuardandoCopia] = useState(false)
  const [copiaGuardada, setCopiaGuardada] = useState(false)
  const [avisoPdf, setAvisoPdf] = useState('')
  const [errorPdf, setErrorPdf] = useState('')

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

  // Arma el PDF con lo que está guardado en la ficha
  async function armarPdf(): Promise<PdfListo | null> {
    if (!fila?.firma_cliente_path || !fila?.firma_profesional_path) return null

    const [cli, neg] = await Promise.all([
      supabase
        .from('clientes')
        .select('nombre, whatsapp, fecha_nacimiento')
        .eq('id', clienteId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('configuracion_negocio')
        .select('nombre_negocio, logo_url')
        .eq('user_id', userId)
        .maybeSingle(),
    ])

    const firmaC = await firmaADataUrl(fila.firma_cliente_path)
    const firmaP = await firmaADataUrl(fila.firma_profesional_path)
    if (!firmaC || !firmaP) return null
    const logo = neg.data?.logo_url ? await urlADataUrl(neg.data.logo_url) : null
    const nombreDelCliente: string = cli.data?.nombre || nombreCliente

    const blob = await generarPdfFicha({
      negocio: neg.data?.nombre_negocio || '',
      logoDataUrl: logo,
      cliente: {
        nombre: nombreDelCliente,
        whatsapp: cli.data?.whatsapp ?? null,
        fecha_nacimiento: cli.data?.fecha_nacimiento ?? null,
      },
      rubro: rubro as RubroId,
      datos: fila.datos || {},
      firmaCliente: { dataUrl: firmaC, fecha: fila.firma_cliente_at },
      firmaProfesional: { dataUrl: firmaP, fecha: fila.firma_profesional_at },
      hash: fila.datos_hash ?? null,
      consentimiento: TEXTO_CONSENTIMIENTO,
    })

    return {
      blob,
      nombre: `Ficha-${nombreSeguro(nombreDelRubro(rubro))}-${nombreSeguro(
        nombreDelCliente || 'cliente'
      )}.pdf`,
      whatsapp: cli.data?.whatsapp ?? null,
      negocio: neg.data?.nombre_negocio || '',
      nombreCliente: nombreDelCliente,
    }
  }

  // El PDF se prepara de antemano, así los botones responden al instante
  useEffect(() => {
    let activo = true
    setPdf(null)
    setErrorPdf('')
    setAvisoPdf('')
    setCopiaGuardada(false)
    if (
      !cargando &&
      !modificada &&
      fila?.firma_cliente_path &&
      fila?.firma_profesional_path
    ) {
      setPreparando(true)
      armarPdf()
        .then(r => {
          if (activo) setPdf(r)
        })
        .catch((e: any) => {
          if (activo)
            setErrorPdf('No se pudo armar el PDF: ' + (e?.message || 'error desconocido'))
        })
        .finally(() => {
          if (activo) setPreparando(false)
        })
    }
    return () => {
      activo = false
    }
  }, [fila, modificada, cargando])

  function descargarArchivo(p: PdfListo) {
    const url = URL.createObjectURL(p.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = p.nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  function descargarPdf() {
    if (!pdf) return
    setAvisoPdf('')
    descargarArchivo(pdf)
  }

  async function compartirPdf() {
    if (!pdf) return
    setErrorPdf('')
    setAvisoPdf('')
    const texto = `Hola ${pdf.nombreCliente}! Te enviamos tu ficha técnica${
      pdf.negocio ? ' de ' + pdf.negocio : ''
    } con las firmas, para que tengas tu registro. ¡Gracias!`

    try {
      const archivo = new File([pdf.blob], pdf.nombre, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: pdf.nombre, text: texto })
        return
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return // cerró el menú de compartir
    }

    // Si el dispositivo no permite compartir archivos (por ejemplo, la compu):
    // se descarga el PDF y se abre el chat de WhatsApp para adjuntarlo.
    descargarArchivo(pdf)
    if (pdf.whatsapp) {
      window.open(
        `https://wa.me/${limpiarWhatsapp(pdf.whatsapp)}?text=${encodeURIComponent(texto)}`,
        '_blank'
      )
      setAvisoPdf('Se descargó el PDF y se abrió WhatsApp. Adjuntalo en el chat del cliente.')
    } else {
      setAvisoPdf(
        'Se descargó el PDF. Este cliente no tiene WhatsApp cargado, así que tenés que enviarlo por otro medio.'
      )
    }
  }

  async function guardarCopia() {
    if (!pdf) return
    setErrorPdf('')
    setAvisoPdf('')
    setGuardandoCopia(true)
    try {
      const ruta = `${userId}/${clienteId}/${Date.now()}_${pdf.nombre}`
      const { error: errSubida } = await supabase.storage
        .from('archivos-clientes')
        .upload(ruta, pdf.blob, { contentType: 'application/pdf' })
      if (errSubida) {
        setErrorPdf('No se pudo guardar la copia: ' + errSubida.message)
        return
      }
      const { data: urlData } = supabase.storage
        .from('archivos-clientes')
        .getPublicUrl(ruta)
      const { error: errFila } = await supabase.from('archivos_clientes').insert([
        {
          cliente_id: clienteId,
          nombre: pdf.nombre,
          url: urlData.publicUrl,
          tipo: 'pdf',
          user_id: userId,
        },
      ])
      if (errFila) {
        setErrorPdf('No se pudo registrar la copia: ' + errFila.message)
        return
      }
      setCopiaGuardada(true)
      setAvisoPdf('Copia guardada en los archivos del cliente.')
    } catch (e: any) {
      setErrorPdf('No se pudo guardar la copia: ' + (e?.message || 'error desconocido'))
    } finally {
      setGuardandoCopia(false)
    }
  }

  const btnSecundario: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    background: PAPER_2,
    color: INK,
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: FONT_SANS,
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

          {fila.firma_cliente_path && fila.firma_profesional_path && (
            <div
              style={{
                marginTop: '18px',
                paddingTop: '14px',
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
                Registro en PDF
              </p>
              {modificada ? (
                <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
                  La ficha cambió después de la firma. Volvé a firmar para poder
                  generar el PDF.
                </p>
              ) : (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: MUTED }}>
                    Incluye los datos de la ficha y las dos firmas con fecha y hora.
                  </p>
                  {pdf ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button type="button" onClick={compartirPdf} style={btnPrimary}>
                        Compartir por WhatsApp
                      </button>
                      <button type="button" onClick={descargarPdf} style={btnSecundario}>
                        Descargar PDF
                      </button>
                      <button
                        type="button"
                        onClick={guardarCopia}
                        disabled={guardandoCopia || copiaGuardada}
                        style={{
                          ...btnSecundario,
                          opacity: guardandoCopia || copiaGuardada ? 0.7 : 1,
                        }}
                      >
                        {copiaGuardada
                          ? 'Copia guardada'
                          : guardandoCopia
                          ? 'Guardando...'
                          : 'Guardar copia en el cliente'}
                      </button>
                    </div>
                  ) : (
                    !errorPdf && (
                      <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
                        {preparando ? 'Preparando el PDF...' : ''}
                      </p>
                    )
                  )}
                </>
              )}
              {avisoPdf && (
                <p style={{ color: SAGE, fontSize: '13px', fontWeight: 600 }}>
                  {avisoPdf}
                </p>
              )}
              {errorPdf && (
                <p style={{ color: CLAY, fontSize: '13px', fontWeight: 600 }}>
                  {errorPdf}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}