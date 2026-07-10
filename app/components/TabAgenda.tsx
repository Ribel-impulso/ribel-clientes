'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// Misma paleta que el resto de la app (ver page.tsx / login / TabTurnos).
const INK = '#1B2420';
const PAPER = '#F4EFE4';
const PAPER_2 = '#FFFDF8';
const BRASS = '#A87F4C';
const BRASS_BG = 'rgba(168,127,76,0.1)';
const SAGE = '#5E7A5A';
const SAGE_BG = '#EAF0E8';
const CLAY = '#A85A44';
const CLAY_BG = '#F5E9E5';
const LINE = '#DDD3BF';
const MUTED = '#726B5C';
const FONT_SERIF = "'Source Serif 4', serif";
const FONT_SANS = "'Public Sans', sans-serif";

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
  estado: string | null;
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
  if (numeroLimpio.startsWith('+')) {
    return numeroLimpio.replace(/\D/g, '');
  }
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
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: dataClientes } = await supabase.from('clientes').select('id, nombre, whatsapp').eq('user_id', userId).order('nombre');
      if (dataClientes) setClientes(dataClientes);
      const { data: dataServicios } = await supabase.from('servicios').select('id, nombre, duracion, precio, porcentaje_senia').order('nombre');
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
  const cargarDiasBloqueados = async () => {
    if (!userId) return;
    const primerDia = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anio, mes + 1, 0);
    const ultimoDiaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
    const { data } = await supabase
      .from('dias_bloqueados')
      .select('fecha')
      .eq('user_id', userId)
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDiaStr);
    if (data) setDiasBloqueados(data.map((d: any) => d.fecha));
  };
  cargarDiasBloqueados();
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
  const diaEstaBloqueado = diaSeleccionado ? diasBloqueados.includes(diaSeleccionado) : false;

const toggleBloqueoDia = async () => {
  if (!diaSeleccionado || !userId) return;
  if (diaEstaBloqueado) {
    await supabase.from('dias_bloqueados').delete().eq('user_id', userId).eq('fecha', diaSeleccionado);
    setDiasBloqueados(prev => prev.filter(f => f !== diaSeleccionado));
  } else {
    await supabase.from('dias_bloqueados').insert({ user_id: userId, fecha: diaSeleccionado });
    setDiasBloqueados(prev => [...prev, diaSeleccionado]);
  }
};
  const hoyStr = hoy.toISOString().split('T')[0];
  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? 'Desconocido';
  const whatsappCliente = (id: string) => clientes.find((c) => c.id === id)?.whatsapp ?? null;

  const dispDelDia = (() => {
    if (!diaSeleccionado) return null;
    const diaSemana = new Date(diaSeleccionado + 'T12:00:00').getDay();
    return disponibilidad.find(d => d.dia_semana === diaSemana && d.activo) ?? null;
  })();

  const bloquesOrdenados = (dispDelDia?.bloques ?? [])
    .slice()
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const slotsDelDia = bloquesOrdenados.flatMap(b => generarSlots(b.inicio, b.fin, b.duracion));

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
const slotsVisibles = slotsDelDia.filter(slot => {
  const sesion = sesionEnSlot(slot);
  if (sesion && sesion.horario?.substring(0, 5) !== slot) return false;
  const bloqueo = bloqueoEnSlot(slot);
  if (bloqueo && bloqueo.hora_inicio.substring(0, 5) !== slot) return false;
  return true;
});

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

  const confirmarSeniaRecibida = async (s: Sesion) => {
  const hoy = new Date().toISOString().split('T')[0];
  await supabase.from('sesiones').update({ estado: 'confirmado', fecha_senia: hoy }).eq('id', s.id);
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

  // Iconos SVG (reemplazan los emoji)
  const IconWhatsApp = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.42 0 1.43 1.02 2.81 1.17 3 .14.19 2.01 3.07 4.87 4.31.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0012.04 2zm5.83 15.74c-.25.7-1.45 1.34-2 1.43-.51.09-1.15.13-1.86-.12-.43-.15-.98-.31-1.68-.61-2.96-1.28-4.89-4.25-5.04-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.08.93 2.23.08.15.13.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.76-.89.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.98.3.15.5.23.57.36.08.13.08.75-.17 1.45z" /></svg>
  );
  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  );
  const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CLAY} strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
  );
  const IconLock = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
  );

  const TarjetaTurno = ({ s }: { s: Sesion }) => {
    const esResaltado = turnoResaltado === s.id
    const pendienteSenia = s.estado === 'pendiente_senia'

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
          border: pendienteSenia ? `2px solid ${BRASS}` : esResaltado ? `2px solid ${INK}` : `1px solid ${LINE}`,
          borderRadius: '12px',
          padding: '12px 14px',
          backgroundColor: pendienteSenia ? BRASS_BG : esResaltado ? '#F4EFE4' : PAPER_2,
          transition: 'all 0.3s ease',
          boxShadow: esResaltado ? '0 0 0 4px rgba(27,36,32,0.08)' : 'none',
          fontFamily: FONT_SANS
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: BRASS }}>
              {s.horario ? s.horario.substring(0, 5) : 'Sin hora'}{s.duracion ? ` · ${s.duracion} min` : ''}
            </div>
            {pendienteSenia && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: BRASS, marginBottom: '2px', letterSpacing: '0.02em' }}>PENDIENTE DE SEÑA</div>
            )}
            <div style={{ fontSize: '14px', fontWeight: 600, color: INK, margin: '2px 0' }}>{nombreCliente(s.cliente_id)}</div>
            <div style={{ fontSize: '12px', color: MUTED }}>
              {s.tipo_masaje}{s.monto ? ` · $${s.monto}` : ''}{s.forma_pago ? ` · ${s.forma_pago}` : ''}
              {s.monto2 ? ` + $${s.monto2}` : ''}{s.forma_pago2 ? ` · ${s.forma_pago2}` : ''}
              {s.monto_senia ? ` · Seña: $${s.monto_senia}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => abrirModalWA(s)} title="Recordatorio WhatsApp"
              style={{ background: 'none', border: `1px solid ${LINE}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#25D366' }}>
              <IconWhatsApp />
            </button>
            <button onClick={() => abrirEdicion(s)}
              style={{ background: 'none', border: `1px solid ${LINE}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <IconEdit />
            </button>
            <button onClick={() => eliminar(s.id)}
              style={{ background: 'none', border: `1px solid ${LINE}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <IconTrash />
            </button>
          </div>
        </div>

        {esResaltado && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${LINE}` }}>
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
                gap: '6px',
                fontFamily: FONT_SANS
              }}
            >
              Confirmar turno por WhatsApp
            </button>
          </div>
        )}

        {s.monto_senia && s.monto && s.estado === 'confirmado' && !s.cobrado && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: MUTED }}>Resta cobrar: <strong style={{ color: INK }}>${s.monto - s.monto_senia}</strong></span>
            <button onClick={() => cobrarDiferencia(s)}
              style={{ fontSize: '12px', backgroundColor: INK, color: PAPER_2, border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT_SANS }}>
              Cobrar diferencia
            </button>
          </div>
        )}
        {s.cobrado && s.monto_senia && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: SAGE, fontWeight: 600 }}>✓ Diferencia cobrada</div>
            )}
            {pendienteSenia && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${LINE}` }}>
                <button onClick={() => confirmarSeniaRecibida(s)}
                  style={{ width: '100%', fontSize: '12px', backgroundColor: BRASS, color: PAPER_2, border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT_SANS }}>
                  Confirmar seña recibida
                </button>
              </div>
            )}
      </div>
    )
  }

  const TarjetaBloqueo = ({ b }: { b: BloqueoPersonal }) => (
    <div style={{
      border: `1px solid ${LINE}`,
      borderRadius: '12px',
      padding: '12px 14px',
      backgroundColor: PAPER,
      fontFamily: FONT_SANS
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: MUTED }}>
        {b.hora_inicio.substring(0, 5)} – {b.hora_fin.substring(0, 5)}
      </div>
      <div style={{ fontSize: '13px', color: MUTED, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <IconLock /> No disponible
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT_SANS, backgroundColor: 'transparent', minHeight: '100%', padding: '0' }}>

      {/* NAVEGACIÓN MES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => cambiarMes(-1)} style={{ background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px', color: INK }}>‹</button>
        <span style={{ fontSize: '17px', fontWeight: 600, color: INK, fontFamily: FONT_SERIF, textTransform: 'capitalize' }}>{MESES[mes]} {anio}</span>
        <button onClick={() => cambiarMes(1)} style={{ background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px', color: INK }}>›</button>
      </div>

      {/* CALENDARIO */}
      <div style={{ backgroundColor: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '16px', boxShadow: '0 2px 10px rgba(27,36,32,0.05)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: INK }}>
          {DIAS_SEMANA.map((d) => (
            <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: 600, color: PAPER_2 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: LINE }}>
          {celdas.map((dia, i) => {
            const activo = dia !== null;
            const fecha = activo ? fechaStr(dia!) : '';
            const esHoy = fecha === hoyStr;
            const seleccionado = fecha === diaSeleccionado;
            const cantidadTurnos = activo ? sesionesDelDia(dia!).length : 0;
            const tieneTurnos = cantidadTurnos > 0;
            const bloqueado = activo && diasBloqueados.includes(fecha);
            return (
              <div key={i} onClick={() => activo && setDiaSeleccionado(fecha)}
                style={{ backgroundColor: bloqueado ? CLAY_BG : seleccionado ? '#F4EFE4' : esHoy ? SAGE_BG : PAPER_2, padding: '6px', cursor: activo ? 'pointer' : 'default', opacity: activo ? 1 : 0.3 }}>
                {dia && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: esHoy || seleccionado ? 700 : 400, color: seleccionado ? PAPER_2 : esHoy ? SAGE : INK, width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: seleccionado ? INK : esHoy ? SAGE_BG : 'transparent' }}>
                      {dia}
                    </div>
                    {tieneTurnos && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: BRASS }} />
                        {cantidadTurnos > 1 && <span style={{ fontSize: '10px', color: BRASS, fontWeight: 600 }}>{cantidadTurnos}</span>}
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
        <div style={{ backgroundColor: PAPER_2, border: `1px solid ${LINE}`, borderRadius: '16px', boxShadow: '0 2px 10px rgba(27,36,32,0.05)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
  <span style={{ fontSize: '15px', fontWeight: 700, color: INK, textTransform: 'capitalize', fontFamily: FONT_SERIF }}>{labelFecha}</span>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button onClick={toggleBloqueoDia}
      style={{
        backgroundColor: diaEstaBloqueado ? CLAY_BG : PAPER,
        color: diaEstaBloqueado ? CLAY : MUTED,
        border: diaEstaBloqueado ? `1px solid ${CLAY}55` : `1px solid ${LINE}`,
        borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS
      }}>
      {diaEstaBloqueado ? 'Desbloquear día' : 'Bloquear día'}
    </button>
    {!diaEstaBloqueado && (
      <button onClick={() => abrirNuevo()} style={{ backgroundColor: INK, color: PAPER_2, border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS }}>+ Turno</button>
    )}
  </div>
</div>

          {cargando ? (
            <p style={{ textAlign: 'center', color: MUTED, padding: '24px 0' }}>Cargando...</p>
          ) : slotsVisibles.length > 0 ? (
  <div>
    {slotsVisibles.map((slot) => {
                const sesion = sesionEnSlot(slot);
                const bloqueo = bloqueoEnSlot(slot);
                const ocupado = !!sesion || !!bloqueo;

                return (
                  <div key={slot}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: '44px', paddingTop: '10px', fontSize: '12px', fontWeight: 600, color: ocupado ? CLAY : SAGE, textAlign: 'right' }}>
                        {slot}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ocupado ? CLAY : SAGE, flexShrink: 0 }} />
                        <div style={{ width: '2px', flex: 1, backgroundColor: LINE, minHeight: '16px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {bloqueo ? (
                          bloqueo.hora_inicio.substring(0, 5) === slot ? (
                            <TarjetaBloqueo b={bloqueo} />
                          ) : (
                            <div style={{ border: `1px solid ${LINE}`, borderRadius: '10px', padding: '10px 14px', backgroundColor: PAPER, fontSize: '13px', color: MUTED, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <IconLock /> No disponible
                            </div>
                          )
                        ) : sesion ? (
                          sesion.horario?.substring(0, 5) === slot ? (
                            <TarjetaTurno s={sesion} />
                          ) : (
                            <div style={{ border: `1px solid ${CLAY}55`, borderRadius: '10px', padding: '10px 14px', backgroundColor: CLAY_BG, fontSize: '13px', color: CLAY, fontWeight: 500 }}>
                              Ocupado · {sesion.horario?.substring(0, 5)} – {nombreCliente(sesion.cliente_id)}
                            </div>
                          )
                        ) : (
                          <div onClick={() => abrirNuevo(slot)}
                            style={{ border: `1px dashed ${SAGE}66`, borderRadius: '10px', padding: '10px 14px', backgroundColor: SAGE_BG, cursor: 'pointer', fontSize: '13px', color: SAGE, fontWeight: 600 }}>
                            + Agendar turno
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(sesionesForaDeSlot.length > 0 || bloqueosForaDeSlot.length > 0) && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${LINE}` }}>
                  <p style={{ fontSize: '12px', color: BRASS, fontWeight: 700, marginBottom: '8px' }}>Fuera del horario configurado</p>
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
                  <p style={{ color: MUTED, marginBottom: '8px' }}>Sin turnos agendados</p>
                  {disponibilidad.length === 0 && (
                    <p style={{ color: MUTED, fontSize: '12px' }}>Configurá tus horarios de atención en la pestaña Configuración para ver los slots disponibles</p>
                  )}
                  {disponibilidad.length > 0 && (
                    <p style={{ color: MUTED, fontSize: '12px' }}>Este día no tenés horarios de atención configurados</p>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,36,32,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: PAPER_2, borderRadius: '18px', border: `1px solid ${LINE}`, padding: '24px', width: '100%', maxWidth: '440px', fontFamily: FONT_SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ color: '#25D366', display: 'flex' }}><IconWhatsApp /></span>
              <span style={{ fontSize: '17px', fontWeight: 700, color: INK, fontFamily: FONT_SERIF }}>Recordatorio por WhatsApp</span>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Mensaje</label>
            <textarea value={mensajeWA} onChange={(e) => setMensajeWA(e.target.value)} rows={5}
              style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', lineHeight: '1.5', boxSizing: 'border-box' as const, resize: 'vertical', marginBottom: '16px', color: INK, fontFamily: FONT_SANS }} />
            {!numeroWA && <p style={{ fontSize: '12px', color: CLAY, marginBottom: '12px', fontWeight: 600 }}>Este cliente no tiene número de WhatsApp registrado.</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalWA(false)} style={{ border: `1px solid ${LINE}`, background: PAPER_2, color: INK, borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT_SANS, fontWeight: 600 }}>Cancelar</button>
              <button onClick={enviarWA} disabled={!numeroWA}
                style={{ backgroundColor: numeroWA ? '#25D366' : MUTED, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: numeroWA ? 'pointer' : 'not-allowed', fontFamily: FONT_SANS }}>
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TURNO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,36,32,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: PAPER_2, borderRadius: '18px', border: `1px solid ${LINE}`, padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', fontFamily: FONT_SANS }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '18px', color: INK, fontFamily: FONT_SERIF }}>{modoEdicion ? 'Editar turno' : 'Nuevo turno'}</div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Cliente *</label>
            <input type="text" placeholder="Buscar cliente..."
              value={sesionEditando.cliente_id ? (clientes.find(c => c.id === sesionEditando.cliente_id)?.nombre ?? '') : busquedaCliente}
              onChange={(e) => { setBusquedaCliente(e.target.value); setSesionEditando({ ...sesionEditando, cliente_id: '' }); }}
              style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }} />
            {busquedaCliente && !sesionEditando.cliente_id && (
              <div style={{ border: `1px solid ${LINE}`, borderRadius: '10px', maxHeight: '150px', overflowY: 'auto', marginBottom: '14px' }}>
                {clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => { setSesionEditando({ ...sesionEditando, cliente_id: c.id }); setBusquedaCliente(''); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: `1px solid ${PAPER}`, color: INK }}>
                    {c.nombre}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Fecha *</label>
                <input type="date" value={sesionEditando.fecha ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, fecha: e.target.value })}
                  style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Horario</label>
                <input type="time" value={sesionEditando.horario ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, horario: e.target.value })}
                  style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Tipo de servicio</label>
              <select value={sesionEditando.tipo_masaje ?? ''} onChange={(e) => {
  const servicio = servicios.find((s: any) => s.nombre === e.target.value);
  const montoCalculado = servicio?.precio ?? sesionEditando.monto ?? null;
  const seniaCalculada = (servicio?.precio && servicio?.porcentaje_senia)
    ? Math.round(servicio.precio * (servicio.porcentaje_senia / 100))
    : sesionEditando.monto_senia ?? null;
  setSesionEditando({
    ...sesionEditando,
    tipo_masaje: e.target.value,
    duracion: servicio?.duracion ?? sesionEditando.duracion ?? null,
    monto: montoCalculado,
    monto_senia: seniaCalculada,
  });
}} style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }}>
                <option value="">Seleccionar...</option>
                {servicios.map((s: any) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Monto total</label>
                <input type="number" value={sesionEditando.monto ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto: Number(e.target.value) || null })}
                  style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Forma de pago</label>
                <select value={sesionEditando.forma_pago ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, forma_pago: e.target.value })}
                  style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS }}>
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cuenta corriente">Cuenta corriente</option>
                  <option value="Obra social">Obra social</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: BRASS_BG, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: BRASS, display: 'block', marginBottom: '10px' }}>Pago combinado (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '4px' }}>Monto 2</label>
                  <input type="number" value={sesionEditando.monto2 ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto2: Number(e.target.value) || null })}
                    placeholder="0" style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS, backgroundColor: PAPER_2 }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '4px' }}>Forma de pago 2</label>
                  <select value={sesionEditando.forma_pago2 ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, forma_pago2: e.target.value || null })}
                    style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS, backgroundColor: PAPER_2 }}>
                    <option value="">Sin pago adicional</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cuenta corriente">Cuenta corriente</option>
                    <option value="Obra social">Obra social</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: BRASS_BG, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: BRASS, display: 'block', marginBottom: '10px' }}>Seña (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '4px' }}>Monto seña</label>
                  <input type="number" value={sesionEditando.monto_senia ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, monto_senia: Number(e.target.value) || null })}
                    placeholder="0" style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS, backgroundColor: PAPER_2 }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '4px' }}>Fecha seña</label>
                  <input type="date" value={sesionEditando.fecha_senia ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, fecha_senia: e.target.value || null })}
                    style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box' as const, color: INK, fontFamily: FONT_SANS, backgroundColor: PAPER_2 }} />
                </div>
              </div>
            </div>

            <label style={{ fontSize: '12px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>NOTAS</label>
            <textarea value={sesionEditando.notas_clinicas ?? ''} onChange={(e) => setSesionEditando({ ...sesionEditando, notas_clinicas: e.target.value })}
              placeholder="Observaciones, evolución..."
              style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: '10px', padding: '9px 12px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' as const, minHeight: '80px', resize: 'vertical', color: INK, fontFamily: FONT_SANS }} />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAbierto(false)} style={{ border: `1px solid ${LINE}`, background: PAPER_2, color: INK, borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT_SANS, fontWeight: 600 }}>Cancelar</button>
              <button onClick={guardar} style={{ backgroundColor: INK, color: PAPER_2, border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS }}>
                {modoEdicion ? 'Guardar cambios' : 'Agendar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}