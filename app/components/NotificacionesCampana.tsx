'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
  sesion_id?: string | null
  fecha_sesion?: string | null
}

interface RealtimePayload {
  new: Notificacion
}

interface Props {
  onVerTurno?: (sesionId: string, fecha: string) => void
  userId: string
}

export default function NotificacionesCampana({ onVerTurno, userId }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [abierto, setAbierto] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [cumpleanosHoy, setCumpleanosHoy] = useState<{ id: string; nombre: string; whatsapp: string | null }[]>([])

  const noLeidas = notificaciones.filter(n => !n.leida).length + cumpleanosHoy.length

  // Precargar y desbloquear el audio con el primer toque
  useEffect(() => {
    const audio = new Audio('/sounds/notificacion.wav')
    audio.preload = 'auto'
    audioRef.current = audio

    const unlock = () => {
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
      }).catch(() => {})
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click', unlock)
    }

    document.addEventListener('touchstart', unlock)
    document.addEventListener('click', unlock)

    return () => {
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click', unlock)
    }
  }, [])

  const playNotificationSound = () => {
  console.log('Intentando reproducir. audioRef:', audioRef.current)
  if (audioRef.current) {
    audioRef.current.currentTime = 0
    audioRef.current.play()
      .then(() => console.log('Sonó OK'))
      .catch((err) => console.log('ERROR AUDIO:', err.name, err.message))
  }
}

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setNotificaciones(data)
    }
    cargar()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('notificaciones-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload: RealtimePayload) => {
          // Usamos directamente lo que trae el evento (payload.new),
          // sin volver a consultar la base de datos. Esto evita el error
          // 406 que aparecía por el .single() y hacía que el sonido
          // nunca se disparara.
          const data = payload.new
          if (data) {
            setNotificaciones(prev => [data, ...prev])
            playNotificationSound()
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!userId) return
    const cargarCumpleanos = async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre, whatsapp, fecha_nacimiento')
        .eq('user_id', userId)
        .not('fecha_nacimiento', 'is', null)
      if (!data) return
      const hoy = new Date()
      const mesHoy = hoy.getMonth() + 1
      const diaHoy = hoy.getDate()
      const deHoy = data.filter((c: any) => {
        const [, mes, dia] = c.fecha_nacimiento.split('-').map(Number)
        return mes === mesHoy && dia === diaHoy
      })
      setCumpleanosHoy(deHoy)
    }
    cargarCumpleanos()
  }, [userId])

  const abrirPanel = async () => {
    setAbierto(!abierto)
    if (!abierto && noLeidas > 0) {
      await supabase.from('notificaciones').update({ leida: true }).eq('leida', false)
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    }
  }

  const handleClickNotificacion = (n: Notificacion) => {
    if (n.sesion_id && n.fecha_sesion && onVerTurno) {
      onVerTurno(n.sesion_id, n.fecha_sesion)
      setAbierto(false)
    }
  }

  function limpiarWA(numero: string) {
    return numero.replace(/\D/g, '')
  }

  function saludarCumpleanos(c: { nombre: string; whatsapp: string | null }) {
    if (!c.whatsapp) { alert('Este cliente no tiene WhatsApp cargado.'); return }
    const numero = limpiarWA(c.whatsapp)
    const msg = `¡Feliz cumpleaños, ${c.nombre}! 🎉 Te deseamos un muy lindo día.`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="relative">
      <button onClick={abrirPanel} className="relative p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed left-2 right-2 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50" style={{ top: '60px' }}>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {cumpleanosHoy.map(c => (
              <div key={`cumple-${c.id}`} className="p-4 border-b border-gray-50" style={{ backgroundColor: '#FDF3E7' }}>
                <p className="text-sm font-medium" style={{ color: '#A87F4C' }}>🎂 ¡Hoy es el cumpleaños de {c.nombre}!</p>
                <button
                  onClick={() => saludarCumpleanos(c)}
                  style={{ marginTop: '8px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enviar saludo por WhatsApp
                </button>
              </div>
            ))}
            {notificaciones.length === 0 && cumpleanosHoy.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">Sin notificaciones</p>
            ) : (
              notificaciones.map(n => {
                const esTurno = !!n.sesion_id && !!n.fecha_sesion
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotificacion(n)}
                    className={`p-4 border-b border-gray-50 ${!n.leida ? 'bg-orange-50' : ''} ${esTurno ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.titulo}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{n.mensaje}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {esTurno && (
                        <span style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginTop: '2px' }}>
                          Ver turno →
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}