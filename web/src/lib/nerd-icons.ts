/**
 * Nerd Fonts Icon Mapping
 * Terminal-style icons using Unicode characters
 *
 * For a proper retro terminal aesthetic, we use:
 * - Standard Unicode symbols that are widely supported
 * - Nerd Font glyphs from Private Use Area (PUA) when available
 *
 * To use actual Nerd Fonts, ensure a Nerd Font is loaded in CSS.
 * Currently using Space Mono which can be replaced with Space Mono Nerd Font.
 */

export const NerdIcons = {
  // Status indicators
  checkmark: '✓',      // U+2713
  cross: '✗',          // U+2717
  warning: '⚠',        // U+26A0

  // Traffic lights / risk indicators
  circleFilled: '●',   // U+25CF - High risk
  circleHalf: '◐',     // U+25D0 - Medium risk
  circleEmpty: '○',    // U+25CB - Low risk / pending

  // Alternative circle styles
  dotLarge: '⬤',       // U+2B24 - Large filled circle
  dotSmall: '•',       // U+2022 - Small filled circle

  // Progress / status
  active: '◉',         // U+25C9 - Circle with dot
  complete: '✓',       // U+2713 - Checkmark
  pending: '○',        // U+25CB - Empty circle

  // Arrows
  arrowRight: '→',     // U+2192
  arrowLeft: '←',      // U+2190
  arrowUp: '↑',        // U+2191
  arrowDown: '↓',      // U+2193

  // Terminal / tech symbols
  terminal: '❯',       // U+276F
  prompt: '▸',         // U+25B8
  chevronRight: '›',   // U+203A

  // Boxes / borders
  square: '■',         // U+25A0
  squareEmpty: '□',    // U+25A1

  // Money / payment
  dollar: '$',         // U+0024
  coin: '◎',          // U+25CE

  // Location / geo
  pin: '◈',           // U+25C8
  globe: '◉',          // U+25C9 (alternative)
  mapPin: '📍',       // U+1F4CD - Map pin

  // Security / compliance
  shield: '🛡',        // U+1F6E1 - Shield
  calendar: '📅',      // U+1F4C5 - Calendar

  // Misc
  star: '★',           // U+2605
  starEmpty: '☆',      // U+2606
  info: 'ℹ',           // U+2139
  question: '？',      // U+FF1F
} as const;

export type NerdIconName = keyof typeof NerdIcons;

/**
 * Component-friendly icon getter
 * Usage: <span>{getIcon('checkmark')}</span>
 */
export function getIcon(name: NerdIconName): string {
  return NerdIcons[name];
}

/**
 * Risk indicator helper - maps risk scores to traffic light icons
 */
export function getRiskIcon(score: number): string {
  if (score < 0.1) {return NerdIcons.circleEmpty;}  // Green/Low
  if (score < 0.5) {return NerdIcons.circleHalf;}   // Yellow/Medium
  return NerdIcons.circleFilled;                  // Red/High
}

/**
 * Status icon helper - maps common statuses to icons
 */
export function getStatusIcon(status: 'complete' | 'active' | 'pending' | 'failed'): string {
  switch (status) {
    case 'complete':
      return NerdIcons.checkmark;
    case 'active':
      return NerdIcons.active;
    case 'pending':
      return NerdIcons.pending;
    case 'failed':
      return NerdIcons.cross;
  }
}

/**
 * Decision icon helper - maps verification decisions to icons
 */
export function getDecisionIcon(decision: 'verified' | 'review' | 'rejected'): string {
  switch (decision) {
    case 'verified':
      return NerdIcons.checkmark;
    case 'review':
      return NerdIcons.warning;
    case 'rejected':
      return NerdIcons.cross;
  }
}

/**
 * Charge status icon helper - maps charge statuses to specific icons
 * For use with PizzaTracker - returns icon name for react-icons
 */
export function getChargeStatusIconType(status: string): 'plus' | 'calendar' | 'hourglass' | 'dollar' | 'cross' {
  switch (status) {
    case 'created':
      return 'plus';        // + - Created/initialized
    case 'scheduled':
      return 'calendar';    // 📅 - Scheduled/queued
    case 'pending':
      return 'hourglass';   // ⌛ - In progress
    case 'paid':
      return 'dollar';      // $ - Completed
    case 'failed':
    case 'cancelled':
      return 'cross';       // ✗ - Failed/Cancelled
    default:
      return 'hourglass';   // Default
  }
}
