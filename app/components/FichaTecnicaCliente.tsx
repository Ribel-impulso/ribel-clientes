'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  RubroId,
  CampoFicha,
  Procedimiento,
  camposDeFicha,
  calcularEdad,
  esRubroValido,
  nombreDelRubro,
} from './fichasConfig'
import FirmasFicha from './FirmasFicha'

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

type Datos = Record<string, any>

// Datos que se reutilizan entre rubros (se escriben una sola vez)
const CLAVES_GENERALES = ['alergias', 'condiciones', 'medicacion', 'domicilio', 'sexo']

const procVacio = (): Procedimiento => ({ servicio: '', zona: '' })

const estiloInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 13px',
  borderRadius: '10px',
  border: `1.5px solid ${LINE}`,
  fontFamily: FONT_SANS,
  fontSize: '14px',
  color: INK,
  backgroundColor: PAPER_2,
}
const estiloSoloLectura: React.CSSProperties = {
  ...estiloInput,
  backgroundColor: PAPER,
  color: MUTED,
}
const estiloEtiqueta: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: MUTED,
  marginBottom: '4px',
  fontFamily: FONT_SANS,
}

export default function FichaTecnicaCliente({
  userId,
  cliente,
  servicios,
  btnPrimary,
  btnSecondary,
  modal = false,
}: {
  userId: string
  cliente: any
  servicios: any[]
  btnPrimary: React.CSSProperties
  btnSecondary: React.CSSProperties
  modal?: boolean
}) {
  const [abierta, setAbierta] = useState(modal)
  const [cargando, setCargando] = useState(false)
  const [rubros, setRubros] = useState<RubroId[]>([])
  const [rubroActivo, setRubroActivo] = useState<RubroId | null>(null)
  const [datos, setDatos] = useState<Record<string, Datos>>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [dropdown, setDropdown] = useState<number | null>(null)
  const [version, setVersion] = useState(0)
  const [fechaNac, setFechaNac] = useState<string>(cliente.fecha_nacimiento || '')
  const [fechaGuardada, setFechaGuardada] = useState<string>(cliente.fecha_nacimiento || '')

  // En modo ventana (modal) la ficha se abre sola
  useEffect(() => {
    if (modal) cargar()
  }, [])

  async function alternar() {
    if (abierta) {
      setAbierta(false)
      return
    }
    setAbierta(true)
    await cargar()
  }

  async function cargar() {
    setCargando(true)
    setError('')
    const [conf, fichas] = await Promise.all([
      supabase
        .from('configuracion_negocio')
        .select('rubros')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('fichas_tecnicas')
        .select('rubro, datos')
        .eq('cliente_id', cliente.id)
        .eq('user_id', userId),
    ])

    const guardados: string[] = Array.isArray(conf.data?.rubros)
      ? conf.data.rubros
      : []
    const lista = guardados.filter(esRubroValido)

    const porRubro: Record<string, Datos> = {}
    ;(fichas.data || []).forEach((f: any) => {
      porRubro[f.rubro] = f.datos || {}
    })

    // Alergias, condiciones y medicación se toman de cualquier ficha que ya los tenga
    const generales: Datos = {}
    CLAVES_GENERALES.forEach(k => {
      for (const r of Object.keys(porRubro)) {
        const v = porRubro[r][k]
        if (v !== undefined && v !== '') {
          generales[k] = v
          break
        }
      }
    })

    const armado: Record<string, Datos> = {}
    lista.forEach(r => {
      const d: Datos = { ...(porRubro[r] || {}) }
      CLAVES_GENERALES.forEach(k => {
        if ((d[k] === undefined || d[k] === '') && generales[k] !== undefined) {
          d[k] = generales[k]
        }
      })
      armado[r] = d
    })

    setRubros(lista)
    setDatos(armado)
    setRubroActivo(prev => (prev && lista.includes(prev) ? prev : lista[0] ?? null))
    setCargando(false)
  }

  function poner(clave: string, valor: any) {
    if (!rubroActivo) return
    setMensaje('')
    setError('')
    setDatos(prev => ({
      ...prev,
      [rubroActivo]: { ...(prev[rubroActivo] || {}), [clave]: valor },
    }))
  }

  async function guardar() {
    if (!rubroActivo) return
    setGuardando(true)
    setMensaje('')
    setError('')

    const limpio: Datos = { ...(datos[rubroActivo] || {}) }
    camposDeFicha(rubroActivo).forEach(c => {
      if (c.tipo === 'procedimientos' && Array.isArray(limpio[c.clave])) {
        limpio[c.clave] = limpio[c.clave].filter(
          (p: Procedimiento) => p.servicio.trim() || p.zona.trim()
        )
      }
    })

    if (fechaNac !== fechaGuardada) {
      const { error: errorFecha } = await supabase
        .from('clientes')
        .update({ fecha_nacimiento: fechaNac || null })
        .eq('id', cliente.id)
        .eq('user_id', userId)
      if (errorFecha) {
        setGuardando(false)
        setError('No se pudo guardar la fecha de nacimiento: ' + errorFecha.message)
        return
      }
      setFechaGuardada(fechaNac)
    }

    const { error: errorGuardar } = await supabase
      .from('fichas_tecnicas')
      .upsert(
        {
          user_id: userId,
          cliente_id: cliente.id,
          rubro: rubroActivo,
          datos: limpio,
        },
        { onConflict: 'cliente_id,rubro' }
      )

    setGuardando(false)
    if (errorGuardar) {
      setError('No se pudo guardar: ' + errorGuardar.message)
      return
    }
    setMensaje('¡Ficha guardada!')
    setVersion(v => v + 1)
    setTimeout(() => setMensaje(''), 3000)
  }

  const nombresServicios = Array.from(
    new Set(servicios.map((s: any) => s.nombre).filter(Boolean))
  ) as string[]

  function renderCampo(c: CampoFicha, i: number, d: Datos) {
    switch (c.tipo) {
      case 'titulo':
        return (
          <div
            key={i}
            style={{
              margin: '18px 0 10px',
              paddingTop: i === 0 ? 0 : '14px',
              borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: '14px',
                color: INK,
                fontFamily: FONT_SANS,
              }}
            >
              {c.etiqueta}
            </p>
            {c.ayuda && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: MUTED }}>
                {c.ayuda}
              </p>
            )}
          </div>
        )

      case 'clienteDato': {
        if (c.campo === 'fecha_nacimiento') {
          return (
            <div key={i} style={{ marginBottom: '12px' }}>
              <label style={estiloEtiqueta}>{c.etiqueta}</label>
              <input
                type="date"
                value={fechaNac}
                onChange={e => {
                  setFechaNac(e.target.value)
                  setMensaje('')
                  setError('')
                }}
                style={estiloInput}
              />
            </div>
          )
        }
        const valor: string = cliente[c.campo] || ''
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <input
              value={valor || '—'}
              readOnly
              style={estiloSoloLectura}
            />
          </div>
        )
      }

      case 'edad': {
        const edad = calcularEdad(fechaNac)
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <input
              value={edad !== null ? String(edad) : '—'}
              readOnly
              style={estiloSoloLectura}
            />
          </div>
        )
      }

      case 'texto':
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <input
              value={d[c.clave] ?? ''}
              placeholder={c.placeholder}
              onChange={e => poner(c.clave, e.target.value)}
              style={estiloInput}
            />
          </div>
        )

      case 'textoLargo':
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <textarea
              value={d[c.clave] ?? ''}
              placeholder={c.placeholder}
              onChange={e => poner(c.clave, e.target.value)}
              style={{ ...estiloInput, height: '70px', resize: 'vertical' }}
            />
          </div>
        )

      case 'select':
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <select
              value={d[c.clave] ?? ''}
              onChange={e => poner(c.clave, e.target.value)}
              style={estiloInput}
            >
              <option value="">Elegir…</option>
              {c.opciones.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )

      case 'chips': {
        const marcados: string[] = Array.isArray(d[c.clave]) ? d[c.clave] : []
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <label style={estiloEtiqueta}>{c.etiqueta}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {c.opciones.map(o => {
                const activo = marcados.includes(o)
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      poner(
                        c.clave,
                        activo ? marcados.filter(m => m !== o) : [...marcados, o]
                      )
                    }
                    style={{
                      padding: '6px 13px',
                      borderRadius: '100px',
                      border: activo ? `1px solid ${BRASS}` : `1px solid ${LINE}`,
                      backgroundColor: activo ? BRASS_BG : PAPER_2,
                      color: activo ? BRASS : MUTED,
                      fontFamily: FONT_SANS,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {o}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      case 'interruptor': {
        const activo = d[c.clave] === true
        return (
          <div
            key={i}
            style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '14px', color: INK, fontFamily: FONT_SANS }}>
              {c.etiqueta}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              aria-label={c.etiqueta}
              onClick={() => poner(c.clave, !activo)}
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                border: 'none',
                padding: 0,
                backgroundColor: activo ? BRASS : LINE,
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                transition: 'background-color 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: activo ? '18px' : '3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: PAPER_2,
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        )
      }

      case 'procedimientos': {
        const filas: Procedimiento[] =
          Array.isArray(d[c.clave]) && d[c.clave].length > 0
            ? d[c.clave]
            : [procVacio()]
        const cambiar = (idx: number, cambio: Partial<Procedimiento>) =>
          poner(
            c.clave,
            filas.map((f, j) => (j === idx ? { ...f, ...cambio } : f))
          )
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            {filas.map((f, idx) => {
              const q = f.servicio.trim().toLowerCase()
              const coincidencias = nombresServicios.filter(n =>
                n.toLowerCase().includes(q)
              )
              const mostrarNuevo =
                q !== '' && !nombresServicios.some(n => n.toLowerCase() === q)
              return (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${LINE}`,
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <label style={estiloEtiqueta}>Servicio</label>
                    <input
                      value={f.servicio}
                      placeholder="Escribí para buscar o agregar"
                      autoComplete="off"
                      onFocus={() => setDropdown(idx)}
                      onBlur={() => setTimeout(() => setDropdown(null), 150)}
                      onChange={e => {
                        setDropdown(idx)
                        cambiar(idx, { servicio: e.target.value })
                      }}
                      style={estiloInput}
                    />
                    {dropdown === idx &&
                      (coincidencias.length > 0 || mostrarNuevo) && (
                        <ul
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '100%',
                            zIndex: 5,
                            margin: '2px 0 0',
                            padding: '4px',
                            listStyle: 'none',
                            backgroundColor: PAPER_2,
                            border: `1px solid ${LINE}`,
                            borderRadius: '8px',
                            maxHeight: '168px',
                            overflowY: 'auto',
                            boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                          }}
                        >
                          {coincidencias.map(n => (
                            <li
                              key={n}
                              onClick={() => {
                                cambiar(idx, { servicio: n })
                                setDropdown(null)
                              }}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: INK,
                                fontFamily: FONT_SANS,
                              }}
                            >
                              {n}
                            </li>
                          ))}
                          {mostrarNuevo && (
                            <li
                              onClick={() => {
                                cambiar(idx, { servicio: f.servicio.trim() })
                                setDropdown(null)
                              }}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: BRASS,
                                fontWeight: 600,
                                fontFamily: FONT_SANS,
                              }}
                            >
                              Usar “{f.servicio.trim()}” como nuevo
                            </li>
                          )}
                        </ul>
                      )}
                  </div>
                  <label style={estiloEtiqueta}>Zona</label>
                  <input
                    value={f.zona}
                    onChange={e => cambiar(idx, { zona: e.target.value })}
                    style={estiloInput}
                  />
                  {filas.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        poner(
                          c.clave,
                          filas.filter((_, j) => j !== idx)
                        )
                      }
                      style={{
                        marginTop: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: CLAY,
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: FONT_SANS,
                        padding: 0,
                      }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              onClick={() => poner(c.clave, [...filas, procVacio()])}
              style={{
                fontSize: '12px',
                color: BRASS,
                background: 'none',
                border: `1px dashed ${BRASS}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: FONT_SANS,
                fontWeight: 600,
              }}
            >
              + Agregar procedimiento
            </button>
          </div>
        )
      }

      default:
        return null
    }
  }

  const datosActuales: Datos = rubroActivo ? datos[rubroActivo] || {} : {}

  return (
    <div
      style={
        modal
          ? {}
          : {
              marginBottom: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${LINE}`,
            }
      }
    >
      {!modal && (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            color: INK,
            fontWeight: 700,
            margin: 0,
            fontSize: '14px',
            fontFamily: FONT_SANS,
          }}
        >
          Ficha técnica
        </p>
        <button
          type="button"
          onClick={alternar}
          style={{ ...btnSecondary, marginLeft: 0, fontSize: '13px', padding: '6px 14px' }}
        >
          {abierta ? 'Cerrar ficha' : 'Ver ficha'}
        </button>
      </div>
      )}

      {abierta && (
        <div style={{ marginTop: modal ? 0 : '14px' }}>
          {cargando ? (
            <p style={{ color: MUTED, fontSize: '13px' }}>Cargando...</p>
          ) : rubros.length === 0 ? (
            <p style={{ color: MUTED, fontSize: '13px' }}>
              Todavía no elegiste tus rubros. Andá a Cuenta → Mis rubros para
              elegirlos y se arma la ficha.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '14px',
                }}
              >
                {rubros.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRubroActivo(r)
                      setMensaje('')
                      setError('')
                    }}
                    style={{
                      padding: '7px 15px',
                      borderRadius: '100px',
                      border: r === rubroActivo ? `1px solid ${INK}` : `1px solid ${LINE}`,
                      backgroundColor: r === rubroActivo ? INK : PAPER_2,
                      color: r === rubroActivo ? PAPER_2 : MUTED,
                      fontFamily: FONT_SANS,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {nombreDelRubro(r)}
                  </button>
                ))}
              </div>

              {rubroActivo &&
                camposDeFicha(rubroActivo).map((c, i) =>
                  renderCampo(c, i, datosActuales)
                )}

              {error && (
                <p style={{ color: CLAY, fontSize: '13px', fontWeight: 600 }}>
                  {error}
                </p>
              )}
              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}
                >
                  {guardando ? 'Guardando...' : 'Guardar ficha'}
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
              {rubroActivo && (
                <FirmasFicha
                  key={rubroActivo}
                  userId={userId}
                  clienteId={cliente.id}
                  nombreCliente={cliente.nombre}
                  rubro={rubroActivo}
                  version={version}
                  btnPrimary={btnPrimary}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}