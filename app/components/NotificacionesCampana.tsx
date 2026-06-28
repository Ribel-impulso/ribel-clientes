'use client'

import { useEffect, useState } from 'react'
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
}

const playNotificationSound = () => {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.value = 880
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.8)
}

export default function NotificacionesCampana({ onVerTurno }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [abierto, setAbierto] = useState(false)

  const noLeidas = notificaciones.filter(n => !n.leida).length

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
        async (payload: RealtimePayload) => {
          const { data } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setNotificaciones(prev => [data, ...prev])
            playNotificationSound()
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

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
            {notificaciones.length === 0 ? (
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