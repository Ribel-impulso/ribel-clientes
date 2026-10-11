// =====================================================================
// fichaPdf.ts
// Arma el PDF de la ficha técnica: datos del cliente, campos del rubro,
// procedimientos, las dos firmas con fecha y la huella de verificación.
// =====================================================================

import { camposDeFicha, calcularEdad, nombreDelRubro } from './fichasConfig'
import type { RubroId, Procedimiento } from './fichasConfig'

type Color = [number, number, number]

// Colores tomados de la landing de Ribel Gestión
const INK: Color = [17, 24, 39]
const MUTED: Color = [107, 114, 128]
const BRASS: Color = [79, 70, 229] // violeta de la marca (acento)
const LINE: Color = [229, 231, 235]

export type FirmaPdf = { dataUrl: string; fecha: string | null }

export type DatosPdf = {
  negocio: string
  logoDataUrl: string | null
  cliente: {
    nombre: string
    whatsapp?: string | null
    fecha_nacimiento?: string | null
  }
  rubro: RubroId
  datos: Record<string, any>
  firmaCliente: FirmaPdf | null
  firmaProfesional: FirmaPdf | null
  hash: string | null
  consentimiento: string
}

// Tamaño real de una imagen (para que la firma no se deforme)
function medidas(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () =>
      resolve({ w: img.naturalWidth || 3, h: img.naturalHeight || 1 })
    img.onerror = () => resolve({ w: 3, h: 1 })
    img.src = dataUrl
  })
}

function formatoImagen(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg'))
    return 'JPEG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'PNG'
}

function fechaHora(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function generarPdfFicha(d: DatosPdf): Promise<Blob> {
  // Se carga recién cuando se usa, para no hacer pesada la app
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const ANCHO = 210
  const ALTO = 297
  const M = 18
  const ANCHO_UTIL = ANCHO - M * 2
  const MM_POR_PT = 0.3528
  let y = M

  function espacio(alto: number) {
    if (y + alto > ALTO - M - 8) {
      doc.addPage()
      y = M
    }
  }

  function poner(
    t: string,
    tam: number,
    negrita: boolean,
    color: Color,
    x: number = M,
    ancho: number = ANCHO_UTIL
  ) {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    doc.setFontSize(tam)
    doc.setTextColor(color[0], color[1], color[2])
    const lineas = doc.splitTextToSize(t, ancho) as string[]
    const alturaLinea = tam * MM_POR_PT * 1.3
    espacio(lineas.length * alturaLinea)
    lineas.forEach((l, i) => {
      doc.text(l, x, y + (i + 1) * alturaLinea - 1)
    })
    y += lineas.length * alturaLinea
  }

  function linea(color: Color = LINE) {
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.3)
    doc.line(M, y, ANCHO - M, y)
  }

  function seccion(titulo: string) {
    espacio(14)
    y += 4
    poner(titulo, 12, true, BRASS)
    y += 0.5
    linea()
    y += 2.5
  }

  function campo(etiqueta: string, valor: string) {
    espacio(12)
    poner(etiqueta, 8.5, false, MUTED)
    poner(valor && valor.trim() ? valor : '-', 11, false, INK)
    y += 1.8
  }

  // ---------- Encabezado ----------
  let xTitulo = M
  if (d.logoDataUrl) {
    try {
      const { w, h } = await medidas(d.logoDataUrl)
      const esc = Math.min(16 / w, 16 / h)
      doc.addImage(
        d.logoDataUrl,
        formatoImagen(d.logoDataUrl),
        M,
        y,
        w * esc,
        h * esc
      )
      xTitulo = M + 20
    } catch {
      xTitulo = M
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(INK[0], INK[1], INK[2])
  doc.text(d.negocio || 'Ficha técnica', xTitulo, y + 8)
  doc.setFontSize(11)
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
  doc.text('Ficha técnica', xTitulo, y + 14.5)
  const anchoFicha = doc.getTextWidth('Ficha técnica ')
  doc.setTextColor(BRASS[0], BRASS[1], BRASS[2])
  doc.text(`· ${nombreDelRubro(d.rubro)}`, xTitulo + anchoFicha, y + 14.5)
  y += 21
  doc.setDrawColor(BRASS[0], BRASS[1], BRASS[2])
  doc.setLineWidth(0.9)
  doc.line(M, y, ANCHO - M, y)
  y += 2
  poner(
    `Generada el ${new Date().toLocaleDateString('es-AR')}`,
    8.5,
    false,
    MUTED
  )

  // ---------- Campos de la ficha ----------
  for (const c of camposDeFicha(d.rubro)) {
    switch (c.tipo) {
      case 'titulo':
        seccion(c.etiqueta)
        break

      case 'clienteDato': {
        let v: string = d.cliente[c.campo] ?? ''
        if (c.campo === 'fecha_nacimiento' && v) {
          v = v.split('-').reverse().join('/')
        }
        campo(c.etiqueta, v)
        break
      }

      case 'edad': {
        const e = calcularEdad(d.cliente.fecha_nacimiento)
        campo(c.etiqueta, e !== null ? String(e) : '')
        break
      }

      case 'texto':
      case 'textoLargo':
      case 'select':
        campo(c.etiqueta, String(d.datos[c.clave] ?? ''))
        break

      case 'chips': {
        const v = d.datos[c.clave]
        campo(c.etiqueta, Array.isArray(v) ? v.join(', ') : '')
        break
      }

      case 'interruptor':
        campo(c.etiqueta, d.datos[c.clave] === true ? 'Sí' : 'No')
        break

      case 'procedimientos': {
        const lista: Procedimiento[] = Array.isArray(d.datos[c.clave])
          ? d.datos[c.clave]
          : []
        if (lista.length === 0) {
          campo('Procedimientos', '')
        } else {
          poner('Procedimientos', 8.5, false, MUTED)
          lista.forEach(p => {
            poner(
              `- ${p.servicio || '-'}${p.zona ? ' (zona: ' + p.zona + ')' : ''}`,
              11,
              false,
              INK
            )
          })
          y += 1.8
        }
        break
      }

      default:
        break
    }
  }

  // ---------- Consentimiento y firmas ----------
  seccion('Consentimiento y firmas')
  poner(d.consentimiento, 9.5, false, MUTED)
  y += 4
  espacio(46)

  const cajaW = 70
  const cajaH = 24
  const yBase = y
  const xs = [M, M + cajaW + 12]
  const bloques: { titulo: string; firma: FirmaPdf | null }[] = [
    { titulo: `Firma de ${d.cliente.nombre || 'el cliente'}`, firma: d.firmaCliente },
    { titulo: 'Firma de la profesional', firma: d.firmaProfesional },
  ]

  for (let i = 0; i < bloques.length; i++) {
    const { titulo, firma } = bloques[i]
    const x = xs[i]
    if (firma) {
      try {
        const { w, h } = await medidas(firma.dataUrl)
        const esc = Math.min(cajaW / w, cajaH / h)
        const iw = w * esc
        const ih = h * esc
        doc.addImage(
          firma.dataUrl,
          formatoImagen(firma.dataUrl),
          x,
          yBase + (cajaH - ih),
          iw,
          ih
        )
      } catch {
        // si la imagen falla, se deja el espacio en blanco
      }
    }
    doc.setDrawColor(INK[0], INK[1], INK[2])
    doc.setLineWidth(0.3)
    doc.line(x, yBase + cajaH + 1, x + cajaW, yBase + cajaH + 1)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(INK[0], INK[1], INK[2])
    doc.text(titulo, x, yBase + cajaH + 5.5, { maxWidth: cajaW })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
    doc.text(
      firma?.fecha ? `Firmado el ${fechaHora(firma.fecha)}` : 'Sin firmar',
      x,
      yBase + cajaH + 10
    )
  }
  y = yBase + cajaH + 16

  // ---------- Huella de verificación ----------
  if (d.hash) {
    espacio(18)
    poner('Huella de verificación (SHA-256)', 8, true, MUTED)
    poner(d.hash, 7, false, MUTED)
    poner(
      'Permite comprobar que los datos de la ficha no se modificaron después de la firma.',
      7.5,
      false,
      MUTED
    )
  }

  // ---------- Pie de página ----------
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
    doc.text(`Página ${i} de ${paginas}`, ANCHO - M, ALTO - 9, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRASS[0], BRASS[1], BRASS[2])
    doc.text('Ribel Gestión', M, ALTO - 9)
  }

  return doc.output('blob')
}