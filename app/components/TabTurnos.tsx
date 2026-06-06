'use client'

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
  cobrarSesion: (id: string) => void
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
  mesSeleccionado, setMesSeleccionado,
  totalEfectivo, totalTransferencia, totalMes, totalCuentaCorriente,
  rankingServicios,
  editandoId, setEditandoId,
  editFecha, setEditFecha,
  editServicio, setEditServicio,
  editMonto, setEditMonto,
  editFormaPago, setEditFormaPago,
  clienteHistorial, setClienteHistorial, historial,
  agregarSesion, eliminarSesion, toggleFacturado,cobrarSesion,
  iniciarEdicion, guardarEdicion, cargarHistorial,
  card, input, btnPrimary, btnSecondary, th, td
}: Props) {

  const serviciosFiltrados = servicios.filter(s =>
    s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()) ||
    s.codigo.toLowerCase().includes(busquedaServicio.toLowerCase())
  )

  return (
    <>
      {/* REGISTRAR TURNO */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Registrar Turno</h2>
        <input
          placeholder="Buscar cliente..."
          value={busquedaCliente}
          onChange={e => { setBusquedaCliente(e.target.value); setClienteSeleccionado('') }}
          style={input}
        />
        {busquedaCliente && !clienteSeleccionado && (
          <ul style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px', listStyle: 'none', margin: 0 }}>
            {clientes
              .filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
              .map(c => (
                <li key={c.id}
                  onClick={() => { setClienteSeleccionado(c.id); setBusquedaCliente(c.nombre) }}
                  style={{ padding: '8px', cursor: 'pointer' }}>
                  {c.nombre}
                </li>
              ))}
          </ul>
        )}
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={input} />
        <input type="time" value={horario} onChange={e => setHorario(e.target.value)} style={input} />
        <input
          placeholder="Buscar servicio por código o nombre"
          value={busquedaServicio}
          onChange={e => { setBusquedaServicio(e.target.value); setServicioSeleccionado('') }}
          style={{ ...input, width: '280px' }}
        />
        {busquedaServicio && serviciosFiltrados.length > 0 && !servicioSeleccionado && (
          <ul style={{ border: '1px solid #e3dfd6', borderRadius: '8px', padding: '8px', listStyle: 'none', marginBottom: '8px' }}>
            {serviciosFiltrados.map(s => (
              <li key={s.id}
                onClick={() => { setServicioSeleccionado(s.nombre); setBusquedaServicio(s.codigo + ' - ' + s.nombre) }}
                style={{ padding: '6px', cursor: 'pointer', color: '#161616' }}>
                {s.codigo} - {s.nombre}
              </li>
            ))}
          </ul>
        )}
        <input placeholder="Monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} style={input} />
<select value={formaPago} onChange={e => setFormaPago(e.target.value)} style={input}>
  <option value="efectivo">Efectivo</option>
  <option value="transferencia">Transferencia</option>
  <option value="obra_social">Obra Social</option>
  <option value="cuenta_corriente">Cuenta corriente</option>
</select>

<br />
<small style={{ color: '#9e9e9e' }}>Pago adicional (opcional)</small>
<br />
<input placeholder="Monto adicional" type="number" value={monto2} onChange={e => setMonto2(e.target.value)} style={input} />
<select value={formaPago2} onChange={e => setFormaPago2(e.target.value)} style={input}>
  <option value="">Sin pago adicional</option>
  <option value="efectivo">Efectivo</option>
  <option value="transferencia">Transferencia</option>
  <option value="obra_social">Obra Social</option>
</select>
        <br />
        <button onClick={agregarSesion} style={btnPrimary}>Registrar Turno</button>
      </div>

      {/* RESUMEN DEL MES */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Resumen del mes</h2>
        <input type="month" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} style={input} />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>💵 Efectivo</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalEfectivo}</p>
          </div>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>🏦 Transferencia</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalTransferencia}</p>
          </div>
          <div style={{ backgroundColor: '#ba9a7d', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#ffffff' }}>💰 Total</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>${totalMes}</p>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#f0e6d3', borderRadius: '8px', padding: '16px', flex: 1 }}>
  <p style={{ margin: 0, color: '#161616' }}>📋 Cuenta Corriente</p>
  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalCuentaCorriente}</p>
</div>

      {/* RANKING SERVICIOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Servicios del mes</h2>
        {rankingServicios.length === 0 ? (
          <p style={{ color: '#161616' }}>No hay turnos este mes.</p>
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
                <tr key={nombre} style={{ backgroundColor: '#ffffff' }}>
                  <td style={td}>{nombre}</td>
                  <td style={td}>{cantidad as number}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                <td style={td}>Total</td>
                <td style={td}>
                  {rankingServicios.reduce((acc, [, cantidad]) => acc + (cantidad as number), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* TURNOS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Turnos de {mesSeleccionado}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Cliente</th>
              <th style={th}>Fecha</th>
              <th style={th}>Servicio</th>
              <th style={th}>Monto</th>
              <th style={th}>Pago</th>
              <th style={th}>Facturado</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              editandoId === s.id ? (
                <tr key={s.id} style={{ backgroundColor: '#fffaf7' }}>
                  <td style={td}>{s.clientes?.nombre}</td>
                  <td style={td}><input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                  <td style={td}><input value={editServicio} onChange={e => setEditServicio(e.target.value)} style={{ ...input, marginBottom: 0 }} /></td>
                  <td style={td}><input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} style={{ ...input, marginBottom: 0, width: '80px' }} /></td>
                  <td style={td}>
                    <select value={editFormaPago} onChange={e => setEditFormaPago(e.target.value)} style={{ ...input, marginBottom: 0 }}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </td>
                  <td style={td}>-</td>
                  <td style={td}>
                    <button onClick={() => guardarEdicion(s.id)} style={{ ...btnPrimary, padding: '6px 12px', marginRight: '6px' }}>Guardar</button>
                    <button onClick={() => setEditandoId(null)} style={{ ...btnSecondary, marginLeft: 0 }}>Cancelar</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={td}>{s.clientes?.nombre}</td>
                  <td style={td}>{s.fecha}</td>
                  <td style={td}>{s.tipo_masaje}</td>
                  <td style={td}>
  ${s.monto}
  {s.monto2 ? ` + $${s.monto2}` : ''}
</td>
<td style={td}>
  {s.forma_pago}
  {s.forma_pago2 ? ` + ${s.forma_pago2}` : ''}
</td>
                  <td style={td}>
  {s.forma_pago === 'transferencia' ? (
    <input type="checkbox" checked={s.facturado || false} onChange={() => toggleFacturado(s.id, s.facturado || false)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ba9a7d' }} />
  ) : s.forma_pago === 'cuenta_corriente' && !s.cobrado ? (
    <button onClick={() => cobrarSesion(s.id)} style={{ background: '#ba9a7d', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>Cobrar</button>
  ) : s.forma_pago === 'cuenta_corriente' && s.cobrado ? (
    <span style={{ color: '#4caf50', fontSize: '13px' }}>✓ Cobrado</span>
  ) : (
    <span style={{ color: '#9e9e9e', fontSize: '13px' }}>—</span>
  )}
</td>
                  <td style={td}>
                    <button onClick={() => iniciarEdicion(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', marginRight: '8px' }}>Editar</button>
                    <button onClick={() => eliminarSesion(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* HISTORIAL POR CLIENTE */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Historial por Cliente</h2>
        <input
  placeholder="Buscar cliente..."
  value={clienteHistorial}
  onChange={e => {
    setClienteHistorial(e.target.value)
  }}
  style={input}
/>
{clienteHistorial && (
  <ul style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px', listStyle: 'none', margin: 0, marginBottom: '12px' }}>
    {clientes
      .filter(c => c.nombre.toLowerCase().includes(clienteHistorial.toLowerCase()))
      .map(c => (
        <li key={c.id}
          onClick={() => { setClienteHistorial(c.nombre); cargarHistorial(c.id) }}
          style={{ padding: '8px', cursor: 'pointer', color: '#161616' }}>
          {c.nombre}
        </li>
      ))}
  </ul>
)}
        {historial.length > 0 && (
          <>
            <p style={{ color: '#161616', marginTop: '12px' }}>
              <strong>Total de turnos:</strong> {historial.length} &nbsp;|&nbsp;
              <strong>Total facturado:</strong> ${historial.reduce((sum, s) => sum + (s.monto || 0), 0)}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Servicio</th>
                  <th style={th}>Monto</th>
                  <th style={th}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(s => (
                  <tr key={s.id} style={{ backgroundColor: '#ffffff' }}>
                    <td style={td}>{s.fecha}</td>
                    <td style={td}>{s.tipo_masaje}</td>
                    <td style={td}>${s.monto}</td>
                    <td style={td}>{s.forma_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {clienteHistorial && historial.length === 0 && (
          <p style={{ color: '#9e9e9e', marginTop: '12px' }}>Este cliente no tiene turnos registrados.</p>
        )}
      </div>
    </>
  )
}