'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Disponibilidad {
  id?: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  duracion_turno: number
  activo: boolean
}

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
  nuevoServicioNombre: string
setNuevoServicioNombre: (v: string) => void
nuevoServicioDuracion: number
setNuevoServicioDuracion: (v: number) => void
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

function CambiarPassword({ btnPrimary, inp }: { btnPrimary: React.CSSProperties, inp: React.CSSProperties }) {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleCambiar() {
    setError('')
    setMensaje('')
    if (nuevaPassword.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (nuevaPassword !== confirmar) { setError('Las contraseñas no coinciden'); return }
    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (error) {
      setError('Error: ' + error.message)
    } else {
      setMensaje('¡Contraseña actualizada!')
      setNuevaPassword('')
      setConfirmar('')
    }
    setCargando(false)
  }

  return (
    <>
      <h2 style={{ color: '#161616', marginTop: 0 }}>Cambiar Contraseña</h2>
      <input type="password" placeholder="Nueva contraseña" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} style={inp} />
      <input type="password" placeholder="Confirmar contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)} style={inp} />
      <br />
      {error && <p style={{ color: '#c0392b', fontSize: '14px' }}>{error}</p>}
      {mensaje && <p style={{ color: '#16a34a', fontSize: '14px' }}>{mensaje}</p>}
      <button onClick={handleCambiar} disabled={cargando} style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}>
        {cargando ? 'Guardando...' : 'Actualizar contraseña'}
      </button>
    </>
  )
}

function SeccionDisponibilidad({ userId, card, btnPrimary, btnSecondary }: {
  userId: string
  card: React.CSSProperties
  btnPrimary: React.CSSProperties
  btnSecondary: React.CSSProperties
}) {
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const disponibilidadDefault: Disponibilidad[] = DIAS_SEMANA.map((_, i) => ({
    dia_semana: i,
    hora_inicio: '09:00',
    hora_fin: '18:00',
    duracion_turno: 60,
    activo: i >= 1 && i <= 5, // Lun-Vie activos por defecto
  }))

  useEffect(() => {
    cargarDisponibilidad()
  }, [userId])

  async function cargarDisponibilidad() {
    const { data } = await supabase
      .from('disponibilidad')
      .select('*')
      .eq('user_id', userId)
      .order('dia_semana')

    if (data && data.length > 0) {
      // Mezclar con defaults para días no configurados
      const merged = disponibilidadDefault.map(def => {
        const guardado = data.find((d: any) => d.dia_semana === def.dia_semana)
        return guardado ? { ...guardado } : def
      })
      setDisponibilidad(merged)
    } else {
      setDisponibilidad(disponibilidadDefault)
    }
  }

  function actualizarDia(dia: number, campo: keyof Disponibilidad, valor: any) {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === dia ? { ...d, [campo]: valor } : d
    ))
  }

  async function guardar() {
    setGuardando(true)
    setMensaje('')

    for (const d of disponibilidad) {
      const payload = {
        user_id: userId,
        dia_semana: d.dia_semana,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin,
        duracion_turno: d.duracion_turno,
        activo: d.activo,
      }

      if (d.id) {
        await supabase.from('disponibilidad').update(payload).eq('id', d.id)
      } else {
        await supabase.from('disponibilidad').upsert({ ...payload }, { onConflict: 'user_id,dia_semana' })
      }
    }

    await cargarDisponibilidad()
    setMensaje('¡Disponibilidad guardada!')
    setGuardando(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  return (
    <div style={card}>
      <h2 style={{ color: '#161616', marginTop: 0 }}>🗓️ Días y horarios de atención</h2>
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
        Configurá los días y horarios en los que atendés. Esto te permitirá ver los turnos libres y ocupados en la agenda.
      </p>

      <div style={{ marginBottom: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
        <span>⏱️ Duración: tiempo por turno en minutos</span>
      </div>

      {disponibilidad.map((d) => (
        <div key={d.dia_semana} style={{
          border: `1px solid ${d.activo ? '#ba9a7d' : '#e3dfd6'}`,
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '10px',
          backgroundColor: d.activo ? '#fdf9f5' : '#f9f9f9',
          opacity: d.activo ? 1 : 0.6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            {/* Día + toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '110px' }}>
              <div
                onClick={() => actualizarDia(d.dia_semana, 'activo', !d.activo)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  backgroundColor: d.activo ? '#ba9a7d' : '#CBD5E0',
                  cursor: 'pointer', position: 'relative', flexShrink: 0,
                  transition: 'background-color 0.2s'
                }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: d.activo ? '18px' : '3px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  backgroundColor: '#fff', transition: 'left 0.2s'
                }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#161616' }}>
                {DIAS_SEMANA[d.dia_semana]}
              </span>
            </div>

            {/* Horarios y duración — solo si activo */}
            {d.activo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280' }}>Desde</label>
                  <input
                    type="time"
                    value={d.hora_inicio}
                    onChange={e => actualizarDia(d.dia_semana, 'hora_inicio', e.target.value)}
                    style={{ border: '1px solid #e3dfd6', borderRadius: '6px', padding: '5px 8px', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280' }}>Hasta</label>
                  <input
                    type="time"
                    value={d.hora_fin}
                    onChange={e => actualizarDia(d.dia_semana, 'hora_fin', e.target.value)}
                    style={{ border: '1px solid #e3dfd6', borderRadius: '6px', padding: '5px 8px', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280' }}>⏱️</label>
                  <select
                    value={d.duracion_turno}
                    onChange={e => actualizarDia(d.dia_semana, 'duracion_turno', Number(e.target.value))}
                    style={{ border: '1px solid #e3dfd6', borderRadius: '6px', padding: '5px 8px', fontSize: '13px' }}>
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>
            )}

            {!d.activo && (
              <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No atiende</span>
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={guardar}
          disabled={guardando}
          style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'Guardar disponibilidad'}
        </button>
        {mensaje && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{mensaje}</span>}
      </div>
    </div>
  )
}

export default function TabConfiguracion({
  clientes, servicios,
  mostrarClientes, setMostrarClientes,
  mostrarServicios, setMostrarServicios,
  nombre, setNombre, telefono, setTelefono,
  nuevoServicioNombre, setNuevoServicioNombre,
  nuevoServicioDuracion, setNuevoServicioDuracion,
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
  const [editWhatsapp, setEditWhatsapp] = useState('')
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
    await supabase.from('clientes').update({ nombre: editNombre, whatsapp: editWhatsapp }).eq('id', id)
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
    await supabase.from('clientes').insert([{ nombre, whatsapp: telefono, user_id: userId }])
    setNombre('')
    setTelefono('')
    cargarClientes(userId)
  }

  async function agregarServicio() {
  await supabase.from('servicios').insert([{ nombre: nuevoServicioNombre, duracion: nuevoServicioDuracion, user_id: userId }])
  setNuevoServicioNombre('')
  setNuevoServicioDuracion(60)
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
        <input placeholder="WhatsApp (ej: 1123456789)" value={telefono} onChange={e => setTelefono(e.target.value)} style={input} />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f9f7f4' }}>
                  <span style={{ fontWeight: 'bold', color: '#161616', fontSize: '15px' }}>{c.nombre}</span>
                  <button
                    onClick={() => toggleCliente(c.id)}
                    style={{ backgroundColor: '#ba9a7d', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'Arial', fontSize: '13px' }}>
                    {clienteAbierto === c.id ? 'Cerrar' : 'Ver'}
                  </button>
                </div>

                {clienteAbierto === c.id && (
                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #e3dfd6' }}>
                    {editandoCliente === c.id ? (
                      <div style={{ marginBottom: '16px' }}>
                        <input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre" style={{ ...input, marginBottom: '8px' }} />
                        <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="WhatsApp (ej: 1123456789)" style={{ ...input, marginBottom: '8px' }} />
                        <button onClick={() => guardarEdicionCliente(c.id)} style={{ ...btnPrimary, marginRight: '8px', fontSize: '13px', padding: '6px 14px' }}>Guardar</button>
                        <button onClick={() => setEditandoCliente(null)} style={{ ...btnSecondary, fontSize: '13px', padding: '6px 14px' }}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#161616' }}>💬 {c.whatsapp || 'Sin WhatsApp'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setEditandoCliente(c.id); setEditNombre(c.nombre); setEditWhatsapp(c.whatsapp || '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Editar</button>
                          <button onClick={() => eliminarCliente(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                        </div>
                      </div>
                    )}

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
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
    <input placeholder="Nombre (ej: Masaje relajante)" value={nuevoServicioNombre}
      onChange={e => setNuevoServicioNombre(e.target.value)} style={input} />
    <select value={nuevoServicioDuracion} onChange={e => setNuevoServicioDuracion(Number(e.target.value))}
      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px' }}>
      <option value={15}>15 min</option>
      <option value={30}>30 min</option>
      <option value={45}>45 min</option>
      <option value={60}>60 min</option>
      <option value={75}>75 min</option>
      <option value={90}>90 min</option>
    </select>
  </div>
  <button onClick={agregarServicio} style={btnPrimary}>Agregar Servicio</button>
  {mostrarServicios && (
    <ul style={{ marginTop: '16px', paddingLeft: '16px' }}>
      {servicios.map(s => (
        <li key={s.id} style={{ marginBottom: '8px', color: '#161616' }}>
          {s.nombre} · <span style={{ color: '#6B7280', fontSize: '13px' }}>{s.duracion ?? 60} min</span>
          <button onClick={() => eliminarServicio(s.id)} style={{ marginLeft: '10px', color: '#ba9a7d', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
        </li>
      ))}
    </ul>
  )}
</div>

      {/* DISPONIBILIDAD — primera sección para que sea fácil de encontrar */}
      <SeccionDisponibilidad
        userId={userId}
        card={card}
        btnPrimary={btnPrimary}
        btnSecondary={btnSecondary}
      />

      {/* CAMBIAR CONTRASEÑA */}
      <div style={card}>
        <CambiarPassword btnPrimary={btnPrimary} inp={inp} />
      </div>
    </>
  )
}