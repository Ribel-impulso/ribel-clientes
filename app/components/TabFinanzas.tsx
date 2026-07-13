'use client'
import { useState } from 'react'

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

const moneyStyle: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
  letterSpacing: '-0.01em'
}

interface Props {
  gastos: any[]
  gastoFecha: string
  setGastoFecha: (v: string) => void
  gastoDescripcion: string
  setGastoDescripcion: (v: string) => void
  gastoMonto: string
  setGastoMonto: (v: string) => void
  gastoTipo: string
  setGastoTipo: (v: string) => void
  gastoCategoria: string
  setGastoCategoria: (v: string) => void
  mesGastos: string
  setMesGastos: (v: string) => void
  totalIngresos: number
  totalEgresos: number
  balanceNeto: number
  agregarGasto: () => void
  eliminarGasto: (id: string) => void
  editarGasto: (id: string, datos: { fecha: string; descripcion: string; monto: number; tipo: string; categoria: string }) => void
  card: React.CSSProperties
  input: React.CSSProperties
  btnPrimary: React.CSSProperties
  th: React.CSSProperties
  td: React.CSSProperties
}

export default function TabFinanzas({
  gastos,
  gastoFecha, setGastoFecha,
  gastoDescripcion, setGastoDescripcion,
  gastoMonto, setGastoMonto,
  gastoTipo, setGastoTipo,
  gastoCategoria, setGastoCategoria,
  mesGastos, setMesGastos,
  totalIngresos, totalEgresos, balanceNeto,
  agregarGasto, eliminarGasto, editarGasto,
  card, input, btnPrimary, th, td
}: Props) {

  const [mostrarMovimientos, setMostrarMovimientos] = useState(false)
  const [mostrarAhorro, setMostrarAhorro] = useState(false)
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('')
  const [porcentajeComision, setPorcentajeComision] = useState('')

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editFecha, setEditFecha] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editTipo, setEditTipo] = useState('ingreso')
  const [editCategoria, setEditCategoria] = useState('negocio')

  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroDescripcion, setFiltroDescripcion] = useState('')
  const [filtroMonto, setFiltroMonto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  // Ingresos/egresos manuales cargados a mano (tabla gastos), por categoría.
  const ingresosNegocioManual = gastos.filter(g => g.tipo === 'ingreso' && (g.categoria === 'negocio' || !g.categoria)).reduce((sum, g) => sum + (g.monto || 0), 0)
  const egresosNegocio = gastos.filter(g => g.tipo === 'egreso' && (g.categoria === 'negocio' || !g.categoria)).reduce((sum, g) => sum + (g.monto || 0), 0)
  const ingresosPersonal = gastos.filter(g => g.tipo === 'ingreso' && g.categoria === 'personal').reduce((sum, g) => sum + (g.monto || 0), 0)
  const egresosPersonal = gastos.filter(g => g.tipo === 'egreso' && g.categoria === 'personal').reduce((sum, g) => sum + (g.monto || 0), 0)

  // totalIngresos (que viene de page.tsx) incluye ingresos manuales + turnos + cuenta corriente.
  // La diferencia con los ingresos manuales cargados a mano es lo que aportan los turnos:
  // así el desglose de "Negocio" ya refleja la recaudación real, sin depender de una
  // categoría que los turnos no tienen.
  const totalIngresosManual = gastos.filter(g => g.tipo === 'ingreso').reduce((sum, g) => sum + (g.monto || 0), 0)
  const ingresosDeTurnos = Math.max(0, totalIngresos - totalIngresosManual)
  const ingresosNegocio = ingresosNegocioManual + ingresosDeTurnos

  // Ahorro / comisión: opcional, se calcula solo sobre los ingresos de turnos.
  const pctAhorro = parseFloat(porcentajeAhorro) || 0
  const pctComision = parseFloat(porcentajeComision) || 0
  const montoAhorro = Math.round(ingresosDeTurnos * (pctAhorro / 100))
  const montoComision = Math.round(ingresosDeTurnos * (pctComision / 100))
  const netoTurnos = ingresosDeTurnos - montoAhorro - montoComision

  const gastosFiltrados = gastos.filter(g => {
    if (filtroFecha && g.fecha !== filtroFecha) return false
    if (filtroDescripcion && !g.descripcion?.toLowerCase().includes(filtroDescripcion.toLowerCase())) return false
    if (filtroMonto && String(g.monto ?? '').indexOf(filtroMonto) === -1) return false
    if (filtroTipo && g.tipo !== filtroTipo) return false
    if (filtroCategoria && (g.categoria || 'negocio') !== filtroCategoria) return false
    return true
  })

  const filtroInputStyle: React.CSSProperties = {
    padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${LINE}`,
    fontSize: '13px', fontFamily: FONT_SANS, color: INK, backgroundColor: PAPER_2
  }

  function iniciarEdicion(g: any) {
    setEditandoId(g.id)
    setEditFecha(g.fecha)
    setEditDescripcion(g.descripcion || '')
    setEditMonto(String(g.monto ?? ''))
    setEditTipo(g.tipo)
    setEditCategoria(g.categoria || 'negocio')
  }

  function guardarEdicion(id: string) {
    editarGasto(id, {
      fecha: editFecha,
      descripcion: editDescripcion,
      monto: parseFloat(editMonto) || 0,
      tipo: editTipo,
      categoria: editCategoria,
    })
    setEditandoId(null)
  }

  return (
    <>
      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Registrar Ingreso / Egreso</h2>
        <input type="date" value={gastoFecha} onChange={e => setGastoFecha(e.target.value)} style={input} />
        <input placeholder="Descripción" value={gastoDescripcion} onChange={e => setGastoDescripcion(e.target.value)} style={{ ...input, width: '220px' }} />
        <input placeholder="Monto" type="number" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} style={{ ...input, width: '100px' }} />
        <select value={gastoTipo} onChange={e => setGastoTipo(e.target.value)} style={input}>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <select value={gastoCategoria} onChange={e => setGastoCategoria(e.target.value)} style={input}>
          <option value="negocio">Negocio</option>
          <option value="personal">Personal</option>
        </select>
        <br />
        <button onClick={agregarGasto} style={btnPrimary}>Registrar</button>
      </div>

      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Resumen Ingresos y Egresos</h2>
        <input type="month" value={mesGastos} onChange={e => setMesGastos(e.target.value)} style={input} />

        {/* TOTAL GENERAL */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: SAGE_BG, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: SAGE, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ingresos</p>
            <p style={{ margin: 0, fontSize: '22px', color: INK, ...moneyStyle }}>${totalIngresos}</p>
          </div>
          <div style={{ backgroundColor: CLAY_BG, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: CLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Egresos</p>
            <p style={{ margin: 0, fontSize: '22px', color: INK, ...moneyStyle }}>${totalEgresos}</p>
          </div>
          <div style={{ backgroundColor: INK, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: '#C9A876', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Balance total</p>
            <p style={{ margin: 0, fontSize: '22px', color: PAPER_2, ...moneyStyle }}>${balanceNeto}</p>
          </div>
        </div>

        {/* POR CATEGORÍA */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '220px' }}>
            <p style={{ margin: 0, color: INK, fontWeight: 700, fontFamily: FONT_SANS, fontSize: '14px' }}>Negocio</p>
            <p style={{ margin: '6px 0 0', color: MUTED, fontSize: '13px' }}>Ingresos: <span style={{ color: INK, ...moneyStyle }}>${ingresosNegocio}</span></p>
            <p style={{ margin: '2px 0 0', color: MUTED, fontSize: '13px' }}>Egresos: <span style={{ color: INK, ...moneyStyle }}>${egresosNegocio}</span></p>
            <p style={{ margin: '4px 0 0', color: ingresosNegocio - egresosNegocio >= 0 ? SAGE : CLAY, ...moneyStyle, fontSize: '14px' }}>
              Balance: ${ingresosNegocio - egresosNegocio}
            </p>

            <button
              onClick={() => setMostrarAhorro(!mostrarAhorro)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRASS, fontSize: '12px', fontWeight: 700, padding: 0, marginTop: '10px', fontFamily: FONT_SANS }}
            >
              {mostrarAhorro ? '− Ocultar cálculo de ahorro / comisión' : '+ Calcular ahorro / comisión (opcional)'}
            </button>

            {mostrarAhorro && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${LINE}` }}>
                <p style={{ fontSize: '11.5px', color: MUTED, margin: '0 0 8px' }}>
                  Se calcula solo sobre los ${ingresosDeTurnos} recaudados por turnos este mes.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '3px' }}>% Ahorro</label>
                    <input type="number" min={0} max={100} placeholder="0" value={porcentajeAhorro} onChange={e => setPorcentajeAhorro(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: `1.5px solid ${LINE}`, fontSize: '13px', fontFamily: FONT_SANS, color: INK, backgroundColor: PAPER_2, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '3px' }}>% Comisión</label>
                    <input type="number" min={0} max={100} placeholder="0" value={porcentajeComision} onChange={e => setPorcentajeComision(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: `1.5px solid ${LINE}`, fontSize: '13px', fontFamily: FONT_SANS, color: INK, backgroundColor: PAPER_2, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {(pctAhorro > 0 || pctComision > 0) && (
                  <div style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.7 }}>
                    {pctAhorro > 0 && <div>Ahorro ({pctAhorro}%): <span style={{ color: INK, fontWeight: 700 }}>${montoAhorro}</span></div>}
                    {pctComision > 0 && <div>Comisión ({pctComision}%): <span style={{ color: INK, fontWeight: 700 }}>${montoComision}</span></div>}
                    <div style={{ marginTop: '2px' }}>Neto disponible de turnos: <span style={{ color: SAGE, fontWeight: 700 }}>${netoTurnos}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '220px' }}>
            <p style={{ margin: 0, color: INK, fontWeight: 700, fontFamily: FONT_SANS, fontSize: '14px' }}>Personal</p>
            <p style={{ margin: '6px 0 0', color: MUTED, fontSize: '13px' }}>Ingresos: <span style={{ color: INK, ...moneyStyle }}>${ingresosPersonal}</span></p>
            <p style={{ margin: '2px 0 0', color: MUTED, fontSize: '13px' }}>Egresos: <span style={{ color: INK, ...moneyStyle }}>${egresosPersonal}</span></p>
            <p style={{ margin: '4px 0 0', color: ingresosPersonal - egresosPersonal >= 0 ? SAGE : CLAY, ...moneyStyle, fontSize: '14px' }}>
              Balance: ${ingresosPersonal - egresosPersonal}
            </p>
          </div>
        </div>

        {/* DETALLE DE MOVIMIENTOS MANUALES */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setMostrarMovimientos(!mostrarMovimientos)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: BRASS, fontWeight: 700, padding: 0, fontFamily: FONT_SANS }}
          >
            {mostrarMovimientos ? '▲ Ocultar movimientos' : '▼ Ver movimientos'}
          </button>

          {mostrarMovimientos && (
            <>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '10px' }}>
                <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={filtroInputStyle} />
                <input placeholder="Buscar descripción..." value={filtroDescripcion} onChange={e => setFiltroDescripcion(e.target.value)} style={{ ...filtroInputStyle, width: '160px' }} />
                <input placeholder="Monto" value={filtroMonto} onChange={e => setFiltroMonto(e.target.value)} style={{ ...filtroInputStyle, width: '90px' }} />
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={filtroInputStyle}>
                  <option value="">Todos los tipos</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={filtroInputStyle}>
                  <option value="">Todas las categorías</option>
                  <option value="negocio">Negocio</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Fecha</th>
                    <th style={th}>Descripción</th>
                    <th style={th}>Monto</th>
                    <th style={th}>Tipo</th>
                    <th style={th}>Categoría</th>
                    <th style={th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosFiltrados.map(g => (
                    editandoId === g.id ? (
                      <tr key={g.id} style={{ backgroundColor: '#FBF7EE' }}>
                        <td style={td}><input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={{ ...filtroInputStyle, width: '100%' }} /></td>
                        <td style={td}><input value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} style={{ ...filtroInputStyle, width: '100%' }} /></td>
                        <td style={td}><input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} style={{ ...filtroInputStyle, width: '90px' }} /></td>
                        <td style={td}>
                          <select value={editTipo} onChange={e => setEditTipo(e.target.value)} style={filtroInputStyle}>
                            <option value="ingreso">Ingreso</option>
                            <option value="egreso">Egreso</option>
                          </select>
                        </td>
                        <td style={td}>
                          <select value={editCategoria} onChange={e => setEditCategoria(e.target.value)} style={filtroInputStyle}>
                            <option value="negocio">Negocio</option>
                            <option value="personal">Personal</option>
                          </select>
                        </td>
                        <td style={td}>
                          <button onClick={() => guardarEdicion(g.id)} style={{ ...btnPrimary, padding: '6px 12px', fontSize: '13px', marginRight: '6px' }}>Guardar</button>
                          <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: `1px solid ${LINE}`, borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: INK, fontFamily: FONT_SANS }}>Cancelar</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={g.id} style={{ backgroundColor: PAPER_2 }}>
                        <td style={td}>{g.fecha}</td>
                        <td style={td}>{g.descripcion}</td>
                        <td style={{ ...td, ...moneyStyle }}>${g.monto}</td>
                        <td style={td}>
                          <span style={{ color: g.tipo === 'ingreso' ? SAGE : CLAY, fontWeight: 700, fontSize: '13px' }}>
                            {g.tipo === 'ingreso' ? '▲ Ingreso' : '▼ Egreso'}
                          </span>
                        </td>
                        <td style={td}>
                          <span style={{ backgroundColor: g.categoria === 'personal' ? BRASS_BG : SAGE_BG, color: g.categoria === 'personal' ? BRASS : SAGE, padding: '2px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 700 }}>
                            {g.categoria || 'negocio'}
                          </span>
                        </td>
                        <td style={td}>
                          <button onClick={() => iniciarEdicion(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: INK, fontWeight: 600, fontSize: '13px', marginRight: '10px', fontFamily: FONT_SANS }}>Editar</button>
                          <button onClick={() => eliminarGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CLAY, fontWeight: 600, fontSize: '13px', fontFamily: FONT_SANS }}>Eliminar</button>
                        </td>
                      </tr>
                    )
                  ))}
                  {gastosFiltrados.length === 0 && (
                    <tr>
                      <td style={{ ...td, textAlign: 'center', color: MUTED }} colSpan={6}>No hay movimientos que coincidan con el filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  )
}