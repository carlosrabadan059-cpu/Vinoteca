// ─────────────────────────────────────────────────────────────────────────────
// Vinoteca Design System — fuente de verdad única
// Todos los componentes consumen estos tokens. No usar hex hardcodeados.
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {

  // ── Colors ─────────────────────────────────────────────────────────────────
  colors: {
    // Fondos
    bg:       '#0D0608',   // fondo global de la app
    dark:     '#0D0608',   // alias de bg (retrocompatibilidad)
    surface:  '#1A0F11',   // superficie de cards y paneles
    surface2: '#211419',   // superficie secundaria (chips, badges, inputs)

    // Bordes
    border:   '#2E1E22',   // borde estándar
    borderActive: '#3A2428', // borde en hover/focus leve

    // Acento principal — vino tinto
    primary:       '#722F37',  // fondo chip activo, botones primarios, FAB
    primaryBorder: '#8B3A44',  // borde chip activo (+10% luminosidad)
    primaryDark:   '#5A2029',  // hover/pressed sobre primary

    // Oro — acento secundario editorial
    gold:       '#C9A84C',
    goldSubtle: 'rgba(201,168,76,0.15)',  // fondo chip favoritos activo
    goldBorder: 'rgba(201,168,76,0.7)',   // borde chip favoritos activo

    // Textos
    cream:  '#F5F0E8',   // texto principal, títulos
    text:   '#E8E0D8',   // texto body estándar
    muted:  '#7A6266',   // texto secundario, placeholders
    muted2: '#4A3438',   // texto terciario, separadores, hints
    muted3: '#5A4448',   // chips de tipo/región en lista

    // Retrocompatibilidad — valores anteriores que puede haber en código viejo
    // Se mantienen para no romper componentes que aún no se han migrado
    // TODO: eliminar en Fase 9 tras migrar todos los componentes
    cream_legacy:   '#F0EBE1',
    surface_legacy: '#1A0E10',
    surface2_legacy:'#221318',
    muted_legacy:   '#7A6A6E',
    border_legacy:  '#2E1A1E',
    primary_legacy: '#8B1A2A',

    // Semánticos — estado
    success:      '#22c55e',
    successBg:    '#2D5A27',
    error:        '#E07070',
    errorBg:      '#7A1A1A',
    errorStrong:  '#D32F2F',
    warning:      '#E8A045',
    warningBorder:'rgba(232,160,69,0.4)',

    // Tipos de vino — paleta para badges y gráficos
    tipoTinto:    '#8B1A2A',
    tipoBlanco:   '#D4C87A',
    tipoRosado:   '#C97AA0',
    tipoEspumoso: '#7ABCC9',
    tipoDulce:    '#C9A84C',
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  font: {
    // Tamaños (rem)
    '2xs': '0.55rem',
    xs:   '0.625rem',  // 10px — badges, labels uppercase
    sm:   '0.75rem',   // 12px — texto secundario
    base: '0.875rem',  // 14px — texto body
    md:   '1rem',      // 16px — texto estándar
    lg:   '1.125rem',  // 18px — subtítulos
    xl:   '1.25rem',   // 20px — títulos pequeños
    '2xl':'1.5rem',    // 24px — títulos medios
    '3xl':'1.875rem',  // 30px — títulos grandes
    '4xl':'2.25rem',   // 36px — hero

    // Familias
    serif: "Georgia, 'Times New Roman', serif",
    sans:  "'Inter', system-ui, -apple-system, sans-serif",
  },

  // ── Spacing (px) ───────────────────────────────────────────────────────────
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
  },

  // ── Border radius (px) ─────────────────────────────────────────────────────
  radius: {
    xs:   4,    // badges inline
    sm:   6,    // thumbnails lista, inputs pequeños
    md:   8,    // chips, botones pequeños
    lg:   12,   // radius.lg — retrocompat
    xl:   14,   // cards, paneles, bottom sheets
    '2xl':20,   // modales, sheets grandes
    pill: 9999, // chips redondeados, FAB, full — retrocompat alias
    full: 9999, // retrocompatibilidad
  },

  // ── Borders ────────────────────────────────────────────────────────────────
  borders: {
    width:       '1px',
    widthThin:   '0.5px',
    standard:    '1px solid #2E1E22',
    subtle:      '1px solid rgba(46,30,34,0.6)',
    active:      '1px solid #8B3A44',
    gold:        '1px solid rgba(201,168,76,0.5)',
    goldActive:  '1px solid rgba(201,168,76,0.7)',
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadows: {
    fab:    '0 4px 20px rgba(114,47,55,0.5)',
    card:   '0 2px 12px rgba(13,6,8,0.4)',
    modal:  '0 8px 32px rgba(13,6,8,0.7)',
    subtle: '0 1px 4px rgba(13,6,8,0.3)',
  },

  // ── Gradients ──────────────────────────────────────────────────────────────
  gradients: {
    cardImageOverlay: 'linear-gradient(to top, rgba(13,6,8,0.95) 0%, rgba(13,6,8,0.05) 50%, transparent 100%)',
    heroOverlay:      'linear-gradient(to bottom, rgba(13,6,8,0.40) 0%, rgba(13,6,8,0.05) 25%, rgba(13,6,8,0.72) 62%, #0D0608 100%)',
    bgGlow:           'radial-gradient(ellipse at 50% 20%, rgba(114,47,55,0.06) 0%, transparent 60%)',
    scanBg:           'radial-gradient(ellipse at 50% 0%, #3D1A0F 0%, #1A0A06 40%, #0D0608 75%)',
    shimmer:          'linear-gradient(90deg, #2E1E22 25%, #3A2428 50%, #2E1E22 75%)',
  },

  // ── Image filters ──────────────────────────────────────────────────────────
  imageFilters: {
    wineLabel: 'brightness(1.08) contrast(1.05)',
  },

  // ── Animations ─────────────────────────────────────────────────────────────
  // Duraciones y easings para usar con CSS animations/transitions
  animation: {
    durationFast:   '0.15s',
    durationBase:   '0.25s',
    durationSlow:   '0.35s',
    durationSkeleton: '2.2s',
    easingSpring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easingSmooth:   'ease',
    fabScrollDelay: 600,  // ms antes de que reaparezca el FAB tras scroll
    cardStagger:    40,   // ms de delay entre cards (multiplicar por índice)
  },

  // ── Z-index ────────────────────────────────────────────────────────────────
  zIndex: {
    bg:      0,
    content: 1,
    fab:     50,
    header:  100,
    modal:   200,
    nav:     100,
    proto:   200,
  },

  // ── Dimensiones de componentes ─────────────────────────────────────────────
  sizes: {
    cardGridImageHeight: 158,   // px — imagen en vista grid
    cardListThumbWidth:  52,    // px — thumbnail en vista lista
    cardListThumbHeight: 68,    // px — thumbnail en vista lista
    heroHeight:          238,   // px — hero en WineDetail
    fabSize:             52,    // px — diámetro del FAB
    fabBottomOffset:     76,    // px — distancia desde abajo (sobre bottom nav)
    bottomNavHeight:     68,    // px — altura de la bottom nav
  },

  // ── Typography — escala semántica ─────────────────────────────────────────
  // Cada token cubre un rol específico en la UI. Los componentes no definen
  // fontFamily, fontSize, fontWeight, lineHeight ni letterSpacing manualmente.
  typography: {

    // Títulos de página / hero editorial
    heroTitle: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '1.5rem',     // t.font['2xl']
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '0',
    },

    // Título principal de pantalla (h1 de Bodega, WineDetail…)
    pageTitle: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '1.25rem',    // t.font.xl
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '0',
    },

    // Encabezado de sección dentro de un panel (FilterSection, GroupHeader…)
    sectionTitle: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.78rem',
      fontWeight: 800,
      lineHeight: 1.3,
      letterSpacing: '0.12em',
    },

    // Número protagonista en stats del header (1.6rem, Georgia weight 300)
    statNumber: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '1.6rem',
      fontWeight: 300,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Etiqueta debajo del número de stat ("VINOS", "BOTELLAS"…)
    statLabel: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.55rem',    // t.font['2xs']
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '0.08em',
    },

    // Nombre del vino en vista grid
    cardTitleGrid: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '0.92rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0',
    },

    // Nombre del vino en vista lista
    cardTitleList: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '0.97rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0',
    },

    // Subtítulo de card: bodega, en ambas vistas
    cardSubtitle: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.75rem',    // t.font.sm
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: '0',
    },

    // Añada grande en vista lista (Georgia, thin)
    cardAnada: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '1.1rem',
      fontWeight: 300,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Añada pequeña en vista grid (Georgia, thin)
    cardAnadaSmall: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '0.85rem',
      fontWeight: 300,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Región / DO en vista grid
    cardMetaGrid: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.6rem',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0',
    },

    // Región en vista lista
    cardMetaList: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.68rem',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0',
    },

    // Badge de tipo de vino (TINTO, BLANCO…) en ambas vistas
    badge: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.55rem',    // t.font['2xs']
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.12em',
    },

    // Badge de stock (×3, ×0) en grid
    badgeStock: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.58rem',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Badge de stock en lista y stock pill más grande
    badgeStockList: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.65rem',
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Texto principal de cuerpo (body)
    body: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.875rem',   // t.font.base
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0',
    },

    // Texto secundario más pequeño
    bodySmall: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.75rem',    // t.font.sm
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },

    // Label de sort y chips de filtro
    chipLabel: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.78rem',
      fontWeight: 400,          // 600 cuando activo — sobrescribir en componente
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Input de añada (panel filtros)
    inputAnada: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize:   '1.05rem',
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: '0',
    },

    // Group header label (BODEGA MUGA…)
    groupHeader: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.72rem',
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: '0.14em',
    },

    // Caption y hints pequeños (hint swipe, meta resultados…)
    caption: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.65rem',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0',
    },

    // Micro: label de campo en inputs, eyebrows uppercase
    micro: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.625rem',   // t.font.xs
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '0.06em',
    },

    // Etiqueta typeLabel en autocomplete (VINO, BODEGA, D.O…)
    suggestionType: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.625rem',   // t.font.xs
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '0.08em',
    },

    // Emoji en sugerencias de autocomplete
    suggestionEmoji: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.9rem',
      fontWeight: 400,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Botones primarios y secundarios
    button: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '1rem',       // t.font.md
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '0',
    },

    // Sort label en toolbar (Fila 4)
    sortLabel: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize:   '0.75rem',    // t.font.sm
      fontWeight: 400,
      lineHeight: 1,
      letterSpacing: '0',
    },

  },

} as const

export type Theme = typeof theme
export type ColorKey = keyof typeof theme.colors
export type FontSizeKey = keyof typeof theme.font
export type RadiusKey = keyof typeof theme.radius

// ── CSS Keyframes — inyectar una sola vez en el DOM ────────────────────────
// Usar: injectKeyframes() en el layout raíz o en el primer componente que los necesite.
export const KEYFRAMES_CSS = `
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`

export function injectKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById('vinoteca-keyframes')) return
  const style = document.createElement('style')
  style.id = 'vinoteca-keyframes'
  style.textContent = KEYFRAMES_CSS
  document.head.appendChild(style)
}

export default theme
