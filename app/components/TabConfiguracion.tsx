'use client'
import { supabase } from '../../lib/supabase'

interface Props {
  clientes: any[]
  servicios: any[]
  mostrarClientes: boolean
  setMostrarClientes: (v: boolean) => void
  mostrarServicios: boolean
  setMostrarServicios: (v: boolean) => void
  nombre: string
  setNombre: (v: string) => void
  telefono: string
  setTelefono: (v: string) => void
  nuevoServicioCodigo: string
  setNuevoServicioCodigo: (v: string) => void
  nuevoServicioNombre: string
  setNuevoServicioNombre: (v: string) => void
  userId: string
  cargarClientes: (uid: string) => void
  cargarServicios: (uid: string) => void
  eliminarCliente: (id: string) => void
  eliminarServicio: (id: string) => void
  card: React.CSSProperties
  input: React.CSSProperties
  btnPrimary: React.CSSProperties
  btnSecondary: React.CSSProperties
}

export default function TabConfiguracion({
  clientes, servicios,
  mostrarClientes, setMostrarClientes,
  mostrarServicios, setMostrarServicios,
  nombre, setNombre, telefono, setTelefono,
  nuevoServicioCodigo, setNuevoServicioCodigo,
  nuevoServicioNombre, setNuevoServicioNombre,
  userId, cargarClientes, cargarServicios,
  eliminarCliente, eliminarServicio,
  card, input, btnPrimary, btnSecondary
}: Props) {

  async function agregarCliente() {
    await supabase.from('clientes').insert([{ nombre, telefono, user_id: userId }])
    setNombre('')
    setTelefono('')
    cargarClientes(userId)
  }

  async function agregarServicio() {
    await supabase.from('servicios').insert([{ codigo: nuevoServicioCodigo, nombre: nuevoServicioNombre, user_id: userId }])
    setNuevoServicioCodigo('')
    setNuevoServicioNombre('')
    cargarServicios(userId)
  }

  const inp: React.CSSProperties = {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e3dfd6',
    marginRight: '8px',
    marginBottom: '8px',
    fontFamily: 'Arial',
    width: '220px'
  }

  return (
    <>
      {/* AGREGAR CLIENTE */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Agregar Cliente</h2>
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={input} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={input} />
        <button onClick={agregarCliente} style={btnPrimary}>Agregar Cliente</button>
      </div>

      {/* LISTA CLIENTES */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ color: '#161616', marginTop: 0, marginBottom: 0 }}>Clientes ({clientes.length})</h2>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} style={btnSecondary}>
            {mostrarClientes ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {mostrarClientes && (
          <ul style={{ marginTop: '16px', paddingLeft: '16px' }}>
            {clientes.map(c => (
              <li key={c.id} style={{ marginBottom: '8px', color: '#161616' }}>
                {c.nombre} - {c.telefono}
                <button onClick={() => eliminarCliente(c.id)} style={{ marginLeft: '10px', color: '#ba9a7d', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SERVICIOS */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ color: '#161616', marginTop: 0, marginBottom: 0 }}>Servicios ({servicios.length})</h2>
          <button onClick={() => setMostrarServicios(!mostrarServicios)} style={btnSecondary}>
            {mostrarServicios ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        <input placeholder="Código (ej: M001)" value={nuevoServicioCodigo} onChange={e => setNuevoServicioCodigo(e.target.value)} style={input} />
        <input placeholder="Nombre (ej: Masaje relajante)" value={nuevoServicioNombre} onChange={e => setNuevoServicioNombre(e.target.value)} style={input} />
        <button onClick={agregarServicio} style={btnPrimary}>Agregar Servicio</button>
        {mostrarServicios && (
          <ul style={{ marginTop: '16px', paddingLeft: '16px' }}>
            {servicios.map(s => (
              <li key={s.id} style={{ marginBottom: '8px', color: '#161616' }}>
                <strong>{s.codigo}</strong> - {s.nombre}
                <button onClick={() => eliminarServicio(s.id)} style={{ marginLeft: '10px', color: '#ba9a7d', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CAMBIAR CONTRASEÑA */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Cambiar Contraseña</h2>
        <input type="password" placeholder="Nueva contraseña" style={inp} />
        <input type="password" placeholder="Confirmar contraseña" style={inp} />
        <br />
        <button style={btnPrimary}>Actualizar contraseña</button>
      </div>
    </>
  )
}