'use client'

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
  agregarGasto, eliminarGasto,
  card, input, btnPrimary, th, td
}: Props) {
  return (
    <>
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Registrar Ingreso / Egreso</h2>
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
        <h2 style={{ color: '#161616', marginTop: 0 }}>Resumen Ingresos y Egresos</h2>
        <input type="month" value={mesGastos} onChange={e => setMesGastos(e.target.value)} style={input} />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>📈 Ingresos</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalIngresos}</p>
          </div>
          <div style={{ backgroundColor: '#e3dfd6', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#161616' }}>📉 Egresos</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#161616' }}>${totalEgresos}</p>
          </div>
          <div style={{ backgroundColor: balanceNeto >= 0 ? '#ba9a7d' : '#c0392b', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <p style={{ margin: 0, color: '#ffffff' }}>💰 Balance</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>${balanceNeto}</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
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
            {gastos.map(g => (
              <tr key={g.id} style={{ backgroundColor: g.tipo === 'ingreso' ? '#f0fff4' : '#fff5f5' }}>
                <td style={td}>{g.fecha}</td>
                <td style={td}>{g.descripcion}</td>
                <td style={td}>${g.monto}</td>
                <td style={td}>
                  <span style={{ color: g.tipo === 'ingreso' ? 'green' : '#c0392b', fontWeight: 'bold' }}>
                    {g.tipo === 'ingreso' ? '▲ Ingreso' : '▼ Egreso'}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ backgroundColor: g.categoria === 'personal' ? '#dbeafe' : '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {g.categoria || 'negocio'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => eliminarGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}