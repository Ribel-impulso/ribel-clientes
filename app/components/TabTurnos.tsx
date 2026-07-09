'use client'
import { useState } from 'react'

// Misma paleta que el resto de la app (ver page.tsx / login).
// Cuando tengas un archivo de tema centralizado, esto se importa de ahí.
const INK = '#1B2420'
const PAPER_2 = '#FFFDF8'
const BRASS = '#A87F4C'
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
  clientes: any[]
  sesiones: any[]
  servicios: any[]
  busquedaCliente: string
  setBusquedaCliente: (v: string) => void
  clienteSeleccionado: string
  setClienteSeleccionado: (v: string) => void
  busquedaServicio: string
  setBusquedaServicio: (v: string) => void
  servicioSeleccionado: string
  setServicioSeleccionado: (v: string) => void
  fecha: string
  setFecha: (v: string) => void
  monto: string
  setMonto: (v: string) => void
  horario: string
  setHorario: (v: string) => void
  monto2: string
  setMonto2: (v: string) => void
  formaPago2: string
  setFormaPago2: (v: string) => void
  formaPago: string
  setFormaPago: (v: string) => void
  montoSenia: string
  setMontoSenia: (v: string) => void
  fechaSenia: string
  setFechaSenia: (v: string) => void
  mesSeleccionado: string
  setMesSeleccionado: (v: string) => void
  totalEfectivo: number
  totalTransferencia: number
  totalMes: number
  totalCuentaCorriente: number
  rankingServicios: [string, number][]
  editandoId: string | null
  setEditandoId: (v: string | null) => void
  editFecha: string
  setEditFecha: (v: string) => void
  editServicio: string
  setEditServicio: (v: string) => void
  editMonto: string
  setEditMonto: (v: string) => void
  editFormaPago: string
  setEditFormaPago: (v: string) => void
  clienteHistorial: string
  setClienteHistorial: (v: string) => void
  historial: any[]
  agregarSesion: () => void
  eliminarSesion: (id: string) => void
  toggleFacturado: (id: string, valor: boolean) => void
  cobrarSesion: (id: string, formaPago: string) => void
  iniciarEdicion: (s: any) => void
  guardarEdicion: (id: string) => void
  cargarHistorial: (clienteId: string) => void
  card: React.CSSProperties
  input: React.CSSProperties
  btnPrimary: React.CSSProperties
  btnSecondary: React.CSSProperties
  th: React.CSSProperties
  td: React.CSSProperties
}

export default function TabTurnos({
  clientes, sesiones, servicios,
  busquedaCliente, setBusquedaCliente,
  clienteSeleccionado, setClienteSeleccionado,
  busquedaServicio, setBusquedaServicio,
  servicioSeleccionado, setServicioSeleccionado,
  fecha, setFecha, monto, setMonto,
  horario, setHorario,
  monto2, setMonto2,
  formaPago2, setFormaPago2,
  formaPago, setFormaPago,
  montoSenia, setMontoSenia,
  fechaSenia, setFechaSenia,
  mesSeleccionado, setMesSeleccionado,
  totalEfectivo, totalTransferencia, totalMes, totalCuentaCorriente,
  rankingServicios,
  editandoId, setEditandoId,
  editFecha, setEditFecha,
  editServicio, setEditServicio,
  editMonto, setEditMonto,
  editFormaPago, setEditFormaPago,
  clienteHistorial, setClienteHistorial, historial,
  agregarSesion, eliminarSesion, toggleFacturado, cobrarSesion,
  iniciarEdicion, guardarEdicion, cargarHistorial,
  card, input, btnPrimary, btnSecondary, th, td
}: Props) {

  const [mostrarTurnos, setMostrarTurnos] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [notaAbiertaId, setNotaAbiertaId] = useState<string | null>(null)
  const [notaAbiertaHistorialId, setNotaAbiertaHistorialId] = useState<string | null>(null)

  const toggleLinkStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', color: BRASS, fontWeight: 700,
    marginBottom: '8px', padding: 0, fontFamily: FONT_SANS
  }

  const rowActionStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: FONT_SANS, fontWeight: 600, fontSize: '13px'
  }

  const NoteIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BRASS} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
      <path d="M9 8h6M9 12h4" />
    </svg>
  )

  return (
    <>
      {/* 1. RESUMEN DEL MES */}
      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Resumen del mes</h2>
        <input type="month" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} style={input} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: SAGE_BG, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: SAGE, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Efectivo</p>
            <p style={{ margin: 0, fontSize: '22px', color: INK, ...moneyStyle }}>${totalEfectivo}</p>
          </div>
          <div style={{ backgroundColor: SAGE_BG, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: SAGE, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Transferencia</p>
            <p style={{ margin: 0, fontSize: '22px', color: INK, ...moneyStyle }}>${totalTransferencia}</p>
          </div>
          <div style={{ backgroundColor: INK, borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', color: '#C9A876', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total</p>
            <p style={{ margin: 0, fontSize: '22px', color: PAPER_2, ...moneyStyle }}>${totalMes}</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#F4EFE4', border: `1px solid ${LINE}`, borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
          <p style={{ margin: '0 0 4px', color: MUTED, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cuenta corriente</p>
          <p style={{ margin: 0, fontSize: '22px', color: INK, ...moneyStyle }}>${totalCuentaCorriente}</p>
        </div>
      </div>

      {/* 2. TURNOS DEL MES */}
      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Turnos de {mesSeleccionado}</h2>
        <button onClick={() => setMostrarTurnos(!mostrarTurnos)} style={toggleLinkStyle}>
          {mostrarTurnos ? '▲ Ocultar turnos' : '▼ Ver turnos'}
        </button>
        {mostrarTurnos && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Cliente</th>
                <th style={th}>Fecha</th>
                <th style={th}>Servicio</th>
                <th style={th}>Monto</th>
                <th style={th}>Pago</th>
                <th style={th}>Seña</th>
                <th style={th}>Nota</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.filter(s => s.fecha?.startsWith(mesSeleccionado)).map(s => (
                editandoId === s.id ? (
                  <tr key={s.id} style={{ backgroundColor: '#FBF7EE' }}>
                    <td style={td}>{s.clientes?.nombre}</td>
                    <td style={td}><input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                    <td style={td}><input value={editServicio} onChange={e => setEditServicio(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                    <td style={td}><input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} style={{ ...input, marginBottom: 0, width: '80px' }} /></td>
                    <td style={td}>
                      <select value={editFormaPago} onChange={e => setEditFormaPago(e.target.value)} style={{ ...input, marginBottom: 0 }}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="obra_social">Obra Social</option>
                        <option value="cuenta_corriente">Cuenta corriente</option>
                      </select>
                    </td>
                    <td style={td}>-</td>
                    <td style={td}>-</td>
                    <td style={td}>
                      <button onClick={() => guardarEdicion(s.id)} style={{ ...btnPrimary, padding: '6px 12px', marginRight: '6px' }}>Guardar</button>
                      <button onClick={() => setEditandoId(null)} style={{ ...btnSecondary, marginLeft: 0 }}>Cancelar</button>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr key={s.id} style={{ backgroundColor: PAPER_2 }}>
                      <td style={td}>{s.clientes?.nombre}</td>
                      <td style={td}>{s.fecha}</td>
                      <td style={td}>{s.tipo_masaje}</td>
                      <td style={{ ...td, ...moneyStyle }}>
                        ${s.monto}
                        {s.monto2 ? ` + $${s.monto2}` : ''}
                      </td>
                      <td style={td}>
                        {s.forma_pago}
                        {s.forma_pago2 ? ` + ${s.forma_pago2}` : ''}
                      </td>
                      <td style={td}>
                        {s.monto_senia ? (
                          <span style={{ fontSize: '13px', color: BRASS, ...moneyStyle, fontWeight: 600 }}>
                            ${s.monto_senia}
                            {s.fecha_senia ? ` · ${s.fecha_senia}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: MUTED, fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={td}>
                        {s.notas_clinicas ? (
                          <button
                            onClick={() => setNotaAbiertaId(notaAbiertaId === s.id ? null : s.id)}
                            title="Ver nota"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <NoteIcon />
                          </button>
                        ) : (
                          <span style={{ color: MUTED, fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={td}>
                        <button onClick={() => iniciarEdicion(s)} style={{ ...rowActionStyle, color: INK, marginRight: '10px' }}>Editar</button>
                        <button onClick={() => eliminarSesion(s.id)} style={{ ...rowActionStyle, color: CLAY }}>Eliminar</button>
                      </td>
                    </tr>
                    {notaAbiertaId === s.id && s.notas_clinicas && (
                      <tr key={`${s.id}-nota`} style={{ backgroundColor: '#FBF7EE' }}>
                        <td style={{ ...td, fontStyle: 'italic', color: INK }} colSpan={8}>
                          {s.notas_clinicas}
                        </td>
                      </tr>
                    )}
                  </>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. HISTORIAL POR CLIENTE */}
      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Historial por cliente</h2>
        <input
          placeholder="Buscar cliente..."
          value={clienteHistorial}
          onChange={e => { setClienteHistorial(e.target.value) }}
          style={input}
        />
        {clienteHistorial && (
          <ul style={{ border: `1px solid ${LINE}`, borderRadius: '10px', padding: '8px', listStyle: 'none', margin: 0, marginBottom: '12px', backgroundColor: PAPER_2 }}>
            {clientes
              .filter(c => c.nombre.toLowerCase().includes(clienteHistorial.toLowerCase()))
              .map(c => (
                <li key={c.id}
                  onClick={() => { setClienteHistorial(c.nombre); cargarHistorial(c.id) }}
                  style={{ padding: '8px', cursor: 'pointer', color: INK, fontFamily: FONT_SANS, fontSize: '14px' }}>
                  {c.nombre}
                </li>
              ))}
          </ul>
        )}
        {historial.length > 0 && (
          <>
            <p style={{ color: INK, marginTop: '12px', fontSize: '14px' }}>
              <strong>Total de turnos:</strong> {historial.length} &nbsp;|&nbsp;
              <strong>Total facturado:</strong>{' '}
              <span style={moneyStyle}>${historial.filter(s => new Date(`${s.fecha}T${s.horario || '23:59'}`) <= new Date()).reduce((sum, s) => sum + (s.monto || 0), 0)}</span>
            </p>
            <button onClick={() => setMostrarHistorial(!mostrarHistorial)} style={toggleLinkStyle}>
              {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial'}
            </button>
            {mostrarHistorial && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Fecha</th>
                    <th style={th}>Servicio</th>
                    <th style={th}>Monto</th>
                    <th style={th}>Pago</th>
                    <th style={th}>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(s => (
                    <>
                      <tr key={s.id} style={{ backgroundColor: PAPER_2 }}>
                        <td style={td}>{s.fecha}</td>
                        <td style={td}>{s.tipo_masaje}</td>
                        <td style={{ ...td, ...moneyStyle }}>${s.monto}</td>
                        <td style={td}>{s.forma_pago}</td>
                        <td style={td}>
                          {s.notas_clinicas ? (
                            <button
                              onClick={() => setNotaAbiertaHistorialId(notaAbiertaHistorialId === s.id ? null : s.id)}
                              title="Ver nota"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <NoteIcon />
                            </button>
                          ) : (
                            <span style={{ color: MUTED, fontSize: '13px' }}>—</span>
                          )}
                        </td>
                      </tr>
                      {notaAbiertaHistorialId === s.id && s.notas_clinicas && (
                        <tr key={`${s.id}-nota`} style={{ backgroundColor: '#FBF7EE' }}>
                          <td style={{ ...td, fontStyle: 'italic', color: INK }} colSpan={5}>
                            {s.notas_clinicas}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        {clienteHistorial && historial.length === 0 && (
          <p style={{ color: MUTED, marginTop: '12px', fontSize: '14px' }}>Este cliente no tiene turnos registrados.</p>
        )}
      </div>

      {/* 4. SERVICIOS DEL MES */}
      <div style={card}>
        <h2 style={{ color: INK, marginTop: 0, fontFamily: FONT_SERIF, fontWeight: 600, fontSize: '19px' }}>Servicios del mes</h2>
        {rankingServicios.length === 0 ? (
          <p style={{ color: MUTED, fontSize: '14px' }}>No hay turnos este mes.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Servicio</th>
                <th style={th}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {rankingServicios.map(([nombre, cantidad]) => (
                <tr key={nombre} style={{ backgroundColor: PAPER_2 }}>
                  <td style={td}>{nombre}</td>
                  <td style={{ ...td, ...moneyStyle }}>{cantidad as number}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#F4EFE4', fontWeight: 700 }}>
                <td style={{ ...td, fontWeight: 700 }}>Total</td>
                <td style={{ ...td, ...moneyStyle }}>
                  {rankingServicios.reduce((acc, [, cantidad]) => acc + (cantidad as number), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  )
}