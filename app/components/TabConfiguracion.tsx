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
  const [editandoCliente, setEditandoCliente] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [busquedaClientes, setBusquedaClientes] = useState('')

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

  async function guardarEdicionCliente(id: string) {
    await supabase.from('clientes').update({ nombre: editNombre, telefono: editTelefono }).eq('id', id)
    setEditandoCliente(null)
    cargarClientes(userId)
  }

  async function subirArchivo(clienteId: string) {
    const file = archivoFile[clienteId]
    if (!file) return
    setCargando(clienteId)
    const nombreLimpio = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '')
    const nombreArchivo = `${userId}/${clienteId}/${Date.now()}_${nombreLimpio}`
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
    <input
      placeholder="Buscar cliente..."
      value={busquedaClientes}
      onChange={e => setBusquedaClientes(e.target.value)}
      style={input}
    />
    {clientes.filter(c => c.nombre.toLowerCase().includes(busquedaClientes.toLowerCase())).map(c => (
              <div key={c.id} style={{ borderRadius: '10px', border: '1px solid #e3dfd6', marginBottom: '10px', overflow: 'hidden' }}>
                
                {/* FILA PRINCIPAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f9f7f4' }}>
                  <span style={{ fontWeight: 'bold', color: '#161616', fontSize: '15px' }}>{c.nombre}</span>
                  <button
                    onClick={() => toggleCliente(c.id)}
                    style={{ backgroundColor: '#ba9a7d', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'Arial', fontSize: '13px' }}>
                    {clienteAbierto === c.id ? 'Cerrar' : 'Ver'}
                  </button>
                </div>

                {/* PANEL DESPLEGABLE */}
                {clienteAbierto === c.id && (
                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #e3dfd6' }}>
                    
                    {/* INFO */}
                    {editandoCliente === c.id ? (
                      <div style={{ marginBottom: '16px' }}>
                        <input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre" style={{ ...input, marginBottom: '8px' }} />
                        <input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} placeholder="Teléfono" style={{ ...input, marginBottom: '8px' }} />
                        <button onClick={() => guardarEdicionCliente(c.id)} style={{ ...btnPrimary, marginRight: '8px', fontSize: '13px', padding: '6px 14px' }}>Guardar</button>
                        <button onClick={() => setEditandoCliente(null)} style={{ ...btnSecondary, fontSize: '13px', padding: '6px 14px' }}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#161616' }}>📞 {c.telefono || 'Sin teléfono'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setEditandoCliente(c.id); setEditNombre(c.nombre); setEditTelefono(c.telefono || '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Editar</button>
                          <button onClick={() => eliminarCliente(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                        </div>
                      </div>
                    )}

                    {/* SUBIR PDF */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>📎 Subir PDF</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setArchivoFile(prev => ({ ...prev, [c.id]: e.target.files?.[0] || null }))}
                        style={{ marginBottom: '8px', display: 'block' }}
                      />
                      <button
                        onClick={() => subirArchivo(c.id)}
                        style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px' }}
                        disabled={cargando === c.id}>
                        {cargando === c.id ? 'Subiendo...' : 'Subir PDF'}
                      </button>
                    </div>

                    {/* NOTA */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>📝 Agregar Nota</p>
                      <textarea
                        placeholder="Escribí una nota..."
                        value={notaTexto[c.id] || ''}
                        onChange={e => setNotaTexto(prev => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6', fontFamily: 'Arial', height: '70px', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => guardarNota(c.id)}
                        style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px', marginTop: '6px' }}>
                        Guardar Nota
                      </button>
                    </div>

                    {/* ARCHIVOS GUARDADOS */}
                    {(archivos[c.id] || []).length > 0 ? (
                      <div>
                        <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>Guardados:</p>
                        {(archivos[c.id] || []).map(a => (
                          <div key={a.id} style={{ backgroundColor: '#f9f7f4', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', border: '1px solid #e3dfd6' }}>
                            {a.tipo === 'pdf' ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px' }}>📄 <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#ba9a7d' }} onClick={async (e) => {
  e.preventDefault()
  const path = a.url.split('/archivos-clientes/')[1]
  if (path) {
    const { data } = await supabase.storage.from('archivos-clientes').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }
}}>{a.nombre}</a></span>
                                <button onClick={() => eliminarArchivo(c.id, a.id, a.url, a.tipo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                              </div>
                            ) : (
                              <div>
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
                    ) : (
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