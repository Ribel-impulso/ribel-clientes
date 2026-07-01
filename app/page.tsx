'use client'
import { useEffect, useRef, useState } from 'react'

function useCountUp(end: number, duration = 1500, startWhenVisible: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!startWhenVisible) return
    let startTime: number | null = null
    let raf: number
    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(Math.floor(progress * end))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [startWhenVisible, end, duration])
  return value
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.3 }
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

function NumeroAnimado({ end, suffix, label, desc, delay }: { end: number; suffix: string; label: string; desc: string; delay: number }) {
  const { ref, inView } = useInView()
  const valor = useCountUp(end, 1400, inView)
  return (
    <div ref={ref}>
      <p className="numero-grande">{valor}{suffix}</p>
      <p className="numero-label">{label}</p>
      <p className="numero-desc">{desc}</p>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="faq-item" onClick={() => setAbierto(!abierto)}>
      <div className="faq-q-row">
        <p className="faq-q">{q}</p>
        <span className={`faq-icon ${abierto ? 'open' : ''}`}>+</span>
      </div>
      <div className="faq-a-wrap" style={{ maxHeight: abierto ? '200px' : '0px' }}>
        <p className="faq-a">{a}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blanco: #ffffff;
          --negro: #161616;
          --crema: #e3dfd6;
          --arena: #ba9a7d;
          --arena-oscuro: #9c7d5f;
          --arena-claro: #f3ece3;
          --gris: #6b6b6b;
          --verde-ok: #2d9d6f;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--blanco); color: var(--negro); line-height: 1.5; }

        .nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 48px;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #ececec;
        }
        .nav-logo { font-size: 22px; font-weight: 800; color: var(--negro); text-decoration: none; letter-spacing: -0.02em; }
        .nav-logo span { color: var(--arena); }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { font-size: 14px; font-weight: 600; color: var(--negro); text-decoration: none; opacity: 0.65; transition: opacity 0.2s; }
        .nav-links a:hover { opacity: 1; }
        .nav-cta {
          opacity: 1 !important; padding: 11px 24px !important; border-radius: 8px;
          background: var(--negro); color: var(--blanco) !important;
          transition: background 0.2s !important;
        }
        .nav-cta:hover { background: var(--arena-oscuro) !important; }

        .badge-row {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-bottom: 28px;
          font-size: 13px; font-weight: 600; color: var(--gris);
        }
        .stars { color: #f5a623; letter-spacing: 1px; }

        .hero { padding: 64px 24px 80px; background: var(--arena-claro); text-align: center; }
        .hero h1 {
          font-size: clamp(34px, 5.5vw, 58px); font-weight: 800; line-height: 1.15;
          letter-spacing: -0.02em; max-width: 780px; margin: 0 auto 20px; color: var(--negro);
        }
        .hero h1 .accent { color: var(--arena-oscuro); }
        .hero-sub { font-size: 18px; font-weight: 500; color: var(--gris); max-width: 560px; margin: 0 auto 36px; line-height: 1.6; }
        .hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
        .btn-primario {
          padding: 16px 36px; background: var(--negro); color: var(--blanco);
          font-size: 15px; font-weight: 700; text-decoration: none;
          border-radius: 10px; transition: transform 0.15s, background 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .btn-primario:hover { background: var(--arena-oscuro); transform: translateY(-2px); }
        .btn-secundario {
          padding: 16px 36px; background: var(--blanco); color: var(--negro);
          font-size: 15px; font-weight: 700; text-decoration: none;
          border-radius: 10px; border: 2px solid var(--negro); transition: all 0.2s;
        }
        .btn-secundario:hover { background: var(--negro); color: var(--blanco); }
        .hero-nota { font-size: 13px; color: var(--gris); font-weight: 500; }

        .hero-mock {
          max-width: 900px; margin: 56px auto 0; background: var(--blanco);
          border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); padding: 28px; text-align: left;
        }
        .mock-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--crema); }
        .mock-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--arena); margin-right: 6px; }
        .mock-titulo { font-size: 13px; font-weight: 700; color: var(--gris); }
        .mock-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f2f0ec; font-size: 14px; }
        .mock-row:last-child { border-bottom: none; }
        .mock-cliente { font-weight: 700; }
        .mock-detalle { color: var(--gris); font-size: 13px; }
        .mock-tag { background: var(--arena-claro); color: var(--arena-oscuro); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }

        .problema { padding: 90px 24px; background: var(--blanco); text-align: center; }
        .section-eyebrow { font-size: 13px; font-weight: 700; color: var(--arena-oscuro); margin-bottom: 14px; letter-spacing: 0.02em; }
        .section-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.01em; }
        .section-sub { font-size: 16px; color: var(--gris); max-width: 520px; margin: 0 auto 56px; font-weight: 500; }

        .problema-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto; }
        .problema-card { background: var(--arena-claro); border-radius: 14px; padding: 32px 24px; text-align: left; transition: transform 0.25s; }
        .problema-card:hover { transform: translateY(-6px); }
        .problema-icon { font-size: 28px; margin-bottom: 16px; display: block; }
        .problema-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .problema-card p { font-size: 14px; color: var(--gris); font-weight: 500; line-height: 1.55; }

        .numeros { padding: 80px 24px; background: var(--negro); color: var(--blanco); }
        .numeros-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; text-align: center; }
        .numero-grande { font-size: clamp(40px, 6vw, 64px); font-weight: 800; color: var(--arena); line-height: 1; margin-bottom: 12px; }
        .numero-label { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .numero-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 500; }

        .app-section { padding: 90px 24px; background: var(--blanco); }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 56px; }
        .feature-card { background: var(--arena-claro); border-radius: 14px; padding: 28px; display: flex; gap: 18px; align-items: flex-start; transition: transform 0.25s; }
        .feature-card:hover { transform: translateY(-6px); }
        .feature-icon {
          width: 46px; height: 46px; min-width: 46px; border-radius: 12px;
          background: var(--negro); color: var(--blanco); display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .feature-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
        .feature-card p { font-size: 14px; color: var(--gris); font-weight: 500; line-height: 1.55; }

        .testimonios { padding: 90px 24px; background: var(--arena-claro); text-align: center; }
        .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1000px; margin: 56px auto 0; text-align: left; }
        .testi-card { background: var(--blanco); border-radius: 14px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); transition: transform 0.25s; }
        .testi-card:hover { transform: translateY(-6px); }
        .testi-stars { color: #f5a623; font-size: 13px; margin-bottom: 14px; }
        .testi-quote { font-size: 14px; font-weight: 500; color: var(--negro); margin-bottom: 20px; line-height: 1.6; }
        .testi-person { display: flex; align-items: center; gap: 10px; }
        .testi-avatar {
          width: 42px; height: 42px; border-radius: 50%; background: var(--crema);
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: var(--arena-oscuro);
          overflow: hidden; flex-shrink: 0;
        }
        .testi-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .testi-name { font-size: 13px; font-weight: 700; }
        .testi-role { font-size: 12px; color: var(--gris); font-weight: 500; }

        .pricing-section { padding: 90px 24px; background: var(--blanco); }
        .planes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1000px; margin: 0 auto; }
        .plan-card { border: 2px solid var(--crema); border-radius: 16px; padding: 32px 28px; position: relative; transition: transform 0.25s; }
        .plan-card:hover { transform: translateY(-6px); }
        .plan-card.destacado { border-color: var(--negro); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
        .plan-tag {
          position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
          background: var(--negro); color: var(--blanco); font-size: 11px; font-weight: 700;
          padding: 5px 16px; border-radius: 20px; white-space: nowrap;
        }
        .plan-nombre { font-size: 14px; font-weight: 700; color: var(--gris); margin-bottom: 8px; }
        .plan-precio { font-size: 36px; font-weight: 800; color: var(--negro); margin-bottom: 2px; }
        .plan-precio span { font-size: 14px; font-weight: 600; color: var(--gris); }
        .plan-usd { font-size: 13px; color: var(--gris); font-weight: 500; margin-bottom: 24px; }
        .plan-feats { list-style: none; margin-bottom: 28px; }
        .plan-feats li { font-size: 14px; font-weight: 500; padding: 8px 0; display: flex; gap: 10px; align-items: center; }
        .plan-feats li::before { content: '✓'; color: var(--verde-ok); font-weight: 800; }
        .plan-btn { display: block; text-align: center; padding: 13px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .plan-btn.fill { background: var(--negro); color: var(--blanco); }
        .plan-btn.fill:hover { background: var(--arena-oscuro); }
        .plan-btn.line { background: transparent; color: var(--negro); border: 2px solid var(--negro); }
        .plan-btn.line:hover { background: var(--negro); color: var(--blanco); }

        .prueba-aviso {
          text-align: center; max-width: 600px; margin: 40px auto 0;
          font-size: 14px; font-weight: 600; color: var(--arena-oscuro);
          background: var(--arena-claro); padding: 14px; border-radius: 10px;
        }

        .academia-section { padding: 90px 24px; background: var(--negro); color: var(--blanco); }
        .academia-section .section-eyebrow { color: var(--arena); }
        .academia-section .section-title { color: var(--blanco); text-align: center; }
        .academia-section .section-sub { color: rgba(255,255,255,0.55); text-align: center; }
        .academia-card {
          max-width: 1000px; margin: 56px auto 0; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 56px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center;
        }
        .academia-info h3 { font-size: 30px; font-weight: 800; margin-bottom: 16px; }
        .academia-info p { font-size: 15px; color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 28px; font-weight: 500; }
        .academia-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .academia-list li { font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 600; display: flex; gap: 10px; align-items: center; }
        .academia-list li::before { content: '✓'; color: var(--arena); font-weight: 800; }

        .precio-box { background: rgba(186,154,125,0.12); border: 1px solid rgba(186,154,125,0.3); border-radius: 16px; padding: 40px; text-align: center; }
        .precio-label { font-size: 12px; font-weight: 700; color: var(--arena); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .precio-monto { font-size: 48px; font-weight: 800; margin-bottom: 4px; }
        .precio-usd { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 28px; font-weight: 500; }
        .btn-arena { display: block; padding: 15px; background: var(--arena); color: var(--blanco); font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; margin-bottom: 12px; transition: background 0.2s; }
        .btn-arena:hover { background: var(--arena-oscuro); }
        .precio-nota { font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 500; }

        .faq-section { padding: 90px 24px; background: var(--blanco); }
        .faq-list { max-width: 700px; margin: 48px auto 0; }
        .faq-item { border-bottom: 1px solid var(--crema); padding: 22px 0; cursor: pointer; }
        .faq-q-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .faq-q { font-size: 16px; font-weight: 700; }
        .faq-icon {
          font-size: 22px; font-weight: 400; color: var(--arena-oscuro);
          transition: transform 0.25s; flex-shrink: 0; line-height: 1;
        }
        .faq-icon.open { transform: rotate(45deg); }
        .faq-a-wrap { overflow: hidden; transition: max-height 0.3s ease; }
        .faq-a { font-size: 14px; color: var(--gris); font-weight: 500; line-height: 1.6; padding-top: 12px; }

        .cta-final { padding: 80px 24px; background: var(--arena-claro); text-align: center; }
        .cta-final h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; margin-bottom: 16px; }
        .cta-final p { font-size: 16px; color: var(--gris); margin-bottom: 32px; font-weight: 500; }

        footer { background: var(--negro); color: rgba(255,255,255,0.4); text-align: center; padding: 36px 24px; font-size: 13px; font-weight: 500; }
        footer a { color: var(--arena); text-decoration: none; }

        @media (max-width: 860px) {
          .nav { padding: 14px 20px; }
          .nav-links { gap: 16px; }
          .nav-links a:not(.nav-cta) { display: none; }
          .problema-grid, .features-grid, .testi-grid, .planes-grid { grid-template-columns: 1fr; }
          .numeros-inner { grid-template-columns: 1fr; gap: 32px; }
          .academia-card { grid-template-columns: 1fr; padding: 32px 24px; gap: 32px; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">ribel<span>.</span></a>
        <ul className="nav-links">
          <li><a href="#app">La App</a></li>
          <li><a href="#academia">Academia</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><a href="/login" className="nav-cta">Ingresar</a></li>
        </ul>
      </nav>

      <section className="hero">
        <Reveal>
          <div className="badge-row">
            <span className="stars">★★★★★</span>
            <span>Pensado para profesionales de la belleza y el bienestar</span>
          </div>
          <h1>Gestioná turnos, clientes y finanzas <span className="accent">sin perder tiempo ni plata.</span></h1>
          <p className="hero-sub">Ribel es la app que organiza tu negocio para que vos te enfoques en lo que sabés hacer: atender bien a tus clientes.</p>
          <div className="hero-ctas">
            <a href="/login" className="btn-primario">Probar 15 días gratis</a>
            <a href="#app" className="btn-secundario">Ver cómo funciona</a>
          </div>
          <p className="hero-nota">Sin tarjeta de crédito · Cancelás cuando quieras</p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="hero-mock">
            <div className="mock-top">
              <span className="mock-titulo">📅 Agenda de hoy</span>
              <span className="mock-tag">3 turnos confirmados</span>
            </div>
            <div className="mock-row">
              <div><span className="mock-dot"></span><span className="mock-cliente">María G.</span> <span className="mock-detalle">— Masaje relajante</span></div>
              <span className="mock-detalle">10:00 hs</span>
            </div>
            <div className="mock-row">
              <div><span className="mock-dot"></span><span className="mock-cliente">Lucía P.</span> <span className="mock-detalle">— Manicura</span></div>
              <span className="mock-detalle">14:30 hs</span>
            </div>
            <div className="mock-row">
              <div><span className="mock-dot"></span><span className="mock-cliente">Sofía R.</span> <span className="mock-detalle">— Sesión nutricional</span></div>
              <span className="mock-detalle">17:00 hs</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="problema">
        <Reveal>
          <p className="section-eyebrow">La realidad sin un sistema</p>
          <h2 className="section-title">Esto te quita tiempo y plata</h2>
          <p className="section-sub">Gestionar un negocio de servicios a mano consume tiempo que podrías usar en atender clientes.</p>
        </Reveal>
        <div className="problema-grid">
          <Reveal delay={0}>
            <div className="problema-card">
              <span className="problema-icon">📋</span>
              <h4>Turnos en papel o WhatsApp</h4>
              <p>Perdés tiempo confirmando y reorganizando manualmente cada cambio.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="problema-card">
              <span className="problema-icon">💸</span>
              <h4>No sabés cuánto ganás</h4>
              <p>Los ingresos y gastos están dispersos y nunca tenés el número real a mano.</p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="problema-card">
              <span className="problema-icon">😮‍💨</span>
              <h4>Información de clientes perdida</h4>
              <p>Historial, preferencias y contacto de cada clienta en mil lugares distintos.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="numeros">
        <div className="numeros-inner">
          <NumeroAnimado end={5} suffix="+ hs" label="Recuperás por semana" desc="Menos tiempo organizando, más tiempo con clientes" delay={0} />
          <NumeroAnimado end={100} suffix="%" label="Organizado en un solo lugar" desc="Agenda, clientes y finanzas juntos" delay={0.1} />
          <NumeroAnimado end={15} suffix=" días" label="De prueba gratis" desc="Sin tarjeta, sin compromiso" delay={0.2} />
        </div>
      </section>

      <section className="app-section" id="app">
        <div className="section-inner">
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <p className="section-eyebrow">Ribel Gestión</p>
              <h2 className="section-title">Todo lo que necesitás, en una sola app</h2>
              <p className="section-sub">Diseñada específicamente para profesionales independientes de la salud, belleza y bienestar.</p>
            </div>
          </Reveal>
          <div className="features-grid">
            {[
              { icon: '📅', title: 'Agenda inteligente', desc: 'Configurá turnos de mañana y tarde. Tus clientes reservan solos, sin que vos muevas un dedo.' },
              { icon: '👥', title: 'Gestión de clientes', desc: 'Historial completo, datos de contacto y seguimiento de cada clienta en un solo lugar.' },
              { icon: '💰', title: 'Control de finanzas', desc: 'Registrá ingresos y gastos. Sabé exactamente cómo está tu negocio cada mes.' },
              { icon: '🔔', title: 'Notificaciones al instante', desc: 'Te avisamos apenas alguien reserva, sin que tengas que estar revisando todo el día.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <div><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonios" id="testimonios">
        <Reveal>
          <p className="section-eyebrow">Lo que dicen quienes ya usan Ribel</p>
          <h2 className="section-title">Profesionales reales, resultados reales</h2>
        </Reveal>
        <div className="testi-grid">
          {[
            { quote: '"Antes perdía la cuenta de mis turnos en el cuaderno. Ahora todo está ordenado y mis clientas reservan solas."', nombre: '[Nombre clienta]', rol: '[Rubro]', foto: '' },
            { quote: '"Saber cuánto gano cada mes cambió cómo manejo mi negocio. Antes no tenía idea."', nombre: '[Nombre clienta]', rol: '[Rubro]', foto: '' },
            { quote: '"Es simple de usar, no soy nada tecnológica y la entendí en el momento."', nombre: '[Nombre clienta]', rol: '[Rubro]', foto: '' },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="testi-card">
                <p className="testi-stars">★★★★★</p>
                <p className="testi-quote">{t.quote}</p>
                <div className="testi-person">
                  <div className="testi-avatar">
                    {t.foto ? <img src={t.foto} alt={t.nombre} /> : '??'}
                  </div>
                  <div><p className="testi-name">{t.nombre}</p><p className="testi-role">{t.rol}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="precios">
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <p className="section-eyebrow">Precios</p>
            <h2 className="section-title">Elegí el plan que te conviene</h2>
            <p className="section-sub">Probá 15 días gratis. Sin tarjeta de crédito.</p>
          </div>
        </Reveal>

        <div className="planes-grid">
          <Reveal delay={0}>
            <div className="plan-card">
              <p className="plan-nombre">Mensual</p>
              <p className="plan-precio">$7.999 <span>/ mes</span></p>
              <p className="plan-usd">USD 8 / mes</p>
              <ul className="plan-feats">
                <li>Agenda ilimitada</li>
                <li>Gestión de clientes</li>
                <li>Control de finanzas</li>
                <li>Notificaciones en tiempo real</li>
              </ul>
              <a href="/login" className="plan-btn line">Empezar prueba gratis</a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="plan-card destacado">
              <span className="plan-tag">Más elegido</span>
              <p className="plan-nombre">Anual</p>
              <p className="plan-precio">$47.999 <span>/ año</span></p>
              <p className="plan-usd">USD 48 / año · ahorrás 2 meses</p>
              <ul className="plan-feats">
                <li>Todo lo del plan mensual</li>
                <li>2 meses de descuento</li>
                <li>Soporte prioritario</li>
                <li>Actualizaciones incluidas</li>
              </ul>
              <a href="/login" className="plan-btn fill">Empezar prueba gratis</a>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="plan-card">
              <p className="plan-nombre">De por vida</p>
              <p className="plan-precio">$99.999</p>
              <p className="plan-usd">USD 100 · pago único</p>
              <ul className="plan-feats">
                <li>Todo lo del plan anual</li>
                <li>Un solo pago, para siempre</li>
                <li>Sin renovaciones</li>
                <li>Actualizaciones de por vida</li>
              </ul>
              <a href="/login" className="plan-btn line">Empezar prueba gratis</a>
            </div>
          </Reveal>
        </div>

        <p className="prueba-aviso">✦ Todos los planes incluyen 15 días de prueba gratis, sin tarjeta de crédito</p>
      </section>

      <section className="academia-section" id="academia">
        <Reveal>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>Ribel Academia</p>
          <h2 className="section-title">El conocimiento que nadie te enseñó</h2>
          <p className="section-sub">Aprendé a gestionar tu negocio como una profesional, a tu ritmo.</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="academia-card">
            <div className="academia-info">
              <h3>Academia Ribel</h3>
              <p>Un programa completo para que dejes de improvisar y empieces a tomar decisiones con claridad: precios, clientes, agenda y finanzas explicados paso a paso.</p>
              <ul className="academia-list">
                <li>Módulos en video, a tu ritmo</li>
                <li>Material descargable en PDF</li>
                <li>Recursos y herramientas prácticas</li>
                <li>Acceso de por vida</li>
              </ul>
            </div>
            <div className="precio-box">
              <p className="precio-label">Pago único</p>
              <p className="precio-monto">$25.000</p>
              <p className="precio-usd">USD 23 · un solo pago</p>
              <a href="#" className="btn-arena">Quiero la Academia</a>
              <p className="precio-nota">MercadoPago · PayPal · Tarjeta</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="faq-section" id="faqs">
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <p className="section-eyebrow">Preguntas frecuentes</p>
            <h2 className="section-title">Todo lo que necesitás saber</h2>
          </div>
        </Reveal>
        <div className="faq-list">
          <FaqItem q="¿Necesito tarjeta de crédito para probar Ribel?" a="No. Te registrás y tenés 15 días de prueba completa sin cargar ningún dato de pago." />
          <FaqItem q="¿Mis clientes necesitan descargar algo para reservar turno?" a="No, reservan directamente desde un link que vos les compartís, sin instalar nada." />
          <FaqItem q="¿Puedo cancelar cuando quiera?" a="Sí, no hay permanencia mínima. Cancelás tu suscripción cuando lo necesites." />
          <FaqItem q="¿La Academia está incluida en la app?" a="No, son dos productos independientes. La Academia es un pago único separado de la suscripción de la app." />
        </div>
      </section>

      <section className="cta-final">
        <Reveal>
          <h2>Empezá a organizar tu negocio hoy</h2>
          <p>15 días de prueba gratis. Sin tarjeta de crédito.</p>
          <a href="/login" className="btn-primario">Probar Ribel gratis</a>
        </Reveal>
      </section>

      <footer>
        <p>© 2026 Ribel Gestión · <a href="mailto:hola@ribelgestion.com">hola@ribelgestion.com</a></p>
      </footer>
    </>
  )
}