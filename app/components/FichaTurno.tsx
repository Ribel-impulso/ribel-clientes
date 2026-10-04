'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import FichaTecnicaCliente from './FichaTecnicaCliente'

// Misma paleta que el resto de la app.
const INK = '#1B2420'
const PAPER = '#F4EFE4'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_BG = 'rgba(168,127,76,0.1)'
const SAGE = '#5E7A5A'
const SAGE_BG = '#EAF0E8'
const CLAY = '#A85A44'
const CLAY_BG = '#F5E9E5'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'
const FONT_SERIF = "'Source Serif 4', serif"
const FONT_SANS = "'Public Sans', sans-serif"

// Mensajes internos entre el aviso del turno y la ventana de la ficha
const EVENTO_ABRIR = 'ribel-abrir-ficha'
const EVENTO_ACTUALIZADA = 'ribel-ficha-actualizada'

type Estado = 'cargando' | 'completa' | 'incompleta' | 'falta'

// ---------------------------------------------------------------
// Aviso chico que se pone dentro de cada turno
// completa    = tiene al menos una ficha firmada por las dos partes
// incompleta  = tiene ficha, pero sin las dos firmas
// falta       = todavía no tiene ficha
// ---------------------------------------------------------------
export function FichaChip({
  userId,
  clienteId,
  origen,
}: {
  userId: string
  clienteId: string
  origen: string
}) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    if (!clienteId) return
    let activo = true

    async function cargar() {
      const { data } = await supabase
        .from('fichas_tecnicas')
        .select('firma_cliente_path, firma_profesional_path')
        .eq('cliente_id', clienteId)
        .eq('user_id', userId)
      if (!activo) return
      const filas = data || []
      if (filas.length === 0) setEstado('falta')
      else if (filas.some((f: any) => f.firma_cliente_path && f.firma_profesional_path))
        setEstado('completa')
      else setEstado('incompleta')
    }

    cargar()
    const alActualizar = () => {
      cargar()
    }
    window.addEventListener(EVENTO_ACTUALIZADA, alActualizar)
    return () => {
      activo = false
      window.removeEventListener(EVENTO_ACTUALIZADA, alActualizar)
    }
  }, [userId, clienteId])

  if (!clienteId) return null

  const estilos = {
    cargando: { texto: 'Ficha…', color: MUTED, fondo: PAPER, borde: LINE },
    completa: {
      texto: 'Ficha completa · Ver',
      color: SAGE,
      fondo: SAGE_BG,
      borde: `${SAGE}55`,
    },
    incompleta: {
      texto: 'Ficha sin firmar · Completar',
      color: BRASS,
      fondo: BRASS_BG,
      borde: BRASS,
    },
    falta: {
      texto: 'Falta completar la ficha',
      color: CLAY,
      fondo: CLAY_BG,
      borde: `${CLAY}55`,
    },
  }[estado]

  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(EVENTO_ABRIR, { detail: { clienteId, origen } })
        )
      }
      style={{
        padding: '4px 11px',
        borderRadius: '100px',
        border: `1px solid ${estilos.borde}`,
        backgroundColor: estilos.fondo,
        color: estilos.color,
        fontFamily: FONT_SANS,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {estilos.texto}
    </button>
  )
}

// ---------------------------------------------------------------
// Ventana con la ficha del cliente (se pone una sola vez por pantalla)
// ---------------------------------------------------------------
export default function FichaModalHost({
  userId,
  servicios,
  origen,
}: {
  userId: string
  servicios: any[]
  origen: string
}) {
  const [cliente, setCliente] = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function alAbrir(e: Event) {
      const d = (e as CustomEvent).detail
      if (!d || d.origen !== origen) return
      setCargando(true)
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre, whatsapp, fecha_nacimiento')
        .eq('id', d.clienteId)
        .eq('user_id', userId)
        .maybeSingle()
      setCliente(data ?? null)
      setCargando(false)
    }
    window.addEventListener(EVENTO_ABRIR, alAbrir)
    return () => window.removeEventListener(EVENTO_ABRIR, alAbrir)
  }, [userId, origen])

  function cerrar() {
    setCliente(null)
    window.dispatchEvent(new CustomEvent(EVENTO_ACTUALIZADA))
  }

  if (!cliente && !cargando) return null

  const btnPrimary: React.CSSProperties = {
    backgroundColor: INK,
    color: PAPER_2,
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: FONT_SANS,
  }
  const btnSecondary: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    background: PAPER_2,
    color: INK,
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: FONT_SANS,
    fontWeight: 600,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27,36,32,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: PAPER_2,
          borderRadius: '18px',
          border: `1px solid ${LINE}`,
          padding: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: FONT_SANS,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: INK,
              fontFamily: FONT_SERIF,
            }}
          >
            {cliente ? `Ficha de ${cliente.nombre}` : 'Ficha técnica'}
          </span>
          <button type="button" onClick={cerrar} style={btnSecondary}>
            Cerrar
          </button>
        </div>

        {cargando || !cliente ? (
          <p style={{ color: MUTED, fontSize: '13px' }}>Cargando...</p>
        ) : (
          <FichaTecnicaCliente
            key={cliente.id}
            modal
            userId={userId}
            cliente={cliente}
            servicios={servicios}
            btnPrimary={btnPrimary}
            btnSecondary={btnSecondary}
          />
        )}
      </div>
    </div>
  )
}