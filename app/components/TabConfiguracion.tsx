'use client'
import { useState } from 'react'
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

  const [clienteSeleccionadoArchivo, setClienteSeleccionadoArchivo] = useState('')
  const [busquedaClienteArchivo, setBusquedaClienteArchivo] = useState('')
  const [archivos, setArchivos] = useState<any[]>([])
  const [notaTexto, setNotaTexto] = useState('')
  const [archivoFile, setArchivoFile] = useState<File | null>(null)
  const [cargandoArchivo, setCargandoArchivo] = useState(false)

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

  async function cargarArchivos(clienteId: string) {
    const { data } = await supabase
      .from('archivos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setArchivos(data || [])
  }

  async function subirArchivo() {
    if (!clienteSeleccionadoArchivo || !archivoFile) return
    setCargandoArchivo(true)
    const nombreArchivo = `${userId}/${clienteSeleccionadoArchivo}/${Date.now()}_${archivoFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('archivos-clientes')
      .upload(nombreArchivo, archivoFile)
    if (uploadError) { alert('Error al subir: ' + uploadError.message); setCargandoArchivo(false); return }
    const { data: urlData } = supabase.storage.from('archivos-clientes').getPublicUrl(nombreArchivo)
    await supabase.from('archivos_clientes').insert([{
      cliente_id: clienteSeleccionadoArchivo,
      nombre: archivoFile.name,
      url: urlData.publicUrl,
      tipo: 'pdf',
      user_id: userId
    }])
    setArchivoFile(null)
    setCargandoArchivo(false)
    cargarArchivos(clienteSeleccionadoArchivo)
    alert('Archivo subido!')
  }

  async function guardarNota() {
    if (!clienteSeleccionadoArchivo || !notaTexto.trim()) return
    await supabase.from('archivos_clientes').insert([{
      cliente_id: clienteSeleccionadoArchivo,
      nombre: 'Nota',
      contenido: notaTexto,
      tipo: 'nota',
      user_id: userId
    }])
    setNotaTexto('')
    cargarArchivos(clienteSeleccionadoArchivo)
    alert('Nota guardada!')
  }

  async function eliminarArchivo(id: string, url?: string, tipo?: string) {
    if (tipo === 'pdf' && url) {
      const path = url.split('/archivos-clientes/')[1]
      if (path) await supabase.storage.from('archivos-clientes').remove([path])
    }
    await supabase.from('archivos_clientes').delete().eq('id', id)
    cargarArchivos(clienteSeleccionadoArchivo)
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

      {/* ARCHIVOS Y NOTAS */}
      <div style={card}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Archivos y Notas por Cliente</h2>
        <input
          placeholder="Buscar cliente..."
          value={busquedaClienteArchivo}
          onChange={e => { setBusquedaClienteArchivo(e.target.value); setClienteSeleccionadoArchivo('') }}
          style={input}
        />
        {busquedaClienteArchivo && !clienteSeleccionadoArchivo && (
          <ul style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px', listStyle: 'none', margin: '0 0 12px 0' }}>
            {clientes
              .filter(c => c.nombre.toLowerCase().includes(busquedaClienteArchivo.toLowerCase()))
              .map(c => (
                <li key={c.id}
                  onClick={() => { setClienteSeleccionadoArchivo(c.id); setBusquedaClienteArchivo(c.nombre); cargarArchivos(c.id) }}
                  style={{ padding: '8px', cursor: 'pointer', color: '#161616' }}>
                  {c.nombre}
                </li>
              ))}
          </ul>
        )}

        {clienteSeleccionadoArchivo && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#161616', fontWeight: 'bold', marginBottom: '8px' }}>📎 Subir PDF</p>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setArchivoFile(e.target.files?.[0] || null)}
                style={{ marginBottom: '8px' }}
              />
              <br />
              <button onClick={subirArchivo} style={btnPrimary} disabled={cargandoArchivo}>
                {cargandoArchivo ? 'Subiendo...' : 'Subir PDF'}
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#161616', fontWeight: 'bold', marginBottom: '8px' }}>📝 Agregar Nota</p>
              <textarea
                placeholder="Escribí una nota para este cliente..."
                value={notaTexto}
                onChange={e => setNotaTexto(e.target.value)}
                style={{ ...input, width: '100%', height: '80px', resize: 'vertical' }}
              />
              <br />
              <button onClick={guardarNota} style={btnPrimary}>Guardar Nota</button>
            </div>

            {archivos.length > 0 && (
              <div>
                <p style={{ color: '#161616', fontWeight: 'bold', marginBottom: '8px' }}>Archivos y notas guardadas:</p>
                {archivos.map(a => (
                  <div key={a.id} style={{ backgroundColor: '#f9f7f4', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #e3dfd6' }}>
                    {a.tipo === 'pdf' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📄 <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#ba9a7d' }}>{a.nombre}</a></span>
                        <button onClick={() => eliminarArchivo(a.id, a.url, a.tipo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#161616', fontWeight: 'bold' }}>📝 Nota</span>
                          <button onClick={() => eliminarArchivo(a.id, undefined, a.tipo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d' }}>Eliminar</button>
                        </div>
                        <p style={{ color: '#161616', margin: '4px 0 0', fontSize: '14px' }}>{a.contenido}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
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