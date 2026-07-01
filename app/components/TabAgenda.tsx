'use client';

import { useState, useEffect } from 'react';
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
  forma_pago_cobro: string | null;
  fecha_cobro: string | null;
  monto_senia: number | null;
  fecha_senia: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
  whatsapp?: string | null;
}

interface Bloque {
  inicio: string;
  fin: string;
  duracion: number;
}

interface Disponibilidad {
  id?: string;
  dia_semana: number;
  activo: boolean;
  bloques: Bloque[];
}

interface BloqueoPersonal {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string | null;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatearFechaLegible(fechaISO: string): string {
  const fecha = new Date(fechaISO + 'T12:00:00');
  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function limpiarWhatsapp(numero: string): string {
  const numeroLimpio = numero.trim();
  // Si ya viene en formato internacional (+54911..., +598..., etc), solo sacamos el +
  if (numeroLimpio.startsWith('+')) {
    return numeroLimpio.replace(/\D/g, '');
  }
  // Compatibilidad con clientes viejos guardados sin código de país (asumimos Argentina)
  const soloDigitos = numeroLimpio.replace(/\D/g, '');
  if (soloDigitos.startsWith('54')) return soloDigitos;
  const sinCero = soloDigitos.startsWith('0') ? soloDigitos.slice(1) : soloDigitos;
  return '54' + sinCero;
}

function generarSlots(horaInicio: string, horaFin: string, duracion: number): string[] {
  const slots: string[] = [];
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  let totalMin = hI * 60 + mI;
  const finMin = hF * 60 + mF;
  while (totalMin + duracion <= finMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    totalMin += duracion;
  }
  return slots;
}

interface TabAgendaProps {
  userId?: string
  turnoResaltado?: string | null
  fechaInicial?: string | null
  onTurnoResaltadoVisto?: () => void
}

export default function TabAgenda({ userId, turnoResaltado, fechaInicial, onTurnoResaltadoVisto }: TabAgendaProps) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(hoy.toISOString().split('T')[0]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
  const [bloqueosPersonales, setBloqueosPersonales] = useState<BloqueoPersonal[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionEditando, setSesionEditando] = useState<Partial<Sesion>>({});
  const [modoEdicion, setModoEdicion] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalWA, setModalWA] = useState(false);
  const [mensajeWA, setMensajeWA] = useState('');
  const [numeroWA, setNumeroWA] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: dataClientes } = await supabase.from('clientes').select('id, nombre, whatsapp').eq('user_id', userId).order('nombre');
      if (dataClientes) setClientes(dataClientes);
      const { data: dataServicios } = await supabase.from('servicios').select('id, nombre, duracion').order('nombre');
      if (dataServicios) setServicios(dataServicios);
      if (userId) {
        const { data: dataDisp } = await supabase
          .from('disponibilidad')
          .select('*')
          .eq('user_id', userId)
          .order('dia_semana');
        if (dataDisp) {
          setDisponibilidad(
            dataDisp.map((d: any) => ({
              id: d.id,
              dia_semana: d.dia_semana,
              activo: d.activo,
              bloques: Array.isArray(d.bloques) ? d.bloques : [],
            }))
          );
        }
      }
    };
    cargarDatos();
  }, [userId]);

  useEffect(() => {
    const cargarSesiones = async () => {
      setCargando(true);
      const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anio, mes + 1, 0);
      const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
      const { data } = await supabase.from('sesiones').select('*').gte('fecha', primerDia).lte('fecha', ultimoDiaStr).order('horario', { ascending: true });
      if (data) setSesiones(data);
      setCargando(false);
    };
    cargarSesiones();
  }, [anio, mes]);

  useEffect(() => {
    const cargarBloqueos = async () => {
      if (!userId) return;
      const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anio, mes + 1, 0);
      const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
      const { data } = await supabase
        .from('bloqueos_personales')
        .select('id, fecha, hora_inicio, hora_fin, motivo')
        .eq('user_id', userId)
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDiaStr);
      if (data) setBloqueosPersonales(data as BloqueoPersonal[]);
    };
    cargarBloqueos();
  }, [anio, mes, userId]);

  useEffect(() => {
    if (fechaInicial) {
      const fecha = new Date(fechaInicial + 'T12:00:00')
      setAnio(fecha.getFullYear())
      setMes(fecha.getMonth())
      setDiaSeleccionado(fechaInicial)
      setTimeout(() => {
        const el = document.getElementById(`turno-${turnoResaltado}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
    }
  }, [fechaInicial, turnoResaltado])

  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [...Array(primerDiaMes).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const fechaStr = (dia: number) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const sesionesDelDia = (dia: number) => sesiones.filter((s) => s.fecha === fechaStr(dia));
  const sesionesSeleccionadas = diaSeleccionado ? sesiones.filter((s) => s.fecha === diaSeleccionado) : [];
  const bloqueosSeleccionados = diaSeleccionado ? bloqueosPersonales.filter((b) => b.fecha === diaSeleccionado) : [];
  const hoyStr = hoy.toISOString().split('T')[0];
  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? 'Desconocido';
  const whatsappCliente = (id: string) => clientes.find((c) => c.id === id)?.whatsapp ?? null;

  // Disponibilidad configurada para el día seleccionado (con sus N bloques, definidos libremente por el profesional)
  const dispDelDia = (() => {
    if (!diaSeleccionado) return null;
    const diaSemana = new Date(diaSeleccionado + 'T12:00:00').getDay();
    return disponibilidad.find(d => d.dia_semana === diaSemana && d.activo) ?? null;
  })();

  // Bloques ordenados cronológicamente (por si se cargaron fuera de orden)
  const bloquesOrdenados = (dispDelDia?.bloques ?? [])
    .slice()
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Slots generados dinámicamente a partir de todos los bloques configurados, sin asumir mañana/tarde
  const slotsDelDia = bloquesOrdenados.flatMap(b => generarSlots(b.inicio, b.fin, b.duracion));

  // Devuelve el bloque de disponibilidad al que pertenece un horario, para poder inferir su duración
  const bloqueDeSlot = (slot: string): Bloque | null => {
    const [h, m] = slot.split(':').map(Number);
    const slotMin = h * 60 + m;
    return bloquesOrdenados.find(b => {
      const [hI, mI] = b.inicio.split(':').map(Number);
      const [hF, mF] = b.fin.split(':').map(Number);
      const inicioMin = hI * 60 + mI;
      const finMin = hF * 60 + mF;
      return slotMin >= inicioMin && slotMin < finMin;
    }) ?? null;
  };

  const sesionEnSlot = (slot: string): Sesion | null => {
    const slotMin = (() => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m;
    })();
    return sesionesSeleccionadas.find(s => {
      if (!s.horario) return false;
      const [h, m] = s.horario.substring(0, 5).split(':').map(Number);
      const inicioMin = h * 60 + m;
      const duracion = s.duracion ?? bloqueDeSlot(slot)?.duracion ?? 30;
      const finMin = inicioMin + duracion;
      return slotMin >= inicioMin && slotMin < finMin;
    }) ?? null;
  };

  const bloqueoEnSlot = (slot: string): BloqueoPersonal | null => {
    const slotMin = (() => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m;
    })();
    return bloqueosSeleccionados.find(b => {
      const [hI, mI] = b.hora_inicio.substring(0, 5).split(':').map(Number);
      const [hF, mF] = b.hora_fin.substring(0, 5).split(':').map(Number);
      const inicioMin = hI * 60 + mI;
      const finMin = hF * 60 + mF;
      return slotMin >= inicioMin && slotMin < finMin;
    }) ?? null;
  };

  const sesionesForaDeSlot = sesionesSeleccionadas.filter(
    s => s.horario && !slotsDelDia.includes(s.horario.substring(0, 5))
  );

  const bloqueosForaDeSlot = bloqueosSeleccionados.filter(
    b => !slotsDelDia.includes(b.hora_inicio.substring(0, 5))
  );

  const abrirNuevo = (horario?: string) => {
    setSesionEditando({
      fecha: diaSeleccionado ?? '',
      horario: horario ?? '',
      user_id: userId,
      facturado: false,
      cobrado: false,
      monto_senia: null,
      fecha_senia: null,
      monto2: null,
      forma_pago2: null,
    });
    setModoEdicion(false);
    setBusquedaCliente('');
    setModalAbierto(true);
  };

  const abrirEdicion = (sesion: Sesion) => {
    setSesionEditando({ ...sesion });
    setModoEdicion(true);
    setBusquedaCliente('');
    setModalAbierto(true);
  };

  const abrirModalWA = (s: Sesion) => {
    const nombre = nombreCliente(s.cliente_id);
    const telefono = whatsappCliente(s.cliente_id);
    const fechaLegible = formatearFechaLegible(s.fecha);
    const hora = s.horario ? s.horario.substring(0, 5) : '';
    const servicio = s.tipo_masaje ?? '';
    const msg = `Hola ${nombre}! 👋 Te recordamos tu turno de ${servicio} el ${fechaLegible}${hora ? ` a las ${hora}hs ` : ''}. ¡Te esperamos! 😊`;
    setMensajeWA(msg);
    setNumeroWA(telefono ?? '');
    setModalWA(true);
  };

  const enviarWA = () => {
    if (!numeroWA) { alert('Este cliente no tiene número de WhatsApp registrado.'); return; }
    const numero = limpiarWhatsapp(numeroWA);
    const texto = encodeURIComponent(mensajeWA);
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
    setModalWA(false);
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
    let duracionFinal = sesionEditando.duracion;
    if (!duracionFinal && sesionEditando.tipo_masaje) {
      const srv = servicios.find((s: any) => s.nombre === sesionEditando.tipo_masaje);
      duracionFinal = srv?.duracion ?? null;
    }
    if (modoEdicion && sesionEditando.id) {
      const { id, ...datos } = sesionEditando;
      await supabase.from('sesiones').update({ ...datos, duracion: duracionFinal }).eq('id', id);
    } else {
      const { id, ...datos } = sesionEditando;
      await supabase.from('sesiones').insert({ ...datos, duracion: duracionFinal, user_id: userId });
    }
    setModalAbierto(false);
    await recargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return;
    await supabase.from('sesiones').delete().eq('id', id);
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  };

  const cobrarDiferencia = async (s: Sesion) => {
    const fp = window.prompt('¿Cómo se cobra la diferencia? efectivo / transferencia');
    if (!fp) return;
    const hoyFecha = new Date().toISOString().split('T')[0];
    await supabase.from('sesiones').update({ cobrado: true, forma_pago_cobro: fp, fecha_cobro: hoyFecha }).eq('id', s.id);
    await recargar();
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

  const TarjetaTurno = ({ s }: { s: Sesion }) => {
    const esResaltado = turnoResaltado === s.id

    const confirmarTurnoWA = () => {
      const nombre = nombreCliente(s.cliente_id)
      const telefono = whatsappCliente(s.cliente_id)
      if (!telefono) { alert('Este cliente no tiene número de WhatsApp registrado.'); return }
      const fechaLegible = formatearFechaLegible(s.fecha)
      const hora = s.horario ? s.horario.substring(0, 5) : ''
      const servicio = s.tipo_masaje ?? ''
      const msg = `Hola ${nombre}! 👋 Tu turno de ${servicio} quedó confirmado para el ${fechaLegible}${hora ? ` a las ${hora}hs` : ''}. ¡Te esperamos! 😊`
      const numero = limpiarWhatsapp(telefono)
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
      if (onTurnoResaltadoVisto) onTurnoResaltadoVisto()
    }

    return (
      <div
        id={`turno-${s.id}`}
        style={{
          border: esResaltado ? '2px solid #4F46E5' : '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '12px 14px',
          backgroundColor: esResaltado ? '#EEF2FF' : '#FAFAFA',
          transition: 'all 0.3s ease',
          boxShadow: esResaltado ? '0 0 0 4px rgba(79,70,229,0.15)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>
              {s.horario ? s.horario.substring(0, 5) : 'Sin hora'}{s.duracion ? ` · ${s.duracion} min` : ''}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', margin: '2px 0' }}>{nombreCliente(s.cliente_id)}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              {s.tipo_masaje}{s.monto ? ` · $${s.monto}` : ''}{s.forma_pago ? ` · ${s.forma_pago}` : ''}
              {s.monto2 ? ` + $${s.monto2}` : ''}{s.forma_pago2 ? ` · ${s.forma_pago2}` : ''}
              {s.monto_senia ? ` · Seña: $${s.monto_senia}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => abrirModalWA(s)} title="Recordatorio WhatsApp"
              style={{ background: 'none', border: '1px solid #86EFAC', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '14px' }}>💬</button>
            <button onClick={() => abrirEdicion(s)}
              style={{ background: 'none', border: '1px solid #CBD5E0', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✏️</button>
            <button onClick={() => eliminar(s.id)}
              style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>🗑️</button>
          </div>
        </div>

        {esResaltado && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #C7D2FE' }}>
            <button
              onClick={confirmarTurnoWA}
              style={{
                width: '100%',
                backgroundColor: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              ✅ Confirmar turno por WhatsApp
            </button>
          </div>
        )}

        {s.monto_senia && s.monto && !s.cobrado && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Resta cobrar: <strong style={{ color: '#4F46E5' }}>${s.monto - s.monto_senia}</strong></span>
            <button onClick={() => cobrarDiferencia(s)}
              style={{ fontSize: '12px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Cobrar diferencia
            </button>
          </div>
        )}
        {s.cobrado && s.monto_senia && (
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#16A34A' }}>✓ Diferencia cobrada</div>
        )}
      </div>
    )
  }

  const TarjetaBloqueo = ({ b }: { b: BloqueoPersonal }) => (
    <div style={{
      border: '1px solid #D1D5DB',
      borderRadius: '12px',
      padding: '12px 14px',
      backgroundColor: '#F3F4F6',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>
        {b.hora_inicio.substring(0, 5)} – {b.hora_fin.substring(0, 5)}
      </div>
      <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>🔒 No disponible</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#F7F8FA', minHeight: '100%', padding: '16px' }}>

      {/* NAVEGACIÓN MES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => cambiarMes(-1)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px' }}>‹</button>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#2D3748' }}>{MESES[mes]} {anio}</span>
        <button onClick={() => cambiarMes(1)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px' }}>›</button>
      </div>

      {/* CALENDARIO */}
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
            const cantidadTurnos = activo ? sesionesDelDia(dia!).length : 0;
            const tieneTurnos = cantidadTurnos > 0;
            return (
              <div key={i} onClick={() => activo && setDiaSeleccionado(fecha)}
                style={{ backgroundColor: seleccionado ? '#EEF2FF' : esHoy ? '#F0FDF4' : '#fff', minHeight: '64px', padding: '6px', cursor: activo ? 'pointer' : 'default', opacity: activo ? 1 : 0.3 }}>
                {dia && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: esHoy || seleccionado ? 700 : 400, color: seleccionado ? '#fff' : esHoy ? '#16A34A' : '#374151', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: seleccionado ? '#4F46E5' : esHoy ? '#DCFCE7' : 'transparent' }}>
                      {dia}
                    </div>
                    {tieneTurnos && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4F46E5' }} />
                        {cantidadTurnos > 1 && <span style={{ fontSize: '10px', color: '#4F46E5', fontWeight: 600 }}>{cantidadTurnos}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DETALLE DEL DÍA */}
      {diaSeleccionado && (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', textTransform: 'capitalize' }}>{labelFecha}</span>
            <button onClick={() => abrirNuevo()} style={{ backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Turno</button>
          </div>

          {cargando ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>Cargando...</p>
          ) : slotsDelDia.length > 0 ? (
            <div>
              {slotsDelDia.map((slot) => {
                const sesion = sesionEnSlot(slot);
                const bloqueo = bloqueoEnSlot(slot);
                const ocupado = !!sesion || !!bloqueo;

                return (
                  <div key={slot}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: '44px', paddingTop: '10px', fontSize: '12px', fontWeight: 600, color: ocupado ? '#EF4444' : '#16A34A', textAlign: 'right' }}>
                        {slot}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ocupado ? '#EF4444' : '#22C55E', flexShrink: 0 }} />
                        <div style={{ width: '2px', flex: 1, backgroundColor: '#E2E8F0', minHeight: '16px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {bloqueo ? (
                          bloqueo.hora_inicio.substring(0, 5) === slot ? (
                            <TarjetaBloqueo b={bloqueo} />
                          ) : (
                            <div style={{ border: '1px solid #D1D5DB', borderRadius: '10px', padding: '10px 14px', backgroundColor: '#F3F4F6', fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>
                              🔒 No disponible
                            </div>
                          )
                        ) : sesion ? (
                          sesion.horario?.substring(0, 5) === slot ? (
                            <TarjetaTurno s={sesion} />
                          ) : (
                            <div style={{ border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', backgroundColor: '#FFF5F5', fontSize: '13px', color: '#EF4444', fontWeight: 500 }}>
                              🔒 Ocupado · {sesion.horario?.substring(0, 5)} – {nombreCliente(sesion.cliente_id)}
                            </div>
                          )
                        ) : (
                          <div onClick={() => abrirNuevo(slot)}
                            style={{ border: '1px dashed #D1FAE5', borderRadius: '10px', padding: '10px 14px', backgroundColor: '#F0FDF4', cursor: 'pointer', fontSize: '13px', color: '#16A34A', fontWeight: 500 }}>
                            + Agendar turno
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(sesionesForaDeSlot.length > 0 || bloqueosForaDeSlot.length > 0) && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, marginBottom: '8px' }}>⚠️ Fuera del horario configurado</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sesionesForaDeSlot.map(s => <TarjetaTurno key={s.id} s={s} />)}
                    {bloqueosForaDeSlot.map(b => <TarjetaBloqueo key={b.id} b={b} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {sesionesSeleccionadas.length === 0 && bloqueosSeleccionados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>Sin turnos agendados</p>
                  {disponibilidad.length === 0 && (
                    <p style={{ color: '#CBD5E0', fontSize: '12px' }}>Configurá tus horarios de atención en la pestaña Configuración para ver los slots disponibles</p>
                  )}
                  {disponibilidad.length > 0 && (
                    <p style={{ color: '#CBD5E0', fontSize: '12px' }}>Este día no tenés horarios de atención configurados</p>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sesionesSeleccionadas.map(s => <TarjetaTurno key={s.id} s={s} />)}
                  {bloqueosSeleccionados.map(b => <TarjetaBloqueo key={b.id} b={b} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL WHATSAPP */}
      {modalWA && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>💬</span>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A2E' }}>Recordatorio por WhatsApp</span>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Mensaje</label>
            <textarea value={mensajeWA} onChange={(e) => setMensajeWA(e.target.value)} rows={5}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', lineHeight: '1.5', boxSizing: 'border-box' as const, resize: 'vertical', marginBottom: '16px', color: '#1A1A2E' }} />
            {!numeroWA && <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '12px' }}>⚠️ Este cliente no tiene número de WhatsApp registrado.</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalWA(false)} style={{ border: '1px solid #E2E8F0', background: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={enviarWA} disabled={!numeroWA}
                style={{ backgroundColor: numeroWA ? '#25D366' : '#A3A3A3', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: numeroWA ? 'pointer' : 'not-allowed' }}>
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TURNO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px' }}>{modoEdicion ? 'Editar turno' : 'Nuevo turno'}</div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Cliente *</label>
            <input type="text" placeholder="Buscar cliente..."
              value={sesionEditando.cliente_id ? (clientes.find(c => c.id === sesionEditando.cliente_id)?.nombre ?? '') : busquedaCliente}
              onChange={(e) => { setBusquedaCliente(e.target.value); setSesionEditando({ ...sesionEditando, cliente_id: '' }); }}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box' as const }} />
            {busquedaCliente && !sesionEditando.cliente_id && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '14px' }}>
                {clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => { setSesionEditando({ ...sesionEditando, cliente_id: c.id }); setBusquedaCliente(''); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #F3F4F6' }}>
                    {c.nombre}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Fecha *</label>
                <input type="date" value={sesionEditando.fecha ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, fecha: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Horario</label>
                <input type="time" value={sesionEditando.horario ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, horario: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Tipo de servicio</label>
              <select value={sesionEditando.tipo_masaje ?? ''} onChange={(e) => {
                const servicio = servicios.find((s: any) => s.nombre === e.target.value);
                setSesionEditando({ ...sesionEditando, tipo_masaje: e.target.value, duracion: servicio?.duracion ?? sesionEditando.duracion ?? null });
              }} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }}>
                <option value="">Seleccionar...</option>
                {servicios.map((s: any) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Monto total</label>
                <input type="number" value={sesionEditando.monto ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto: Number(e.target.value) || null })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Forma de pago</label>
                <select value={sesionEditando.forma_pago ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, forma_pago: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }}>
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cuenta corriente">Cuenta corriente</option>
                  <option value="Obra social">Obra social</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8F7FF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '10px' }}>💳 Pago combinado (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Monto 2</label>
                  <input type="number" value={sesionEditando.monto2 ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto2: Number(e.target.value) || null })}
                    placeholder="0" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Forma de pago 2</label>
                  <select value={sesionEditando.forma_pago2 ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, forma_pago2: e.target.value || null })}
                    style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }}>
                    <option value="">Sin pago adicional</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cuenta corriente">Cuenta corriente</option>
                    <option value="Obra social">Obra social</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', display: 'block', marginBottom: '10px' }}>💰 Seña (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Monto seña</label>
                  <input type="number" value={sesionEditando.monto_senia ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto_senia: Number(e.target.value) || null })}
                    placeholder="0" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Fecha seña</label>
                  <input type="date" value={sesionEditando.fecha_senia ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, fecha_senia: e.target.value || null })}
                    style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const }} />
                </div>
              </div>
            </div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Notas clínicas</label>
            <textarea value={sesionEditando.notas_clinicas ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, notas_clinicas: e.target.value })}
              placeholder="Observaciones, evolución..."
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' as const, minHeight: '80px', resize: 'vertical' }} />

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