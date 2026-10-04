// =====================================================================
// fichasConfig.ts
// Define QUE campos tiene la ficha tecnica de cada rubro.
// Para agregar o cambiar un campo, se edita solo este archivo.
// =====================================================================

export type RubroId =
  | 'unas'
  | 'masajes'
  | 'depilacion'
  | 'peluqueria'
  | 'cosmetologia'

export const RUBROS: { id: RubroId; nombre: string }[] = [
  { id: 'unas', nombre: 'Uñas' },
  { id: 'masajes', nombre: 'Masajes' },
  { id: 'depilacion', nombre: 'Depilación' },
  { id: 'peluqueria', nombre: 'Peluquería' },
  { id: 'cosmetologia', nombre: 'Cosmetología' },
]

// Datos que ya existen en la tabla "clientes" y se muestran solos
export type DatoDelCliente = 'nombre' | 'whatsapp' | 'fecha_nacimiento'

export type CampoFicha =
  | { tipo: 'titulo'; etiqueta: string; ayuda?: string }
  | { tipo: 'clienteDato'; campo: DatoDelCliente; etiqueta: string }
  | { tipo: 'edad'; etiqueta: string }
  | { tipo: 'texto'; clave: string; etiqueta: string; placeholder?: string }
  | { tipo: 'textoLargo'; clave: string; etiqueta: string; placeholder?: string }
  | { tipo: 'select'; clave: string; etiqueta: string; opciones: string[] }
  | { tipo: 'chips'; clave: string; etiqueta: string; opciones: string[] }
  | { tipo: 'interruptor'; clave: string; etiqueta: string }
  | { tipo: 'procedimientos'; clave: string; etiqueta: string }

// Cada procedimiento de la ficha de masajes: servicio + zona
export type Procedimiento = { servicio: string; zona: string }

// Campos que aparecen en la ficha de TODOS los rubros
export const CAMPOS_GENERALES: CampoFicha[] = [
  {
    tipo: 'titulo',
    etiqueta: 'Datos personales',
    ayuda:
      'Nombre y teléfono vienen del registro del cliente. La fecha de nacimiento se completa acá y se guarda en el cliente.',
  },
  { tipo: 'clienteDato', campo: 'nombre', etiqueta: 'Nombre y apellido' },
  { tipo: 'texto', clave: 'domicilio', etiqueta: 'Domicilio' },
  { tipo: 'clienteDato', campo: 'whatsapp', etiqueta: 'Teléfono' },
  {
    tipo: 'clienteDato',
    campo: 'fecha_nacimiento',
    etiqueta: 'Fecha de nacimiento',
  },
  { tipo: 'edad', etiqueta: 'Edad' },
  {
    tipo: 'select',
    clave: 'sexo',
    etiqueta: 'Sexo',
    opciones: ['Femenino', 'Masculino', 'Otro'],
  },
  { tipo: 'titulo', etiqueta: 'Datos generales' },
  { tipo: 'texto', clave: 'alergias', etiqueta: 'Alergias' },
  {
    tipo: 'texto',
    clave: 'condiciones',
    etiqueta: 'Condiciones a tener en cuenta',
  },
  { tipo: 'texto', clave: 'medicacion', etiqueta: 'Medicación' },
]

// Campos propios de cada rubro
export const CAMPOS_POR_RUBRO: Record<RubroId, CampoFicha[]> = {
  masajes: [
    { tipo: 'titulo', etiqueta: 'Información confidencial' },
    {
      tipo: 'chips',
      clave: 'confidencial',
      etiqueta: 'Marcá lo que corresponda',
      opciones: [
        'Diabetes',
        'Alergias',
        'Problemas cardíacos',
        'Problemas respiratorios',
        'Cáncer',
        'Embarazo',
        'Hipertensión',
        'Enfermedad',
      ],
    },
    { tipo: 'texto', clave: 'otro', etiqueta: 'Otro' },
    {
      tipo: 'titulo',
      etiqueta: 'Procedimientos',
      ayuda: 'Escribí y elegí de tus servicios, o usá un nombre nuevo.',
    },
    {
      tipo: 'procedimientos',
      clave: 'procedimientos',
      etiqueta: 'Procedimientos',
    },
    {
      tipo: 'select',
      clave: 'presion',
      etiqueta: 'Presión preferida',
      opciones: ['Suave', 'Media', 'Firme'],
    },
  ],

  unas: [
    {
      tipo: 'select',
      clave: 'estado_unas',
      etiqueta: 'Estado de las uñas',
      opciones: ['Sanas', 'Quebradizas', 'Con hongos', 'Post acrílico'],
    },
    {
      tipo: 'select',
      clave: 'servicio_habitual',
      etiqueta: 'Servicio habitual',
      opciones: ['Semipermanente', 'Esculpidas', 'Kapping'],
    },
    {
      tipo: 'interruptor',
      clave: 'alergia_acrilicos',
      etiqueta: 'Alergia a acrílicos o monómeros',
    },
    { tipo: 'texto', clave: 'marca_tono', etiqueta: 'Marca y tono usados' },
  ],

  depilacion: [
    {
      tipo: 'select',
      clave: 'tipo_piel',
      etiqueta: 'Tipo de piel',
      opciones: ['Normal', 'Seca', 'Grasa', 'Sensible'],
    },
    {
      tipo: 'select',
      clave: 'metodo',
      etiqueta: 'Método',
      opciones: ['Cera', 'Láser', 'Otro'],
    },
    {
      tipo: 'chips',
      clave: 'zonas',
      etiqueta: 'Zonas',
      opciones: ['Piernas', 'Axilas', 'Bikini', 'Rostro', 'Brazos', 'Espalda'],
    },
    {
      tipo: 'texto',
      clave: 'reacciones_previas',
      etiqueta: 'Reacciones previas',
    },
    {
      tipo: 'interruptor',
      clave: 'medicacion_fotosensibilizante',
      etiqueta: 'Toma medicación fotosensibilizante',
    },
  ],

  peluqueria: [
    {
      tipo: 'select',
      clave: 'tipo_cabello',
      etiqueta: 'Tipo de cabello',
      opciones: ['Liso', 'Ondulado', 'Rizado', 'Crespo'],
    },
    {
      tipo: 'select',
      clave: 'estado_cabello',
      etiqueta: 'Estado del cabello',
      opciones: ['Sano', 'Seco', 'Dañado', 'Teñido'],
    },
    {
      tipo: 'chips',
      clave: 'quimicos_previos',
      etiqueta: 'Historial de químicos',
      opciones: ['Coloración', 'Decoloración', 'Alisado', 'Permanente'],
    },
    {
      tipo: 'interruptor',
      clave: 'test_alergia',
      etiqueta: 'Test de alergia realizado',
    },
    {
      tipo: 'textoLargo',
      clave: 'formulas',
      etiqueta: 'Fórmulas usadas',
      placeholder: 'Marca, tono, oxidante, tiempo de exposición',
    },
  ],

  cosmetologia: [
    {
      tipo: 'select',
      clave: 'fototipo',
      etiqueta: 'Fototipo',
      opciones: ['I', 'II', 'III', 'IV', 'V', 'VI'],
    },
    {
      tipo: 'select',
      clave: 'tipo_piel',
      etiqueta: 'Tipo de piel',
      opciones: ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible'],
    },
    {
      tipo: 'textoLargo',
      clave: 'tratamientos_previos',
      etiqueta: 'Tratamientos previos',
    },
    {
      tipo: 'textoLargo',
      clave: 'productos_en_uso',
      etiqueta: 'Productos en uso',
    },
    { tipo: 'textoLargo', clave: 'rutina', etiqueta: 'Rutina actual' },
  ],
}

// Ayudas chicas que usa el resto de la app
export function nombreDelRubro(id: string): string {
  return RUBROS.find((r) => r.id === id)?.nombre ?? id
}

export function esRubroValido(id: string): id is RubroId {
  return RUBROS.some((r) => r.id === id)
}

// Campos completos de la ficha de un rubro: generales + propios
export function camposDeFicha(rubro: RubroId): CampoFicha[] {
  return [...CAMPOS_GENERALES, ...CAMPOS_POR_RUBRO[rubro]]
}

// Calcula la edad a partir de la fecha de nacimiento (formato AAAA-MM-DD)
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null
  const nacimiento = new Date(fechaNacimiento)
  if (Number.isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const cumpleEsteAnio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() >= nacimiento.getDate())
  if (!cumpleEsteAnio) edad -= 1
  return edad
}