'use client';

import { useState } from 'react';

export default function PagoExitosoPage() {
  const [email, setEmail] = useState('');

  const numeroAdmin = '5493492219089'; // TODO: reemplazar por tu número, con código de país, sin +
  const mensaje = `Hola! Realicé el pago de mi suscripción en Ribel Gestión.\nMi mail de registro es: ${email}`;
  const linkWhatsapp = `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`;

  const emailValido = email.trim().length > 3 && email.includes('@');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e3dfd6] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#161616] mb-2">¡Pago recibido! 🎉</h1>
        <p className="text-[#161616]/70 mb-4">
          Para activar tu cuenta más rápido, confirmanos el pago por WhatsApp.
        </p>

        <label className="block text-left text-sm text-[#161616]/70 mb-1">
          Mail con el que te registraste en Ribel Gestión
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@mail.com"
          className="w-full border border-[#161616]/20 rounded-xl px-4 py-2 mb-1 focus:outline-none focus:border-[#ba9a7d]"
        />

        {!emailValido && email.length > 0 && (
          <p className="text-left text-sm text-red-500 mb-4">
            Ingresá un mail válido para continuar
          </p>
        )}

        {email.length === 0 && (
          <p className="text-left text-sm text-[#161616]/40 mb-4">
            Completá tu mail para habilitar el botón
          </p>
        )}

        {emailValido && <div className="mb-4" />}

        <a
          href={emailValido ? linkWhatsapp : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!emailValido}
          className={`inline-block px-6 py-3 rounded-xl font-medium transition ${
            emailValido
              ? 'bg-[#ba9a7d] text-white'
              : 'bg-[#ba9a7d]/40 text-white cursor-not-allowed pointer-events-none'
          }`}
        >
          Confirmar pago por WhatsApp
        </a>

        <p className="text-sm text-[#161616]/50 mt-4">
          Tu cuenta se activará a la brevedad, con la acreditación del pago.
        </p>
      </div>
    </div>
  );
}