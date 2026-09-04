/**
 * Single source of truth for the product brand.
 *
 * The *product* is Cowrywise FC — that name is fixed and appears in the
 * sidebar, page metadata, the PWA manifest and the sign-in screen.
 * The *league* name is a separate, admin-editable setting (Admin → Settings)
 * and is shown as supporting text, never as the product name.
 */
export const BRAND_NAME = 'Cowrywise FC'
export const BRAND_SHORT = 'Cowrywise FC'
export const BRAND_TAGLINE = 'Sunday league, properly run'
/** Short label for tight spots such as the sidebar sub-line. */
export const BRAND_SUBLABEL = 'Sunday League'
export const BRAND_DESCRIPTION =
  'Fixtures, results, standings and player records for Cowrywise FC.'

/** Brand colours mirrored from globals.css, for metadata and manifest. */
export const BRAND_COLORS = {
  background: '#0B111D',
  theme: '#0B111D',
  accent: '#AEF35F'
} as const

/** Fallback league label used before settings load or if none is set. */
export const DEFAULT_LEAGUE_NAME = 'Cowrywise FC'
