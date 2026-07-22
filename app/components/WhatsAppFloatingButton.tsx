"use client";

export default function WhatsAppFloatingButton() {
  const phoneNumber = "5493492219089"; // Tu número con código de país, sin "+"
  const message = "Hola, tengo una duda sobre Ribel Gestión";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center"
    >
      {/* Tooltip */}
      <span className="absolute right-16 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        ¿Necesitás ayuda?
      </span>

      {/* Anillo de pulso animado */}
      <span className="absolute inline-flex h-14 w-14 rounded-full bg-green-400 opacity-75 animate-ping" />

      {/* Botón principal */}
      <span className="relative inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] shadow-lg hover:scale-110 transition-transform duration-200">
        <svg
          viewBox="0 0 32 32"
          className="h-8 w-8 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.703 4.605 1.918 6.47L4 29l7.72-1.884A11.94 11.94 0 0016.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3zm0 21.75c-1.98 0-3.83-.55-5.41-1.51l-.388-.23-4.58 1.118 1.223-4.46-.253-.406A9.71 9.71 0 016.25 15c0-5.385 4.366-9.75 9.751-9.75S25.75 9.615 25.75 15s-4.366 9.75-9.749 9.75zm5.35-7.29c-.293-.147-1.732-.855-2-.953-.268-.098-.463-.147-.658.147-.195.293-.756.953-.927 1.148-.171.196-.342.22-.635.073-.293-.146-1.236-.455-2.354-1.451-.87-.776-1.458-1.735-1.629-2.028-.171-.293-.018-.451.128-.597.132-.131.293-.342.44-.513.146-.171.195-.293.293-.489.098-.196.049-.367-.024-.514-.073-.147-.658-1.587-.902-2.174-.238-.571-.48-.494-.658-.503-.171-.008-.366-.01-.561-.01-.195 0-.513.073-.782.367-.268.293-1.025 1.002-1.025 2.443 0 1.44 1.05 2.834 1.196 3.03.146.196 2.066 3.155 5.008 4.425.7.302 1.246.483 1.672.618.702.223 1.34.191 1.845.116.563-.084 1.732-.708 1.977-1.392.244-.684.244-1.27.171-1.392-.073-.122-.268-.196-.561-.343z" />
        </svg>
      </span>
    </a>
  );
}