export const theme = {
  colors: {
    primary: '#722F37',
    gold:    '#C9A84C',
    cream:   '#F5F0E8',
    dark:    '#1A0A0E',
    surface: '#2A1A1E',
    muted:   '#9A8A8E',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius:  { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  font: {
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
  },
} as const

export type Theme = typeof theme
export default theme
