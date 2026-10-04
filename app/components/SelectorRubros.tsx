'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { RUBROS, RubroId, esRubroValido } from './fichasConfig'

// Misma paleta que el resto de la app.
const INK = '#1B2420'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
const BRASS_BG = 'rgba(168,127,76,0.1)'
const SAGE = '#5E7A5A'
const CLAY = '#A85A44'
const LINE = '#DDD3BF'
const MUTED = '#726B5C'
const FONT_SERIF = "'Source Serif 4', serif"
const FONT_SANS = "'Public Sans', sans-serif"

export default function SelectorRubros({
  userId,
  card,
  btnPrimary,
}: {
  userId: string
  card: React.CSSProperties
  btnPrimary: React.CSSProperties
}) {
  const [rubros, setRubros] = useState<RubroId[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [userId])

  async function cargar() {
    const { data } = await supabase
      .from('configuracion_negocio')
      .select('rubros')
      .eq('user_id', userId)
      .maybeSingle()
    const guardados: string[] = Array.isArray(data?.rubros) ? data.rubros : []
    setRubros(guardados.filter(esRubroValido))
    setCargando(false)
  }

  function alternar(id: RubroId) {
    setMensaje('')
    setError('')
    setRubros(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  async function guardar() {
    setGuardando(true)
    setMensaje('')
    setError('')
    // Se guardan siempre en el mismo orden de la lista
    const ordenados = RUBROS.map(r => r.id).filter(id => rubros.includes(id))
    const { error: errorGuardar } = await supabase
      .from('configuracion_negocio')
      .upsert(
        {
          user_id: userId,
          rubros: ordenados,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    setGuardando(false)
    if (errorGuardar) {
      setError('No se pudo guardar: ' + errorGuardar.message)
      return
    }
    setMensaje('¡Rubros guardados!')
    setTimeout(() => setMensaje(''), 3000)
  }

  const chip = (activo: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '100px',
    border: activo ? `1px solid ${BRASS}` : `1px solid ${LINE}`,
    backgroundColor: activo ? BRASS_BG : PAPER_2,
    color: activo ? BRASS : MUTED,
    fontFamily: FONT_SANS,
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={card}>
      <h2
        style={{
          color: INK,
          marginTop: 0,
          fontFamily: FONT_SERIF,
          fontWeight: 600,
          fontSize: '19px',
        }}
      >
        Mis rubros
      </h2>
      <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }}>
        Elegí a qué te dedicás (uno o más). Con esto se arma la ficha técnica de
        tus clientes.
      </p>

      {cargando ? (
        <p style={{ color: MUTED, fontSize: '13px' }}>Cargando...</p>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {RUBROS.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => alternar(r.id)}
              aria-pressed={rubros.includes(r.id)}
              style={chip(rubros.includes(r.id))}
            >
              {r.nombre}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: CLAY, fontSize: '13px', fontWeight: 600 }}>{error}</p>
      )}

      <button
        onClick={guardar}
        disabled={guardando || cargando}
        style={{ ...btnPrimary, opacity: guardando || cargando ? 0.7 : 1 }}
      >
        {guardando ? 'Guardando...' : 'Guardar rubros'}
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
    </div>
  )
}