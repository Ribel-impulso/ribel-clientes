'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blanco: #ffffff;
          --negro: #161616;
          --crema: #e3dfd6;
          --arena: #ba9a7d;
          --arena-claro: #d4bfab;
          --gris: #6b6b6b;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--blanco);
          color: var(--negro);
        }

        /* NAV */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          background: rgba(255,255,255,0.93);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--crema);
        }

        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--negro);
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 36px;
          list-style: none;
        }

        .nav-links a {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--negro);
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .nav-links a:hover { opacity: 1; }

        .nav-links .nav-cta {
          opacity: 1;
          padding: 9px 22px;
          background: var(--negro);
          color: var(--blanco) !important;
          border-radius: 2px;
          transition: background 0.2s;
        }

        .nav-links .nav-cta:hover { background: var(--arena); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 140px 24px 100px;
          background: var(--crema);
          position: relative;
          overflow: hidden;
        }

        .hero::after {
          content: '';
          position: absolute;
          bottom: -200px; right: -200px;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--arena-claro) 0%, transparent 65%);
          opacity: 0.4;
          pointer-events: none;
        }

        .hero-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--arena);
          margin-bottom: 28px;
        }

        .hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 8vw, 96px);
          font-weight: 300;
          line-height: 1.05;
          color: var(--negro);
          max-width: 820px;
          margin-bottom: 32px;
        }

        .hero h1 em {
          font-style: italic;
          color: var(--arena);
        }

        .hero-sub {
          font-size: 17px;
          font-weight: 300;
          color: var(--gris);
          max-width: 440px;
          margin-bottom: 56px;
          line-height: 1.75;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-negro {
          display: inline-block;
          padding: 15px 40px;
          background: var(--negro);
          color: var(--blanco);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: background 0.25s, transform 0.2s;
        }

        .btn-negro:hover {
          background: var(--arena);
          transform: translateY(-2px);
        }

        .btn-outline {
          display: inline-block;
          padding: 15px 40px;
          background: transparent;
          color: var(--negro);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(22,22,22,0.3);
          border-radius: 2px;
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }

        .btn-outline:hover {
          border-color: var(--negro);
          background: var(--negro);
          color: var(--blanco);
          transform: translateY(-2px);
        }

        /* PARA QUIEN */
        .para-quien {
          padding: 100px 24px;
          background: var(--blanco);
          text-align: center;
        }

        .section-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--arena);
          margin-bottom: 18px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 58px);
          font-weight: 300;
          line-height: 1.2;
          margin-bottom: 18px;
        }

        .section-sub {
          font-size: 16px;
          font-weight: 300;
          color: var(--gris);
          max-width: 500px;
          margin: 0 auto 56px;
          line-height: 1.75;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          max-width: 700px;
          margin: 0 auto;
        }

        .tag {
          padding: 10px 24px;
          border: 1px solid var(--arena);
          border-radius: 40px;
          font-size: 13px;
          font-weight: 400;
          color: var(--negro);
          letter-spacing: 0.02em;
        }

        /* APP */
        .app-section {
          padding: 100px 24px;
          background: var(--crema);
        }

        .section-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .app-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          margin-top: 64px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .feature {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 50%;
          background: var(--blanco);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .feature-body h4 {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 5px;
          color: var(--negro);
        }

        .feature-body p {
          font-size: 14px;
          color: var(--gris);
          line-height: 1.65;
          font-weight: 300;
        }

        .pricing-box {
          background: var(--blanco);
          border-radius: 4px;
          padding: 48px 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .pricing-box h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          text-align: center;
          margin-bottom: 36px;
        }

        .planes {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .plan {
          padding: 22px 24px;
          border: 1px solid var(--crema);
          border-radius: 3px;
          position: relative;
        }

        .plan.pro {
          border-color: var(--arena);
        }

        .plan-badge {
          position: absolute;
          top: -10px; right: 16px;
          background: var(--arena);
          color: var(--blanco);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 12px;
          border-radius: 20px;
        }

        .plan-nombre {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gris);
          margin-bottom: 4px;
        }

        .plan-precio {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 400;
          color: var(--negro);
          line-height: 1;
        }

        .plan-precio span {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--gris);
        }

        .plan-desc {
          font-size: 12px;
          color: var(--gris);
          margin-top: 5px;
          font-weight: 300;
        }

        .btn-full {
          display: block;
          width: 100%;
          padding: 14px;
          background: var(--negro);
          color: var(--blanco);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          text-align: center;
          transition: background 0.2s, transform 0.2s;
        }

        .btn-full:hover {
          background: var(--arena);
          transform: translateY(-1px);
        }

        /* ACADEMIA */
        .academia-section {
          padding: 100px 24px;
          background: var(--negro);
          color: var(--blanco);
          text-align: center;
        }

        .academia-section .section-eyebrow { color: var(--arena); }
        .academia-section .section-title { color: var(--blanco); }
        .academia-section .section-sub { color: rgba(255,255,255,0.5); }

        .academia-card {
          max-width: 1000px;
          margin: 0 auto;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          text-align: left;
        }

        .academia-info h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 300;
          line-height: 1.15;
          color: var(--blanco);
          margin-bottom: 20px;
        }

        .academia-info p {
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          margin-bottom: 36px;
        }

        .academia-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .academia-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          font-weight: 300;
        }

        .academia-list li::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--arena);
          flex-shrink: 0;
        }

        .precio-box {
          background: rgba(186,154,125,0.1);
          border: 1px solid rgba(186,154,125,0.25);
          border-radius: 4px;
          padding: 48px 40px;
          text-align: center;
        }

        .precio-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--arena);
          margin-bottom: 20px;
        }

        .precio-monto {
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px;
          font-weight: 300;
          color: var(--blanco);
          line-height: 1;
          margin-bottom: 6px;
        }

        .precio-usd {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 36px;
          font-weight: 300;
        }

        .btn-arena {
          display: block;
          width: 100%;
          padding: 15px;
          background: var(--arena);
          color: var(--blanco);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          text-align: center;
          transition: background 0.2s, transform 0.2s;
          margin-bottom: 14px;
        }

        .btn-arena:hover {
          background: var(--arena-claro);
          transform: translateY(-1px);
        }

        .precio-nota {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          font-weight: 300;
        }

        /* FOOTER */
        footer {
          background: var(--negro);
          border-top: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.3);
          text-align: center;
          padding: 40px 24px;
          font-size: 13px;
          font-weight: 300;
        }

        footer a {
          color: var(--arena);
          text-decoration: none;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .nav { padding: 16px 20px; }
          .nav-links { display: none; }
          .app-grid { grid-template-columns: 1fr; gap: 48px; margin-top: 48px; }
          .academia-card { grid-template-columns: 1fr; padding: 36px 24px; gap: 40px; }
          .hero h1 { font-size: 48px; }
          .hero-ctas { flex-direction: column; align-items: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">Ribel</a>
        <ul className="nav-links">
          <li><a href="#app">La App</a></li>
          <li><a href="#academia">Academia</a></li>
          <li><a href="/login" className="nav-cta">Ingresar</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <p className="hero-eyebrow">Para profesionales de la belleza y el bienestar</p>
        <h1>Gestioná tu negocio.<br /><em>Crecé como profesional.</em></h1>
        <p className="hero-sub">Todo lo que necesitás para organizar tu agenda, tus clientes y tus finanzas — y la formación para llevar tu negocio al siguiente nivel.</p>
        <div className="hero-ctas">
          <a href="#app" className="btn-negro">Conocer la App</a>
          <a href="#academia" className="btn-outline">Ver Academia</a>
        </div>
      </section>

      {/* PARA QUIEN */}
      <section className="para-quien">
        <p className="section-eyebrow">¿Para quién es Ribel?</p>
        <h2 className="section-title">Hecho para quienes trabajan<br />de forma independiente</h2>
        <p className="section-sub">Si tenés tu propio negocio en el mundo de la salud, la belleza o el bienestar, Ribel está pensado para vos.</p>
        <div className="tags">
          {['Esteticistas', 'Masajistas', 'Manicuras', 'Cosmetólogas', 'Instructoras de yoga', 'Nutricionistas', 'Psicólogas', 'Kinesiólogas', 'Personal trainers'].map(p => (
            <span key={p} className="tag">{p}</span>
          ))}
        </div>
      </section>

      {/* APP */}
      <section className="app-section" id="app">
        <div className="section-inner">
          <div style={{ textAlign: 'center' }}>
            <p className="section-eyebrow">Ribel Gestión — La App</p>
            <h2 className="section-title">Tu negocio organizado,<br />desde el celular</h2>
            <p className="section-sub">Agenda, clientes, servicios y finanzas en un solo lugar. Sin papeles, sin excusas.</p>
          </div>

          <div className="app-grid">
            <div className="features">
              {[
                { icon: '📅', title: 'Agenda inteligente', desc: 'Gestioná tus turnos con horarios de mañana y tarde configurables. Tus clientes reservan solos.' },
                { icon: '👥', title: 'Gestión de clientes', desc: 'Historial, datos y seguimiento de cada clienta en un solo lugar.' },
                { icon: '💰', title: 'Control de finanzas', desc: 'Registrá ingresos y gastos. Sabé exactamente cómo está tu negocio cada mes.' },
                { icon: '🔔', title: 'Notificaciones en tiempo real', desc: 'Recibís un aviso cada vez que alguien reserva un turno.' },
              ].map(f => (
                <div key={f.title} className="feature">
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-body">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pricing-box">
              <h3>Elegí tu plan</h3>
              <div className="planes">
                <div className="plan">
                  <p className="plan-nombre">Básico</p>
                  <p className="plan-precio">Gratis <span>para siempre</span></p>
                  <p className="plan-desc">Funciones esenciales para arrancar</p>
                </div>
                <div className="plan pro">
                  <span className="plan-badge">Más elegido</span>
                  <p className="plan-nombre">Pro</p>
                  <p className="plan-precio">$7.000 <span>/ mes</span></p>
                  <p className="plan-desc">Todas las funciones, sin límites</p>
                </div>
              </div>
              <a href="/login" className="btn-full">Empezar gratis</a>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIA */}
      <section className="academia-section" id="academia">
        <p className="section-eyebrow">Ribel Academia</p>
        <h2 className="section-title">El conocimiento que<br />nadie te enseñó</h2>
        <p className="section-sub">Aprendé a gestionar tu negocio como una profesional. Formación práctica, a tu ritmo.</p>

        <div className="academia-card">
          <div className="academia-info">
            <h3>Academia Ribel</h3>
            <p>Un programa completo para que dejes de improvisar y empieces a tomar decisiones con claridad. Precios, clientes, agenda, finanzas — todo lo que necesitás saber para que tu negocio funcione de verdad.</p>
            <ul className="academia-list">
              <li>Módulos en video, a tu ritmo</li>
              <li>Material descargable en PDF</li>
              <li>Recursos y herramientas prácticas</li>
              <li>Acceso de por vida</li>
              <li>Actualizaciones incluidas</li>
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
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2026 Ribel Gestión · <a href="mailto:hola@ribelgestion.com">hola@ribelgestion.com</a></p>
      </footer>
    </>
  )
}