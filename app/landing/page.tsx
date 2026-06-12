"use client";
export default function Landing() {
  return (
    <main className="landing">
      <nav className="nav">
        <div className="logo">ribel<span>.</span></div>
        <a href="/login" className="nav-link">Iniciar sesión</a>
      </nav>

      <section className="hero">
        <p className="eyebrow">¡Hola, bienvenido!</p>
        <h1 className="headline">Gestioná <span className="accent">tu</span></h1>
        <h1 className="headline-sub">negocio</h1>
        <p className="subtext">
          Gestioná tus clientes, turnos y finanzas en un solo lugar.<br />
          Simple, fácil y de manera organizada.
        </p>
        <div className="cta-wrap">
          <a href="/login" className="btn-primary">Empezar ahora</a>
          <span className="fine-print">Probá gratis por 15 días.</span>
        </div>
      </section>
    </main>
  );
}