export const theme = {
  colors: {
    primary:  '#8B1A2A',
    gold:     '#C9A84C',
    cream:    '#F0EBE1',
    dark:     '#0D0608',
    surface:  '#1A0E10',
    surface2: '#221318',
    muted:    '#7A6A6E',
    border:   '#2E1A1E',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius:  { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  font: {
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
  },
} as const

export type Theme = typeof theme
export default theme
