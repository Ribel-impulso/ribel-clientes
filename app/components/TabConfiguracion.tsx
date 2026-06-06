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

  const [clienteAbierto, setClienteAbierto] = useState<string | null>(null)
  const [archivos, setArchivos] = useState<Record<string, any[]>>({})
  const [notaTexto, setNotaTexto] = useState<Record<string, string>>({})
  const [archivoFile, setArchivoFile] = useState<Record<string, File | null>>({})
  const [cargando, setCargando] = useState<string | null>(null)

  async function cargarArchivos(clienteId: string) {
    const { data } = await supabase
      .from('archivos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setArchivos(prev => ({ ...prev, [clienteId]: data || [] }))
  }

  async function toggleCliente(clienteId: string) {
    if (clienteAbierto === clienteId) {
      setClienteAbierto(null)
    } else {
      setClienteAbierto(clienteId)
      cargarArchivos(clienteId)
    }
  }

  async function subirArchivo(clienteId: string) {
    const file = archivoFile[clienteId]
    if (!file) return
    setCargando(clienteId)
    const nombreArchivo = `${userId}/${clienteId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('archivos-clientes')
      .upload(nombreArchivo, file)
    if (uploadError) { alert('Error al subir: ' + uploadError.message); setCargando(null); return }
    const { data: urlData } = supabase.storage.from('archivos-clientes').getPublicUrl(nombreArchivo)
    await supabase.from('archivos_clientes').insert([{
      cliente_id: clienteId,
      nombre: file.name,
      url: urlData.publicUrl,
      tipo: 'pdf',
      user_id: userId
    }])
    setArchivoFile(prev => ({ ...prev, [clienteId]: null }))
    setCargando(null)
    cargarArchivos(clienteId)
    alert('Archivo subido!')
  }

  async function guardarNota(clienteId: string) {
    const texto = notaTexto[clienteId]
    if (!texto?.trim()) return
    await supabase.from('archivos_clientes').insert([{
      cliente_id: clienteId,
      nombre: 'Nota',
      contenido: texto,
      tipo: 'nota',
      user_id: userId
    }])
    setNotaTexto(prev => ({ ...prev, [clienteId]: '' }))
    cargarArchivos(clienteId)
  }

  async function eliminarArchivo(clienteId: string, id: string, url?: string, tipo?: string) {
    if (tipo === 'pdf' && url) {
      const path = url.split('/archivos-clientes/')[1]
      if (path) await supabase.storage.from('archivos-clientes').remove([path])
    }
    await supabase.from('archivos_clientes').delete().eq('id', id)
    cargarArchivos(clienteId)
  }

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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#161616', margin: 0 }}>Clientes ({clientes.length})</h2>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} style={btnSecondary}>
            {mostrarClientes ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {mostrarClientes && (
          <div>
            {clientes.map(c => (
              <div key={c.id} style={{ borderRadius: '10px', border: '1px solid #e3dfd6', marginBottom: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9f7f4' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#161616' }}>{c.nombre}</span>
                    <span style={{ color: '#9e9e9e', marginLeft: '12px', fontSize: '14px' }}>{c.telefono}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleCliente(c.id)}
                      style={{ ...btnSecondary, marginLeft: 0, fontSize: '13px', padding: '6px 12px' }}>
                      {clienteAbierto === c.id ? 'Cerrar' : '📁 Archivos'}
                    </button>
                    <button
                      onClick={() => eliminarCliente(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {clienteAbierto === c.id && (
                  <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                    {/* SUBIR PDF */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px' }}>📎 Subir PDF</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setArchivoFile(prev => ({ ...prev, [c.id]: e.target.files?.[0] || null }))}
                        style={{ marginBottom: '8px', display: 'block' }}
                      />
                      <button
                        onClick={() => subirArchivo(c.id)}
                        style={{ ...btnPrimary, padding: '8px 16px', fontSize: '13px' }}
                        disabled={cargando === c.id}>
                        {cargando === c.id ? 'Subiendo...' : 'Subir PDF'}
                      </button>
                    </div>

                    {/* NOTA */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px' }}>📝 Agregar Nota</p>
                      <textarea
                        placeholder="Escribí una nota..."
                        value={notaTexto[c.id] || ''}
                        onChange={e => setNotaTexto(prev => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6', fontFamily: 'Arial', height: '80px', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => guardarNota(c.id)}
                        style={{ ...btnPrimary, padding: '8px 16px', fontSize: '13px', marginTop: '6px' }}>
                        Guardar Nota
                      </button>
                    </div>

                    {/* ARCHIVOS GUARDADOS */}
                    {(archivos[c.id] || []).length > 0 && (
                      <div>
                        <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px' }}>Guardados:</p>
                        {(archivos[c.id] || []).map(a => (
                          <div key={a.id} style={{ backgroundColor: '#f9f7f4', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', border: '1px solid #e3dfd6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {a.tipo === 'pdf' ? (
                              <>
                                <span>📄 <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#ba9a7d' }}>{a.nombre}</a></span>
                                <button onClick={() => eliminarArchivo(c.id, a.id, a.url, a.tipo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                              </>
                            ) : (
                              <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 'bold', color: '#161616', fontSize: '13px' }}>📝 Nota</span>
                                  <button onClick={() => eliminarArchivo(c.id, a.id, undefined, a.tipo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                                </div>
                                <p style={{ color: '#161616', margin: '4px 0 0', fontSize: '14px' }}>{a.contenido}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {(archivos[c.id] || []).length === 0 && (
                      <p style={{ color: '#9e9e9e', fontSize: '13px' }}>No hay archivos ni notas guardadas.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SERVICIOS */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ color: '#161616', margin: 0 }}>Servicios ({servicios.length})</h2>
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