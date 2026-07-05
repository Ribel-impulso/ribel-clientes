'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface BloqueoPersonal {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  motivo: string | null
}

interface NotaPersonal {
  id: string
  contenido: string
  created_at: string
}

interface Props {
  userId: string
  card: React.CSSProperties
  btnPrimary: React.CSSProperties
}

export default function TabAgendaPersonal({ userId, card, btnPrimary }: Props) {
  const [bloqueos, setBloqueos] = useState<BloqueoPersonal[]>([])
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [notas, setNotas] = useState<NotaPersonal[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [errorNotas, setErrorNotas] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [textoEdicion, setTextoEdicion] = useState('')

  useEffect(() => { cargarBloqueos(); cargarNotas() }, [userId])

  async function cargarBloqueos() {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('bloqueos_personales')
      .select('id, fecha, hora_inicio, hora_fin, motivo')
      .eq('user_id', userId)
      .gte('fecha', hoy)
      .order('fecha')
      .order('hora_inicio')
    if (data) setBloqueos(data as BloqueoPersonal[])
  }

  async function agregarBloqueo() {
    setError('')
    if (!fecha || !horaInicio || !horaFin) { setError('Completá fecha, desde y hasta'); return }
    if (horaFin <= horaInicio) { setError('El horario "hasta" debe ser posterior al "desde"'); return }
    setGuardando(true)
    const { error: err } = await supabase.from('bloqueos_personales').insert([{
      user_id: userId, fecha, hora_inicio: horaInicio, hora_fin: horaFin, motivo: motivo || null,
    }])
    if (err) { setError('Error al guardar: ' + err.message); setGuardando(false); return }
    setFecha(''); setHoraInicio(''); setHoraFin(''); setMotivo('')
    await cargarBloqueos()
    setGuardando(false)
  }

  async function eliminarBloqueo(id: string) {
    await supabase.from('bloqueos_personales').delete().eq('id', id)
    cargarBloqueos()
  }

  async function cargarNotas() {
    const { data } = await supabase
      .from('notas_personales')
      .select('id, contenido, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setNotas(data as NotaPersonal[])
  }

  async function agregarNota() {
    setErrorNotas('')
    if (!nuevaNota.trim()) { setErrorNotas('Escribí algo antes de guardar'); return }
    setGuardandoNota(true)
    const { error: err } = await supabase.from('notas_personales').insert([{
      user_id: userId, contenido: nuevaNota.trim(),
    }])
    if (err) { setErrorNotas('Error al guardar: ' + err.message); setGuardandoNota(false); return }
    setNuevaNota('')
    await cargarNotas()
    setGuardandoNota(false)
  }

  function iniciarEdicion(nota: NotaPersonal) {
    setEditandoId(nota.id)
    setTextoEdicion(nota.contenido)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setTextoEdicion('')
  }

  async function guardarEdicion(id: string) {
    if (!textoEdicion.trim()) return
    await supabase.from('notas_personales').update({ contenido: textoEdicion.trim() }).eq('id', id)
    setEditandoId(null)
    setTextoEdicion('')
    cargarNotas()
  }

  async function eliminarNota(id: string) {
    await supabase.from('notas_personales').delete().eq('id', id)
    cargarNotas()
  }

  const campo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }
  const labelCampo: React.CSSProperties = { fontSize: '11px', color: '#6B7280' }
  const inputCampo: React.CSSProperties = { border: '1px solid #e3dfd6', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', fontFamily: 'Arial', width: '100%', boxSizing: 'border-box' }
  const textareaCampo: React.CSSProperties = { ...inputCampo, minHeight: '70px', resize: 'vertical', fontFamily: 'Arial' }

  return (
    <>
      <div style={card}>
        <style>{`
          .agp-fila {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 2fr;
            gap: 8px;
            align-items: end;
            margin-bottom: 8px;
          }
          @media (max-width: 640px) {
            .agp-fila {
              grid-template-columns: 1fr 1fr;
              grid-template-areas:
                "fecha fecha"
                "desde hasta"
                "motivo motivo";
              row-gap: 8px;
            }
            .agp-campo-fecha { grid-area: fecha; }
            .agp-campo-desde { grid-area: desde; }
            .agp-campo-hasta { grid-area: hasta; }
            .agp-campo-motivo { grid-area: motivo; }
          }
        `}</style>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Bloqueos personales</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Reservá horarios para trámites, turnos o compromisos personales. Estos bloqueos ocupan el horario en tu agenda, pero nunca se muestran ni se explican en la agenda pública de tus clientes: simplemente aparecen como no disponibles.
        </p>
        <div className="agp-fila">
          <div className="agp-campo-fecha" style={campo}>
            <label style={labelCampo}>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputCampo} />
          </div>
          <div className="agp-campo-desde" style={campo}>
            <label style={labelCampo}>Hora desde</label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputCampo} />
          </div>
          <div className="agp-campo-hasta" style={campo}>
            <label style={labelCampo}>Hora hasta</label>
            <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} style={inputCampo} />
          </div>
          <div className="agp-campo-motivo" style={campo}>
            <label style={labelCampo}>Motivo (opcional, solo vos lo ves)</label>
            <input type="text" placeholder="Ej: turno médico" value={motivo} onChange={e => setMotivo(e.target.value)} style={inputCampo} />
          </div>
        </div>
        {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 8px' }}>{error}</p>}
        <button onClick={agregarBloqueo} disabled={guardando} style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1, marginTop: '8px' }}>
          {guardando ? 'Guardando...' : 'Agregar bloqueo'}
        </button>

        {bloqueos.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {bloqueos.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e3dfd6', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', backgroundColor: '#fdf9f5' }}>
                <div style={{ fontSize: '13px', color: '#161616' }}>
                  <strong>{new Date(b.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                  {' · '}{b.hora_inicio.substring(0, 5)} a {b.hora_fin.substring(0, 5)}
                  {b.motivo && <span style={{ color: '#6B7280' }}> · {b.motivo}</span>}
                </div>
                <button onClick={() => eliminarBloqueo(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: '16px' }}>
        <h2 style={{ color: '#161616', marginTop: 0 }}>Notas</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Notas privadas para vos: recordatorios, pendientes o lo que necesites anotar.
        </p>
        <textarea
          placeholder="Escribí una nota..."
          value={nuevaNota}
          onChange={e => setNuevaNota(e.target.value)}
          style={textareaCampo}
        />
        {errorNotas && <p style={{ color: '#c0392b', fontSize: '13px', margin: '8px 0 0' }}>{errorNotas}</p>}
        <button onClick={agregarNota} disabled={guardandoNota} style={{ ...btnPrimary, opacity: guardandoNota ? 0.7 : 1, marginTop: '8px' }}>
          {guardandoNota ? 'Guardando...' : 'Agregar nota'}
        </button>

        {notas.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {notas.map(n => (
              <div key={n.id} style={{ border: '1px solid #e3dfd6', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', backgroundColor: '#fdf9f5' }}>
                {editandoId === n.id ? (
                  <>
                    <textarea
                      value={textoEdicion}
                      onChange={e => setTextoEdicion(e.target.value)}
                      style={textareaCampo}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button onClick={() => guardarEdicion(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#161616', fontSize: '13px', fontWeight: 600 }}>Guardar</button>
                      <button onClick={cancelarEdicion} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '13px' }}>Cancelar</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#161616', whiteSpace: 'pre-wrap' }}>{n.contenido}</div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <button onClick={() => iniciarEdicion(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Editar</button>
                      <button onClick={() => eliminarNota(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba9a7d', fontSize: '13px' }}>Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}