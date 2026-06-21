'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = 'maribelefontana@gmail.com'

interface Suscripcion {
  user_id: string
  plan: string
  estado: string
  fecha_inicio: string
  fecha_vencimiento: string
}

export default function AdminPage() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        window.location.href = '/'
        return
      }
      setAcceso(true)

      const { data: subs } = await supabase
        .from('suscripciones')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      setSuscripciones(subs || [])
      setCargando(false)
    })
  }, [])

  function diasRestantes(fechaVencimiento: string) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vence = new Date(fechaVencimiento + 'T00:00:00')
    const diff = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  function colorEstado(estado: string, dias: number) {
    if (dias < 0) return '#c0392b'
    if (estado === 'activa' && dias <= 5) return '#e67e22'
    if (estado === 'activa') return '#27ae60'
    return '#9e9e9e'
  }

  if (!acceso) return null

  return (
    <main style={{ padding: '32px', fontFamily: 'Arial', backgroundColor: '#e3dfd6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#161616', margin: 0 }}>Panel Admin</h1>
          <a href="/" style={{ color: '#ba9a7d', fontSize: '14px' }}>← Volver a la app</a>
        </div>

        {cargando ? (
          <p style={{ color: '#161616' }}>Cargando...</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px', flex: 1, minWidth: '150px' }}>
                <p style={{ margin: 0, color: '#9e9e9e', fontSize: '13px' }}>Total usuarios</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#161616' }}>{suscripciones.length}</p>
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px', flex: 1, minWidth: '150px' }}>
                <p style={{ margin: 0, color: '#9e9e9e', fontSize: '13px' }}>Activas</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                  {suscripciones.filter(s => s.estado === 'activa' && diasRestantes(s.fecha_vencimiento) >= 0).length}
                </p>
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px', flex: 1, minWidth: '150px' }}>
                <p style={{ margin: 0, color: '#9e9e9e', fontSize: '13px' }}>Vencidas</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#c0392b' }}>
                  {suscripciones.filter(s => diasRestantes(s.fecha_vencimiento) < 0).length}
                </p>
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px', flex: 1, minWidth: '150px' }}>
                <p style={{ margin: 0, color: '#9e9e9e', fontSize: '13px' }}>En prueba</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#ba9a7d' }}>
                  {suscripciones.filter(s => s.plan === 'prueba' && diasRestantes(s.fecha_vencimiento) >= 0).length}
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e3dfd6' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>User ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>Plan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>Inicio</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>Vencimiento</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#161616', fontSize: '13px' }}>Días restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {suscripciones.map((s, i) => {
                    const dias = diasRestantes(s.fecha_vencimiento)
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #e3dfd6', backgroundColor: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#9e9e9e' }}>{s.user_id.slice(0, 8)}...</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#161616', textTransform: 'capitalize' }}>{s.plan}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            backgroundColor: colorEstado(s.estado, dias) + '20',
                            color: colorEstado(s.estado, dias),
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {dias < 0 ? 'Vencida' : s.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#161616' }}>{s.fecha_inicio}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#161616' }}>{s.fecha_vencimiento}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 'bold', color: colorEstado(s.estado, dias) }}>
                          {dias < 0 ? 'Vencida' : `${dias} días`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}