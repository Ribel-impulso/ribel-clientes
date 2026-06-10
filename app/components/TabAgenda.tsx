'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

interface Sesion {
  id: string;
  cliente_id: string;
  fecha: string;
  horario: string | null;
  duracion: number | null;
  tipo_masaje: string | null;
  monto: number | null;
  forma_pago: string | null;
  notas_clinicas: string | null;
  user_id: string | null;
  facturado: boolean;
  monto2: number | null;
  forma_pago2: string | null;
  cobrado: boolean | null;
  forma_pago_cob: string | null;
  fecha_cobro: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function TabAgenda({ userId }: { userId?: string }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(hoy.toISOString().split('T')[0]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionEditando, setSesionEditando] = useState<Partial<Sesion>>({});
  const [modoEdicion, setModoEdicion] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  useEffect(() => {
    const cargarClientes = async () => {
      const { data } = await supabase.from('clientes').select('id, nombre').order('nombre');
      if (data) setClientes(data);
      const { data: dataServicios } = await supabase.from('servicios').select('id, nombre').order('nombre');
if (dataServicios) setServicios(dataServicios);
    };
    cargarClientes();
  }, []);

  useEffect(() => {
    const cargarSesiones = async () => {
      setCargando(true);
      const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anio, mes + 1, 0);
      const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}}`;
      const { data } = await supabase.from('sesiones').select('*').gte('fecha', primerDia).lte('fecha', ultimoDiaStr).order('horario', { ascending: true });
      if (data) setSesiones(data);
      setCargando(false);
    };
    cargarSesiones();
  }, [anio, mes]);

  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [...Array(primerDiaMes).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const fechaStr = (dia: number) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const sesionesDelDia = (dia: number) => sesiones.filter((s) => s.fecha === fechaStr(dia));
  const sesionesSeleccionadas = diaSeleccionado ? sesiones.filter((s) => s.fecha === diaSeleccionado) : [];
  const hoyStr = hoy.toISOString().split('T')[0];
  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? 'Desconocido';

  const abrirNuevo = () => {
    setSesionEditando({ fecha: diaSeleccionado ?? '', user_id: userId, facturado: false, cobrado: false });
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirEdicion = (sesion: Sesion) => {
    setSesionEditando({ ...sesion });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const recargar = async () => {
    const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anio, mes + 1, 0);
    const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
    const { data } = await supabase.from('sesiones').select('*').gte('fecha', primerDia).lte('fecha', ultimoDiaStr).order('horario', { ascending: true });
    if (data) setSesiones(data);
  };

  const guardar = async () => {
    if (!sesionEditando.cliente_id || !sesionEditando.fecha) return;
    if (modoEdicion && sesionEditando.id) {
      const { id, ...datos } = sesionEditando;
      await supabase.from('sesiones').update(datos).eq('id', id);
    } else {
      const { id, ...datos } = sesionEditando;
      await supabase.from('sesiones').insert({ ...datos, user_id: userId });
    }
    setModalAbierto(false);
    await recargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return;
    await supabase.from('sesiones').delete().eq('id', id);
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  };

  const cambiarMes = (delta: number) => {
    const nueva = new Date(anio, mes + delta, 1);
    setAnio(nueva.getFullYear());
    setMes(nueva.getMonth());
    setDiaSeleccionado(null);
  };

  const labelFecha = diaSeleccionado
    ? new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
    return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#F7F8FA', minHeight: '100%', padding: '16px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => cambiarMes(-1)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px' }}>‹</button>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#2D3748' }}>{MESES[mes]} {anio}</span>
        <button onClick={() => cambiarMes(1)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px' }}>›</button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#4F46E5' }}>
          {DIAS_SEMANA.map((d) => (
            <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: 600, color: '#fff' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#E2E8F0' }}>
          {celdas.map((dia, i) => {
            const activo = dia !== null;
            const fecha = activo ? fechaStr(dia!) : '';
            const esHoy = fecha === hoyStr;
            const seleccionado = fecha === diaSeleccionado;
            const tieneTurnos = activo && sesionesDelDia(dia!).length > 0;
            return (
              <div key={i} onClick={() => activo && setDiaSeleccionado(fecha)}
                style={{ backgroundColor: seleccionado ? '#EEF2FF' : esHoy ? '#F0FDF4' : '#fff', minHeight: '64px', padding: '6px', cursor: activo ? 'pointer' : 'default', opacity: activo ? 1 : 0.3 }}>
                {dia && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: esHoy || seleccionado ? 700 : 400, color: seleccionado ? '#fff' : esHoy ? '#16A34A' : '#374151', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: seleccionado ? '#4F46E5' : esHoy ? '#DCFCE7' : 'transparent' }}>
                      {dia}
                    </div>
                    {tieneTurnos && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4F46E5', margin: '2px auto 0' }} />}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {diaSeleccionado && (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', textTransform: 'capitalize' }}>{labelFecha}</span>
            <button onClick={abrirNuevo} style={{ backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Turno</button>
          </div>
          {cargando ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>Cargando...</p>
          ) : sesionesSeleccionadas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>Sin turnos agendados</p>
          ) : (
            sesionesSeleccionadas.map((s) => (
              <div key={s.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#FAFAFA' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>{s.horario ? s.horario.substring(0, 5) : 'Sin hora'}{s.duracion ? ` · ${s.duracion} min` : ''}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', margin: '2px 0' }}>{nombreCliente(s.cliente_id)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.tipo_masaje}{s.monto ? ` · $${s.monto}` : ''}{s.forma_pago ? ` · ${s.forma_pago}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => abrirEdicion(s)} style={{ background: 'none', border: '1px solid #CBD5E0', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => eliminar(s.id)} style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px' }}>{modoEdicion ? 'Editar turno' : 'Nuevo turno'}</div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Cliente *</label>
            <select value={sesionEditando.cliente_id ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, cliente_id: e.target.value })}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Fecha *</label>
                <input type="date" value={sesionEditando.fecha ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, fecha: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Horario</label>
                <input type="time" value={sesionEditando.horario ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, horario: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Duración (min)</label>
                <input type="number" value={sesionEditando.duracion ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, duracion: Number(e.target.value) || null })}
                  placeholder="60" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Tipo de servicio</label>
                <select value={sesionEditando.tipo_masaje ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, tipo_masaje: e.target.value })}
  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }}>
  <option value="">Seleccionar...</option>
  {servicios.map((s: any) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
</select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Monto</label>
                <input type="number" value={sesionEditando.monto ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto: Number(e.target.value) || null })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Forma de pago</label>
                <select value={sesionEditando.forma_pago ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, forma_pago: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cuenta corriente">Cuenta corriente</option>
                  <option value="Obra social">Obra social</option>
                </select>
              </div>
            </div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Notas clínicas</label>
            <textarea value={sesionEditando.notas_clinicas ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, notas_clinicas: e.target.value })}
              placeholder="Observaciones, evolución..."
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAbierto(false)} style={{ border: '1px solid #E2E8F0', background: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardar} style={{ backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                {modoEdicion ? 'Guardar cambios' : 'Agendar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}