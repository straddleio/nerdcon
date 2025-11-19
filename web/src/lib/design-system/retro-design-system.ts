/**
 * 8-Bit Retro Gaming Design System
 * Inspired by Fintech NerdCon aesthetic
 *
 * Use with shadcn/ui components for a pixel-perfect retro vibe
 */

export const designSystem = {
  // Core Color Palette
  colors: {
    // Primary Neon Cyan (main accent)
    primary: {
      50: '#E0FFFF',
      100: '#B8FFFF',
      200: '#8FFFFE',
      300: '#66FFFE',
      400: '#3DFDFE',
      500: '#00FFFF', // Main cyan
      600: '#00D9D9',
      700: '#00B3B3',
      800: '#008C8C',
      900: '#006666',
      DEFAULT: '#00FFFF',
    },

    // Electric Blue (secondary accent)
    secondary: {
      50: '#E6F0FF',
      100: '#CCE0FF',
      200: '#99C2FF',
      300: '#66A3FF',
      400: '#3385FF',
      500: '#0066FF', // Main blue
      600: '#0052CC',
      700: '#003D99',
      800: '#002966',
      900: '#001433',
      DEFAULT: '#0066FF',
    },

    // Hot Magenta/Pink
    accent: {
      50: '#FFE6F5',
      100: '#FFCCEB',
      200: '#FF99D6',
      300: '#FF66C2',
      400: '#FF33AD',
      500: '#FF0099', // Main magenta
      600: '#CC007A',
      700: '#99005C',
      800: '#66003D',
      900: '#33001F',
      DEFAULT: '#FF0099',
    },

    // Golden Yellow (for special elements)
    gold: {
      50: '#FFF9E6',
      100: '#FFF3CC',
      200: '#FFE799',
      300: '#FFDB66',
      400: '#FFCF33',
      500: '#FFC300', // Main gold
      600: '#CC9C00',
      700: '#997500',
      800: '#664E00',
      900: '#332700',
      DEFAULT: '#FFC300',
    },

    // Status Accent Colors
    'accent-green': {
      DEFAULT: '#39FF14', // Neon green
      dark: '#00FF00',
    },
    'accent-red': {
      DEFAULT: '#FF0040', // Neon red/pink
      dark: '#FF0000',
    },
    'accent-blue': {
      DEFAULT: '#4169FF', // Electric blue
      dark: '#0066FF',
    },

    // Base Dark Colors
    background: {
      DEFAULT: '#0A0E1A', // Deep navy black
      dark: '#050810',
      card: '#0F1524',
      elevated: '#1A2032',
    },

    // Neutral grays with slight blue tint
    neutral: {
      50: '#F0F2F5',
      100: '#E1E5EA',
      200: '#C3CBD5',
      300: '#A5B1C0',
      400: '#8797AB',
      500: '#697D96',
      600: '#546478',
      700: '#3F4B5A',
      800: '#2A323C',
      900: '#15191E',
      DEFAULT: '#697D96',
    },
  },

  // Typography Scale
  typography: {
    fonts: {
      // Pixel fonts (you'll need to import these)
      pixel: '"Press Start 2P", "Courier New", monospace',
      pixelAlt: '"VT323", monospace',
      body: '"Space Mono", "Roboto Mono", monospace',
      display: '"Orbitron", sans-serif',
      sans: 'system-ui, -apple-system, sans-serif',
    },

    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem', // 72px
      '8xl': '6rem', // 96px
    },
  },

  // Spacing (follows 8px grid)
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },

  // Border Radius (mostly sharp for retro feel)
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px - subtle
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    pixel: '2px', // intentionally pixel-y
  },

  // Effects
  effects: {
    // Glow effects for neon elements
    glowCyan:
      '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3), 0 0 30px rgba(0, 255, 255, 0.1)',
    glowBlue:
      '0 0 10px rgba(0, 102, 255, 0.5), 0 0 20px rgba(0, 102, 255, 0.3), 0 0 30px rgba(0, 102, 255, 0.1)',
    glowMagenta:
      '0 0 10px rgba(255, 0, 153, 0.5), 0 0 20px rgba(255, 0, 153, 0.3), 0 0 30px rgba(255, 0, 153, 0.1)',
    glowGold:
      '0 0 10px rgba(255, 195, 0, 0.5), 0 0 20px rgba(255, 195, 0, 0.3), 0 0 30px rgba(255, 195, 0, 0.1)',

    // Scanline effect
    scanlines:
      'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0px, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 2px)',

    // CRT effect
    crt: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.15) 100%)',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
} as const;

// Tailwind CSS configuration extension
export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: designSystem.colors.primary,
        secondary: designSystem.colors.secondary,
        accent: designSystem.colors.accent,
        gold: designSystem.colors.gold,
        'accent-green': designSystem.colors['accent-green'],
        'accent-red': designSystem.colors['accent-red'],
        'accent-blue': designSystem.colors['accent-blue'],
        background: designSystem.colors.background,
        neutral: designSystem.colors.neutral,
      },
      fontFamily: {
        pixel: designSystem.typography.fonts.pixel.split(','),
        'pixel-alt': designSystem.typography.fonts.pixelAlt.split(','),
        body: designSystem.typography.fonts.body.split(','),
        display: designSystem.typography.fonts.display.split(','),
      },
      fontSize: designSystem.typography.sizes,
      spacing: designSystem.spacing,
      borderRadius: designSystem.borderRadius,
      boxShadow: {
        'glow-cyan': designSystem.effects.glowCyan,
        'glow-blue': designSystem.effects.glowBlue,
        'glow-magenta': designSystem.effects.glowMagenta,
        'glow-gold': designSystem.effects.glowGold,
        'glow-primary': designSystem.effects.glowCyan,
        'glow-accent': designSystem.effects.glowMagenta,
        'glow-green': '0 0 10px rgba(57, 255, 20, 0.5), 0 0 20px rgba(57, 255, 20, 0.3)',
        'neon-primary': '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
        'neon-primary-lg': '0 0 15px rgba(0, 255, 255, 0.7), 0 0 30px rgba(0, 255, 255, 0.5)',
        'neon-accent': '0 0 10px rgba(255, 0, 153, 0.5), 0 0 20px rgba(255, 0, 153, 0.3)',
        'neon-accent-lg': '0 0 15px rgba(255, 0, 153, 0.7), 0 0 30px rgba(255, 0, 153, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        flicker: 'flicker 0.15s infinite',
        scan: 'scan 8s linear infinite',
        'pixel-fade-in': 'pixel-fade-in 0.3s ease-out',
        shake: 'shake 0.5s ease-in-out',
        sparkle: 'sparkle 1s ease-out forwards',
        'bounce-subtle': 'bounce-subtle 0.6s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
          },
          '50%': {
            boxShadow:
              '0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
          },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pixel-fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Decision Animation Effects
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'reject-flash': {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0' },
        },
        'approve-glow': {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '0' },
        },
        sparkle: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-50px) scale(0)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [
    // Add text shadow plugin for text-glow utilities
    function ({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, Record<string, string>>) => void;
    }) {
      addUtilities({
        '.text-glow-primary': {
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)',
        },
        '.text-glow-secondary': {
          textShadow: '0 0 10px rgba(0, 102, 255, 0.8), 0 0 20px rgba(0, 102, 255, 0.4)',
        },
        '.text-glow-accent': {
          textShadow: '0 0 10px rgba(255, 0, 153, 0.8), 0 0 20px rgba(255, 0, 153, 0.4)',
        },
      });
    },
  ],
};

// CSS Variables for use in components
export const cssVariables = `
  :root {
    /* Colors */
    --color-primary: ${designSystem.colors.primary.DEFAULT};
    --color-secondary: ${designSystem.colors.secondary.DEFAULT};
    --color-accent: ${designSystem.colors.accent.DEFAULT};
    --color-gold: ${designSystem.colors.gold.DEFAULT};
    --color-background: ${designSystem.colors.background.DEFAULT};
    --color-background-dark: ${designSystem.colors.background.dark};
    --color-background-card: ${designSystem.colors.background.card};
    --color-background-elevated: ${designSystem.colors.background.elevated};
    
    /* Typography */
    --font-pixel: ${designSystem.typography.fonts.pixel};
    --font-pixel-alt: ${designSystem.typography.fonts.pixelAlt};
    --font-body: ${designSystem.typography.fonts.body};
    --font-display: ${designSystem.typography.fonts.display};
    
    /* Effects */
    --effect-glow-cyan: ${designSystem.effects.glowCyan};
    --effect-glow-blue: ${designSystem.effects.glowBlue};
    --effect-glow-magenta: ${designSystem.effects.glowMagenta};
    --effect-glow-gold: ${designSystem.effects.glowGold};
    --effect-scanlines: ${designSystem.effects.scanlines};
    --effect-crt: ${designSystem.effects.crt};
  }
`;

export type DesignSystem = typeof designSystem;
