'use client'
import { useEffect, useRef, useState } from 'react'
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const ICONOS: Record<string, React.ReactNode> = {
  video: (<><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m22 8-6 4 6 4V8Z" /></>),
  play: (<><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></>),
  file: (<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></>),
  award: (<><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>),
  layers: (<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>),
  infinity: (<><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  dollar: (<><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
  bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
}

function Icono({ nombre }: { nombre: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONOS[nombre]}
    </svg>
  )
}

type Item = { icono: string; titulo: string; texto: string }

function Bloque({
  id, eyebrow, titulo, desc, items, boxLabel, boxMonto, boxSub, boton, href, nota, externo,
}: {
  id: string; eyebrow: string; titulo: string; desc: string; items: Item[]
  boxLabel: string; boxMonto: string; boxSub: string; boton: string; href: string; nota: string; externo?: boolean
}) {
  return (
    <section className="bloque-section" id={id}>
      <Reveal>
        <div className="bloque-card">
          <div className="bloque-info">
            <p className="bloque-eyebrow">{eyebrow}</p>
            <h2>{titulo}</h2>
            <p className="bloque-desc">{desc}</p>
            <ul className="bloque-list">
              {items.map((it) => (
                <li key={it.titulo}>
                  <div className="bloque-icon"><Icono nombre={it.icono} /></div>
                  <div><h4>{it.titulo}</h4><p>{it.texto}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bloque-box">
            <p className="box-label">{boxLabel}</p>
            <p className="box-monto">{boxMonto}</p>
            <p className="box-sub">{boxSub}</p>
            <a
              href={href}
              className="btn-ver"
              {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {boton}
            </a>
            <p className="box-nota">{nota}</p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blanco: #ffffff;
          --negro: #111827;
          --crema: #e5e7eb;
          --arena: #4f46e5;
          --arena-oscuro: #4338ca;
          --arena-claro: #eef2ff;
          --gris: #6b7280;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: var(--blanco); color: var(--negro); line-height: 1.5; }

        .nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 48px;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #ececec;
        }
        .nav-logo { text-decoration: none; }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { font-size: 14px; font-weight: 600; color: var(--negro); text-decoration: none; opacity: 0.65; transition: opacity 0.2s; }
        .nav-links a:hover { opacity: 1; }

        .hero { padding: 72px 24px 24px; background: var(--blanco); text-align: center; }
        .hero-eyebrow { font-size: 13px; font-weight: 700; color: var(--arena-oscuro); margin-bottom: 14px; letter-spacing: 0.02em; }
        .hero h1 {
          font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.15;
          letter-spacing: -0.02em; max-width: 760px; margin: 0 auto 16px; color: var(--negro);
        }
        .hero h1 span { color: var(--arena); }
        .hero-sub { font-size: 17px; font-weight: 500; color: var(--gris); max-width: 540px; margin: 0 auto; line-height: 1.6; }

        .bloque-section { padding: 40px 24px; background: var(--blanco); }
        .bloque-card {
          max-width: 1100px; margin: 0 auto; background: var(--negro); color: var(--blanco);
          border-radius: 24px; padding: 56px;
          display: grid; grid-template-columns: 1.3fr 1fr; gap: 56px; align-items: center;
        }
        .bloque-eyebrow { font-size: 13px; font-weight: 700; color: #a5b4fc; letter-spacing: 0.02em; margin-bottom: 14px; }
        .bloque-info h2 { font-size: clamp(28px, 3.6vw, 40px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 16px; }
        .bloque-desc { font-size: 16px; color: rgba(255,255,255,0.65); line-height: 1.7; margin-bottom: 32px; font-weight: 500; }
        .bloque-list { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        .bloque-list li { display: flex; gap: 12px; align-items: flex-start; }
        .bloque-icon {
          width: 40px; height: 40px; min-width: 40px; border-radius: 10px;
          background: rgba(165,180,252,0.12); color: #a5b4fc;
          display: flex; align-items: center; justify-content: center;
        }
        .bloque-icon svg { width: 20px; height: 20px; }
        .bloque-list h4 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        .bloque-list p { font-size: 13px; color: rgba(255,255,255,0.55); font-weight: 500; line-height: 1.5; }

        .bloque-box { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 40px 32px; text-align: center; }
        .box-label { font-size: 12px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .box-monto { font-size: 44px; font-weight: 800; margin-bottom: 4px; line-height: 1.1; }
        .box-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 28px; font-weight: 500; }
        .btn-ver {
          display: block; padding: 15px; background: var(--arena); color: var(--blanco);
          font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px;
          margin-bottom: 12px; transition: background 0.2s;
        }
        .btn-ver:hover { background: var(--arena-oscuro); }
        .box-nota { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; }

        footer { background: var(--negro); color: rgba(255,255,255,0.4); text-align: center; padding: 36px 24px; font-size: 13px; font-weight: 500; margin-top: 56px; }
        footer a { color: #a5b4fc; text-decoration: none; }

        @media (max-width: 860px) {
          .nav { padding: 14px 20px; }
          .nav-links { gap: 14px; }
          .nav-links a { font-size: 13px; }
          .hero { padding-top: 48px; }
          .bloque-card { grid-template-columns: 1fr; padding: 32px 24px; gap: 32px; }
          .bloque-list { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo"><img src="/logo.png" alt="Ribel" style={{ height: '34px', width: 'auto', display: 'block' }} /></a>
        <ul className="nav-links">
          <li><a href="#talleres">Talleres</a></li>
          <li><a href="#academia">Academia</a></li>
          <li><a href="#app-de-turnos">App de turnos</a></li>
        </ul>
      </nav>

      <section className="hero">
        <Reveal>
          <p className="hero-eyebrow">Para profesionales de la belleza y el bienestar</p>
          <h1>Elegí por dónde <span>querés empezar</span></h1>
          <p className="hero-sub">Talleres, academia y la app para gestionar tu negocio, todo en un solo lugar.</p>
        </Reveal>
      </section>

      <Bloque
        id="talleres"
        eyebrow="Talleres online"
        titulo="Talleres online para masajistas"
        desc="Para masajistas y terapeutas que quieren perfeccionar sus técnicas, sumar servicios nuevos y llenar su agenda."
        items={[
          { icono: 'video', titulo: 'En vivo por Zoom', texto: 'Participás y consultás tus dudas en el momento.' },
          { icono: 'play', titulo: 'Con grabación', texto: 'Repasá la clase cuando quieras.' },
          { icono: 'file', titulo: 'Material en PDF', texto: 'Apuntes de estudio para practicar a tu ritmo.' },
          { icono: 'award', titulo: 'Certificado de participación', texto: 'Con tu nombre, al terminar el taller.' },
        ]}
        boxLabel="Talleres online"
        boxMonto="En vivo"
        boxSub="y con grabación incluida"
        boton="Ver los talleres"
        href="https://talleres.ribelgestion.com"
        nota="Material en PDF · Certificado de participación"
      />

      <Bloque
        id="academia"
        eyebrow="Academia"
        titulo="El conocimiento que nadie te enseñó"
        desc="Un programa completo para que dejes de improvisar y empieces a tomar decisiones con claridad: precios, clientes, agenda y finanzas explicados paso a paso."
        items={[
          { icono: 'video', titulo: 'Módulos en video', texto: 'A tu ritmo, cuando quieras.' },
          { icono: 'file', titulo: 'Material descargable', texto: 'Guías en PDF para tener siempre a mano.' },
          { icono: 'layers', titulo: 'Recursos y herramientas', texto: 'Prácticas, listas para usar en tu negocio.' },
          { icono: 'infinity', titulo: 'Acceso de por vida', texto: 'Pagás una sola vez.' },
        ]}
        boxLabel="Pago único"
        boxMonto="$25.000"
        boxSub="USD 23 · un solo pago"
        boton="Quiero la Academia"
        href="https://wa.me/5493492219089?text=Hola!%20Quiero%20info%20de%20la%20Academia%20Ribel"
        nota="MercadoPago · PayPal · Tarjeta"
        externo
      />

      <Bloque
        id="app-de-turnos"
        eyebrow="App de turnos"
        titulo="Gestioná turnos, clientes y finanzas sin perder tiempo ni plata."
        desc="Ribel es la app que organiza tu negocio para que vos te enfoques en lo que sabés hacer: atender bien a tus clientes."
        items={[
          { icono: 'calendar', titulo: 'Agenda inteligente', texto: 'Tus clientes reservan solos.' },
          { icono: 'users', titulo: 'Gestión de clientes', texto: 'Historial y datos en un solo lugar.' },
          { icono: 'dollar', titulo: 'Control de finanzas', texto: 'Sabé cómo está tu negocio cada mes.' },
          { icono: 'bell', titulo: 'Notificaciones al instante', texto: 'Te avisamos apenas alguien reserva.' },
        ]}
        boxLabel="Ribel Gestión"
        boxMonto="15 días"
        boxSub="de prueba gratis, sin tarjeta"
        boton="Ver la app"
        href="/app-de-turnos"
        nota="Cancelás cuando quieras"
      />

      <footer>
        <p>©️ 2026 Ribel Gestión · <a href="mailto:hola@ribelgestion.com">hola@ribelgestion.com</a></p>
      </footer>

      <WhatsAppFloatingButton />
    </>
  )
}
