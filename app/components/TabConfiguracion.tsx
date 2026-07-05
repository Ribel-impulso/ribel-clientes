'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Bloque {
  inicio: string
  fin: string
  duracion: number
}

interface Disponibilidad {
  id?: string
  dia_semana: number
  activo: boolean
  bloques: Bloque[]
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

const phoneInputWrapperStyle = (base: React.CSSProperties): React.CSSProperties => ({
  ...base,
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
})

function MiNegocio({
  userId, nombreNegocio, setNombreNegocio, logoUrl, setLogoUrl,
  card, input, btnPrimary,
}: {
  userId: string
  nombreNegocio: string
  setNombreNegocio: (v: string) => void
  logoUrl: string
  setLogoUrl: (v: string) => void
  card: React.CSSProperties
  input: React.CSSProperties
  btnPrimary: React.CSSProperties
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewLocal, setPreviewLocal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  function seleccionarLogo(file: File | null) {
    setLogoFile(file)
    if (file) {
      setPreviewLocal(URL.createObjectURL(file))
    } else {
      setPreviewLocal(null)
    }
  }

  async function guardarNegocio() {
    setGuardando(true)
    setMensaje('')
    let nuevaLogoUrl = logoUrl

    if (logoFile) {
      const ext = logoFile.name.split('.').pop() || 'png'
      const path = `${userId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos-negocio')
        .upload(path, logoFile, { upsert: true })

      if (uploadError) {
        alert('Error al subir el logo: ' + uploadError.message)
        setGuardando(false)
        return
      }

      const { data: urlData } = supabase.storage.from('logos-negocio').getPublicUrl(path)
      nuevaLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`
      setLogoUrl(nuevaLogoUrl)
    }

    await supabase.from('configuracion_negocio').upsert({
      user_id: userId,
      nombre_negocio: nombreNegocio,
      logo_url: nuevaLogoUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    setLogoFile(null)
    setPreviewLocal(null)
    setGuardando(false)
    setMensaje('¡Guardado!')
    setTimeout(() => setMensaje(''), 3000)
  }

  const imagenAMostrar = previewLocal || logoUrl

  return (
    <div style={card}>
      <h2 style={{ color: '#161616', marginTop: 0 }}>Mi Negocio</h2>
      <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
        Este nombre y logo van a aparecer en tu agenda pública y en la vista previa cuando compartís el link.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '12px',
          border: '1px solid #e3dfd6', backgroundColor: '#f9f7f4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {imagenAMostrar ? (
            <img src={imagenAMostrar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Sin logo</span>
          )}
        </div>
        <div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={e => seleccionarLogo(e.target.files?.[0] || null)}
            style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}
          />
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>PNG, JPG o WEBP</span>
        </div>
      </div>

      <input
        placeholder="Nombre de tu negocio"
        value={nombreNegocio}
        onChange={e => setNombreNegocio(e.target.value)}
        style={{ ...input, width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}
      />

      <div>
        <button onClick={guardarNegocio} disabled={guardando} style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        {mensaje && <span style={{ marginLeft: '12px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{mensaje}</span>}
      </div>
    </div>
  )
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

const DURACIONES = [15, 20, 30, 45, 60, 90, 120]

function bloqueVacio(): Bloque {
  return { inicio: '09:00', fin: '13:00', duracion: 60 }
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
    activo: i >= 1 && i <= 5,
    bloques: i >= 1 && i <= 5 ? [bloqueVacio()] : [],
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
      const merged = disponibilidadDefault.map(def => {
        const guardado = data.find((d: any) => d.dia_semana === def.dia_semana)
        if (!guardado) return def
        return {
          id: guardado.id,
          dia_semana: guardado.dia_semana,
          activo: guardado.activo,
          bloques: Array.isArray(guardado.bloques) ? guardado.bloques : [],
        }
      })
      setDisponibilidad(merged)
    } else {
      setDisponibilidad(disponibilidadDefault)
    }
  }

  function actualizarDia(dia: number, campo: 'activo', valor: any) {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === dia ? { ...d, [campo]: valor } : d
    ))
  }

  function agregarBloque(dia: number) {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === dia ? { ...d, bloques: [...d.bloques, bloqueVacio()] } : d
    ))
  }

  function quitarBloque(dia: number, index: number) {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === dia ? { ...d, bloques: d.bloques.filter((_, i) => i !== index) } : d
    ))
  }

  function actualizarBloque(dia: number, index: number, campo: keyof Bloque, valor: any) {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === dia
        ? { ...d, bloques: d.bloques.map((b, i) => i === index ? { ...b, [campo]: valor } : b) }
        : d
    ))
  }

  async function guardar() {
    setGuardando(true)
    setMensaje('')
    for (const d of disponibilidad) {
      const payload = {
        user_id: userId,
        dia_semana: d.dia_semana,
        activo: d.activo,
        bloques: d.bloques,
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

  const campo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }
  const labelCampo: React.CSSProperties = { fontSize: '11px', color: '#6B7280' }
  const inputHora: React.CSSProperties = { border: '1px solid #e3dfd6', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }
  const selectDuracion: React.CSSProperties = { border: '1px solid #e3dfd6', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }
  const btnQuitar: React.CSSProperties = { fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', whiteSpace: 'nowrap' }

  return (
    <div style={card}>
      <style>{`
        .disp-fila-bloque {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 8px;
          align-items: end;
          margin-bottom: 10px;
        }
        @media (max-width: 480px) {
          .disp-fila-bloque {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "desde hasta"
              "duracion quitar";
            row-gap: 8px;
            border-bottom: 1px dashed #e3dfd6;
            padding-bottom: 10px;
          }
          .disp-campo-desde { grid-area: desde; }
          .disp-campo-hasta { grid-area: hasta; }
          .disp-campo-duracion { grid-area: duracion; }
          .disp-btn-quitar { grid-area: quitar; justify-self: end; align-self: center; }
        }
      `}</style>
      <h2 style={{ color: '#161616', marginTop: 0 }}>Días y horarios de atención</h2>
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
        Configurá los días y horarios en los que atendés. Podés agregar tantos bloques como necesites por día (por ejemplo, para horario cortado con receso al mediodía).
      </p>
      {disponibilidad.map((d) => (
        <div key={d.dia_semana} style={{
          border: `1px solid ${d.activo ? '#ba9a7d' : '#e3dfd6'}`,
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '10px',
          backgroundColor: d.activo ? '#fdf9f5' : '#f9f9f9',
          opacity: d.activo ? 1 : 0.6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: d.activo ? '12px' : '0' }}>
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
            {!d.activo && (
              <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No atiende</span>
            )}
          </div>

          {d.activo && (
            <div>
              {d.bloques.map((b, i) => (
                <div key={i} className="disp-fila-bloque">
                  <div className="disp-campo-desde" style={campo}>
                    <label style={labelCampo}>Desde</label>
                    <input type="time" value={b.inicio}
                      onChange={e => actualizarBloque(d.dia_semana, i, 'inicio', e.target.value)}
                      style={inputHora} />
                  </div>
                  <div className="disp-campo-hasta" style={campo}>
                    <label style={labelCampo}>Hasta</label>
                    <input type="time" value={b.fin}
                      onChange={e => actualizarBloque(d.dia_semana, i, 'fin', e.target.value)}
                      style={inputHora} />
                  </div>
                  <div className="disp-campo-duracion" style={campo}>
                    <label style={labelCampo}>Duración turno</label>
                    <select value={b.duracion}
                      onChange={e => actualizarBloque(d.dia_semana, i, 'duracion', Number(e.target.value))}
                      style={selectDuracion}>
                      {DURACIONES.map(dur => <option key={dur} value={dur}>{dur} min</option>)}
                    </select>
                  </div>
                  <button className="disp-btn-quitar" onClick={() => quitarBloque(d.dia_semana, i)} style={btnQuitar}>
                    Quitar
                  </button>
                </div>
              ))}
              <button
                onClick={() => agregarBloque(d.dia_semana)}
                style={{ fontSize: '12px', color: '#ba9a7d', background: 'none', border: '1px dashed #ba9a7d', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', marginTop: '4px' }}>
                + Agregar bloque
              </button>
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button onClick={guardar} disabled={guardando} style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'Guardar disponibilidad'}
        </button>
        {mensaje && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{mensaje}</span>}
      </div>
    </div>
  )
}

type SubTab = 'clientes' | 'servicios' | 'reservas' | 'horarios' | 'cuenta'

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

  const [subTab, setSubTab] = useState<SubTab>('clientes')

  const [clienteAbierto, setClienteAbierto] = useState<string | null>(null)
  const [archivos, setArchivos] = useState<Record<string, any[]>>({})
  const [notaTexto, setNotaTexto] = useState<Record<string, string>>({})
  const [archivoFile, setArchivoFile] = useState<Record<string, File | null>>({})
  const [cargando, setCargando] = useState<string | null>(null)
  const [editandoCliente, setEditandoCliente] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [busquedaClientes, setBusquedaClientes] = useState('')
  const [editandoServicio, setEditandoServicio] = useState<string | null>(null)
  const [editServicioNombre, setEditServicioNombre] = useState('')
  const [editServicioDuracion, setEditServicioDuracion] = useState(60)
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState('')
  const [nuevoServicioPorcentajeSenia, setNuevoServicioPorcentajeSenia] = useState('')
  const [editServicioPrecio, setEditServicioPrecio] = useState('')
  const [editServicioPorcentajeSenia, setEditServicioPorcentajeSenia] = useState('')
  const [errorTelefono, setErrorTelefono] = useState('')
  const [errorEditTelefono, setErrorEditTelefono] = useState('')
  const [requiereSenia, setRequiereSenia] = useState(false)
  const [aliasTransferencia, setAliasTransferencia] = useState('')
  const [titularCuenta, setTitularCuenta] = useState('')
  const [banco, setBanco] = useState('')
  const [whatsappProfesional, setWhatsappProfesional] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [mensajeConfig, setMensajeConfig] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

useEffect(() => { cargarConfigNegocio() }, [userId])

async function cargarConfigNegocio() {
  const { data } = await supabase.from('configuracion_negocio').select('*').eq('user_id', userId).maybeSingle()
  if (data) {
    setRequiereSenia(data.requiere_senia ?? false)
    setAliasTransferencia(data.alias_transferencia ?? '')
    setTitularCuenta(data.titular_cuenta ?? '')
    setBanco(data.banco ?? '')
    setWhatsappProfesional(data.whatsapp_profesional ?? '')
    setNombreNegocio(data.nombre_negocio ?? '')
    setLogoUrl(data.logo_url ?? '')
  }
}

async function guardarConfigNegocio() {
  setGuardandoConfig(true)
  setMensajeConfig('')
  await supabase.from('configuracion_negocio').upsert({
  user_id: userId,
  requiere_senia: requiereSenia,
  alias_transferencia: aliasTransferencia,
  titular_cuenta: titularCuenta,
  banco: banco,
  whatsapp_profesional: whatsappProfesional,
  updated_at: new Date().toISOString(),
}, { onConflict: 'user_id' })
  setGuardandoConfig(false)
  setMensajeConfig('¡Configuración guardada!')
  setTimeout(() => setMensajeConfig(''), 3000)
}

  async function cargarArchivos(clienteId: string) {
    const { data } = await supabase.from('archivos_clientes').select('*').eq('cliente_id', clienteId).eq('user_id', userId).order('created_at', { ascending: false })
    setArchivos(prev => ({ ...prev, [clienteId]: data || [] }))
  }

  async function toggleCliente(clienteId: string) {
    if (clienteAbierto === clienteId) { setClienteAbierto(null) }
    else { setClienteAbierto(clienteId); cargarArchivos(clienteId) }
  }

  async function guardarEdicionCliente(id: string) {
    if (editWhatsapp && !editWhatsapp.startsWith('+')) {
      setErrorEditTelefono('Revisá el teléfono, el formato no parece válido.')
      return
    }
    setErrorEditTelefono('')
    await supabase.from('clientes').update({ nombre: editNombre, whatsapp: editWhatsapp }).eq('id', id)
    setEditandoCliente(null)
    cargarClientes(userId)
  }

  async function iniciarEdicionServicio(s: any) {
  setEditandoServicio(s.id)
  setEditServicioNombre(s.nombre)
  setEditServicioDuracion(s.duracion ?? 60)
  setEditServicioPrecio(s.precio != null ? String(s.precio) : '')
  setEditServicioPorcentajeSenia(s.porcentaje_senia != null ? String(s.porcentaje_senia) : '')
}

async function guardarEdicionServicio(id: string) {
  await supabase.from('servicios').update({
    nombre: editServicioNombre,
    duracion: editServicioDuracion,
    precio: editServicioPrecio ? Number(editServicioPrecio) : null,
    porcentaje_senia: editServicioPorcentajeSenia ? Number(editServicioPorcentajeSenia) : null,
  }).eq('id', id)
  setEditandoServicio(null)
  cargarServicios(userId)
}

  async function subirArchivo(clienteId: string) {
    const file = archivoFile[clienteId]
    if (!file) return
    setCargando(clienteId)
    const nombreLimpio = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '')
    const nombreArchivo = `${userId}/${clienteId}/${Date.now()}_${nombreLimpio}`
    const { error: uploadError } = await supabase.storage.from('archivos-clientes').upload(nombreArchivo, file)
    if (uploadError) { alert('Error al subir: ' + uploadError.message); setCargando(null); return }
    const { data: urlData } = supabase.storage.from('archivos-clientes').getPublicUrl(nombreArchivo)
    await supabase.from('archivos_clientes').insert([{ cliente_id: clienteId, nombre: file.name, url: urlData.publicUrl, tipo: 'pdf', user_id: userId }])
    setArchivoFile(prev => ({ ...prev, [clienteId]: null }))
    setCargando(null)
    cargarArchivos(clienteId)
    alert('Archivo subido!')
  }

  async function guardarNota(clienteId: string) {
    const texto = notaTexto[clienteId]
    if (!texto?.trim()) return
    await supabase.from('archivos_clientes').insert([{ cliente_id: clienteId, nombre: 'Nota', contenido: texto, tipo: 'nota', user_id: userId }])
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
    if (!telefono || !telefono.startsWith('+')) {
      setErrorTelefono('Elegí el país y completá el teléfono correctamente.')
      return
    }
    setErrorTelefono('')
    await supabase.from('clientes').insert([{ nombre, whatsapp: telefono, user_id: userId }])
    setNombre('')
    setTelefono('')
    cargarClientes(userId)
  }

  async function agregarServicio() {
  await supabase.from('servicios').insert([{
    nombre: nuevoServicioNombre,
    duracion: nuevoServicioDuracion,
    precio: nuevoServicioPrecio ? Number(nuevoServicioPrecio) : null,
    porcentaje_senia: nuevoServicioPorcentajeSenia ? Number(nuevoServicioPorcentajeSenia) : null,
    user_id: userId
  }])
  setNuevoServicioNombre('')
  setNuevoServicioDuracion(60)
  setNuevoServicioPrecio('')
  setNuevoServicioPorcentajeSenia('')
  cargarServicios(userId)
}

  const inp: React.CSSProperties = {
    padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6',
    marginRight: '8px', marginBottom: '8px', fontFamily: 'Arial', width: '220px'
  }

  const phoneWrapper: React.CSSProperties = {
    border: '1px solid #e3dfd6',
    borderRadius: '8px',
    padding: '10px',
    marginRight: '8px',
    marginBottom: '8px',
    fontFamily: 'Arial',
    width: '240px',
    display: 'inline-flex',
    boxSizing: 'border-box',
  }

  const subTabBtn = (activa: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: activa ? '1px solid #ba9a7d' : '1px solid #e3dfd6',
    backgroundColor: activa ? '#ba9a7d' : '#fff',
    color: activa ? '#fff' : '#6B7280',
    fontFamily: 'Arial',
    fontSize: '13px',
    fontWeight: activa ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  const subTabs: { key: SubTab, label: string }[] = [
    { key: 'clientes', label: '👥 Clientes' },
    { key: 'servicios', label: '💇 Servicios' },
    { key: 'reservas', label: '💰 Reservas Online' },
    { key: 'horarios', label: '🕒 Horarios' },
    { key: 'cuenta', label: '🔒 Cuenta' },
  ]

  return (
    <>
      <style>{`
        .PhoneInputInput {
          border: none;
          outline: none;
          font-family: Arial;
          font-size: 14px;
          width: 100%;
          background: transparent;
        }
      `}</style>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', overflowX: 'auto' }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={subTabBtn(subTab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'clientes' && (
        <>
          <div style={card}>
            <h2 style={{ color: '#161616', marginTop: 0 }}>Agregar Cliente</h2>
            <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={input} />
            <div style={phoneWrapper}>
              <PhoneInput
                international
                defaultCountry="AR"
                placeholder="Teléfono del cliente"
                value={telefono}
                onChange={(v: string | undefined) => setTelefono(v || '')}
              />
            </div>
            {errorTelefono && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 8px' }}>{errorTelefono}</p>}
            <button onClick={agregarCliente} style={btnPrimary}>Agregar Cliente</button>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: '#161616', margin: 0 }}>Clientes ({clientes.length})</h2>
              <button onClick={() => setMostrarClientes(!mostrarClientes)} style={btnSecondary}>
                {mostrarClientes ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            {mostrarClientes && (
              <div>
                <input placeholder="Buscar cliente..." value={busquedaClientes} onChange={e => setBusquedaClientes(e.target.value)} style={input} />
                {clientes.filter(c => c.nombre.toLowerCase().includes(busquedaClientes.toLowerCase())).map(c => (
                  <div key={c.id} style={{ borderRadius: '10px', border: '1px solid #e3dfd6', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f9f7f4' }}>
                      <span style={{ fontWeight: 'bold', color: '#161616', fontSize: '15px' }}>{c.nombre}</span>
                      <button onClick={() => toggleCliente(c.id)}
                        style={{ backgroundColor: '#ba9a7d', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'Arial', fontSize: '13px' }}>
                        {clienteAbierto === c.id ? 'Cerrar' : 'Ver'}
                      </button>
                    </div>
                    {clienteAbierto === c.id && (
                      <div style={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #e3dfd6' }}>
                        {editandoCliente === c.id ? (
                          <div style={{ marginBottom: '16px' }}>
                            <input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre" style={{ ...input, marginBottom: '8px' }} />
                            <div style={{ ...phoneWrapper, display: 'flex' }}>
                              <PhoneInput
                                international
                                defaultCountry="AR"
                                placeholder="Teléfono del cliente"
                                value={editWhatsapp}
                                onChange={(v: string | undefined) => setEditWhatsapp(v || '')}
                              />
                            </div>
                            {errorEditTelefono && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 8px' }}>{errorEditTelefono}</p>}
                             <input type="number" placeholder="Precio" value={editServicioPrecio} onChange={e => setEditServicioPrecio(e.target.value)}
  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px', width: '110px' }} />
<input type="number" placeholder="% seña" min={0} max={100} value={editServicioPorcentajeSenia} onChange={e => setEditServicioPorcentajeSenia(e.target.value)}
  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px', width: '90px' }} />
                            <button onClick={() => guardarEdicionCliente(c.id)} style={{ ...btnPrimary, marginRight: '8px', fontSize: '13px', padding: '6px 14px' }}>Guardar</button>
                            <button onClick={() => setEditandoCliente(null)} style={{ ...btnSecondary, fontSize: '13px', padding: '6px 14px' }}>Cancelar</button>
                          </div>
                        ) : (
                          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: '0 0 4px', color: '#161616' }}>💬 {c.whatsapp || 'Sin WhatsApp'}</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => { setEditandoCliente(c.id); setEditNombre(c.nombre); setEditWhatsapp(c.whatsapp || '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Editar</button>
                              <button onClick={() => eliminarCliente(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                            </div>
                          </div>
                        )}
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>📎 Subir PDF</p>
                          <input type="file" accept=".pdf" onChange={e => setArchivoFile(prev => ({ ...prev, [c.id]: e.target.files?.[0] || null }))} style={{ marginBottom: '8px', display: 'block' }} />
                          <button onClick={() => subirArchivo(c.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px' }} disabled={cargando === c.id}>
                            {cargando === c.id ? 'Subiendo...' : 'Subir PDF'}
                          </button>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ color: '#161616', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>📝 Agregar Nota</p>
                          <textarea placeholder="Escribí una nota..." value={notaTexto[c.id] || ''} onChange={e => setNotaTexto(prev => ({ ...prev, [c.id]: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6', fontFamily: 'Arial', height: '70px', resize: 'vertical', boxSizing: 'border-box' }} />
                          <button onClick={() => guardarNota(c.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px', marginTop: '6px' }}>Guardar Nota</button>
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
        </>
      )}

      {subTab === 'servicios' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ color: '#161616', margin: 0 }}>Servicios ({servicios.length})</h2>
            <button onClick={() => setMostrarServicios(!mostrarServicios)} style={btnSecondary}>
              {mostrarServicios ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
  <input placeholder="Nombre (ej: Masaje relajante)" value={nuevoServicioNombre} onChange={e => setNuevoServicioNombre(e.target.value)} style={input} />
  <select value={nuevoServicioDuracion} onChange={e => setNuevoServicioDuracion(Number(e.target.value))}
    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px' }}>
    <option value={15}>15 min</option>
    <option value={30}>30 min</option>
    <option value={45}>45 min</option>
    <option value={60}>60 min</option>
    <option value={75}>75 min</option>
    <option value={90}>90 min</option>
    <option value={120}>120 min</option>
  </select>
  <input type="number" placeholder="Precio (opcional)" value={nuevoServicioPrecio} onChange={e => setNuevoServicioPrecio(e.target.value)} style={{ ...input, width: '160px' }} />
  <input type="number" placeholder="% seña (opcional)" min={0} max={100} value={nuevoServicioPorcentajeSenia} onChange={e => setNuevoServicioPorcentajeSenia(e.target.value)} style={{ ...input, width: '160px' }} />
</div>
          <button onClick={agregarServicio} style={btnPrimary}>Agregar Servicio</button>
          {mostrarServicios && (
            <ul style={{ marginTop: '16px', paddingLeft: 0, listStyle: 'none' }}>
              {servicios.map(s => (
                <li key={s.id} style={{ marginBottom: '10px', padding: '10px 14px', border: '1px solid #e3dfd6', borderRadius: '8px', backgroundColor: '#fdf9f5' }}>
                  {editandoServicio === s.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <input value={editServicioNombre} onChange={e => setEditServicioNombre(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px', width: '180px' }} />
                      <select value={editServicioDuracion} onChange={e => setEditServicioDuracion(Number(e.target.value))}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e3dfd6', fontFamily: 'Arial', fontSize: '14px' }}>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={75}>75 min</option>
                        <option value={90}>90 min</option>
                        <option value={120}>120 min</option>
                      </select>
                      <button onClick={() => guardarEdicionServicio(s.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: '13px' }}>Guardar</button>
                      <button onClick={() => setEditandoServicio(null)} style={{ ...btnSecondary, marginLeft: 0, padding: '6px 14px', fontSize: '13px' }}>Cancelar</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#161616', fontSize: '14px' }}>
  {s.nombre}
  <span style={{ color: '#6B7280', fontSize: '13px', marginLeft: '8px' }}>· {s.duracion ?? 60} min</span>
  {s.precio != null && <span style={{ color: '#6B7280', fontSize: '13px', marginLeft: '8px' }}>· ${s.precio}</span>}
  {s.porcentaje_senia != null && <span style={{ color: '#ba9a7d', fontSize: '13px', marginLeft: '8px' }}>· Seña {s.porcentaje_senia}%</span>}
</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => iniciarEdicionServicio(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Editar</button>
                        <button onClick={() => eliminarServicio(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {subTab === 'reservas' && (
        <>
          <div style={card}>
  <h2 style={{ color: '#161616', marginTop: 0 }}>💰 Seña para reservas online</h2>
  <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
    Si la activás, tus clientes van a tener que transferir la seña para confirmar el turno desde tu agenda pública.
  </p>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: requiereSenia ? '16px' : 0 }}>
    <div onClick={() => setRequiereSenia(!requiereSenia)} style={{
      width: '36px', height: '20px', borderRadius: '10px',
      backgroundColor: requiereSenia ? '#ba9a7d' : '#CBD5E0',
      cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background-color 0.2s'
    }}>
      <div style={{
        position: 'absolute', top: '3px', left: requiereSenia ? '18px' : '3px',
        width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s'
      }} />
    </div>
    <span style={{ fontWeight: 600, fontSize: '14px', color: '#161616' }}>
      {requiereSenia ? 'Seña activada' : 'Seña desactivada'}
    </span>
  </div>
  {requiereSenia && (
    <div>
      <input placeholder="Alias o CBU para transferir" value={aliasTransferencia} onChange={e => setAliasTransferencia(e.target.value)} style={{ ...input, width: '100%', maxWidth: '400px', boxSizing: 'border-box' }} />
      <input placeholder="Titular de la cuenta" value={titularCuenta} onChange={e => setTitularCuenta(e.target.value)} style={{ ...input, width: '100%', maxWidth: '400px', boxSizing: 'border-box' }} />
      <input placeholder="Banco o billetera (ej: Mercado Pago)" value={banco} onChange={e => setBanco(e.target.value)} style={{ ...input, width: '100%', maxWidth: '400px', boxSizing: 'border-box' }} />
      <input placeholder="Tu WhatsApp (para que te lleguen los comprobantes) - ej: 3492123456" value={whatsappProfesional} onChange={e => setWhatsappProfesional(e.target.value)} style={{ ...input, width: '100%', maxWidth: '400px', boxSizing: 'border-box' }} />
      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '-4px', marginBottom: '12px' }}>
        Ojo: para que se calcule el monto, cada servicio necesita tener cargado el % de seña arriba, en Servicios.
      </p>
    </div>
  )}
  <button onClick={guardarConfigNegocio} disabled={guardandoConfig} style={{ ...btnPrimary, opacity: guardandoConfig ? 0.7 : 1 }}>
    {guardandoConfig ? 'Guardando...' : 'Guardar configuración'}
  </button>
  {mensajeConfig && <span style={{ marginLeft: '12px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{mensajeConfig}</span>}
</div>

          <div style={card}>
            <h2 style={{ color: '#161616', marginTop: 0 }}>🔗 Mi link de agenda</h2>
            <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '12px' }}>
              Compartí este link con tus clientes para que puedan reservar su turno online.
            </p>
            <div style={{ backgroundColor: '#f9f7f4', border: '1px solid #e3dfd6', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', wordBreak: 'break-all', fontSize: '13px', color: '#161616' }}>
              {`https://ribelgestion.com/agenda-publica?u=${userId}`}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`https://ribelgestion.com/agenda-publica?u=${userId}`); alert('¡Link copiado!') }}
              style={{ ...btnPrimary, width: 'auto', padding: '8px 20px', fontSize: '13px' }}>
              📋 Copiar link
            </button>
          </div>
        </>
      )}

      {subTab === 'horarios' && (
        <SeccionDisponibilidad userId={userId} card={card} btnPrimary={btnPrimary} btnSecondary={btnSecondary} />
      )}

      {subTab === 'cuenta' && (
        <>
          <MiNegocio
            userId={userId}
            nombreNegocio={nombreNegocio}
            setNombreNegocio={setNombreNegocio}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            card={card}
            input={input}
            btnPrimary={btnPrimary}
          />
          <div style={card}>
            <CambiarPassword btnPrimary={btnPrimary} inp={inp} />
          </div>
        </>
      )}
    </>
  )
}