export const Theme = {
  colors: {
    // Canvas & Surfaces (Warm Organic Cream from Screenshot)
    background: '#F8F6F0',
    backgroundPure: '#FFFFFF',
    backgroundCard: '#FFFFFF',
    backgroundSubtle: '#F0ECE1',
    backgroundInput: '#FFFFFF',
    surfaceTonal: '#F4EFE6',

    // Floating Dock (Signature Charcoal Slate from Screenshot)
    dockBg: '#181922',
    dockPillActive: '#2C2D3A',
    dockIconInactive: '#858797',
    dockIconActive: '#FFFFFF',

    // Typography
    textPrimary: '#17181F',
    textSecondary: '#5E6072',
    textMuted: '#9699A8',
    textLight: '#FFFFFF',

    // Periwinkle Lavender (Wisdom / Intelligence & Top Banner Card)
    purple: '#7C6EE6',
    purpleLight: '#EFEBFF',
    purpleDark: '#4A3CC4',

    // Warm Tangerine (Strength & Badges from Screenshot)
    orange: '#F9733E',
    orangeLight: '#FFF0EA',
    orangeDark: '#D4531F',

    // Seafoam Mint (Mental Health & Positive Gains)
    mint: '#24B69B',
    mintLight: '#E3F8F2',
    mintDark: '#16806C',

    // Coral Rose (Health & Drops)
    rose: '#F5536B',
    roseLight: '#FFEBF0',
    roseDark: '#CB243F',

    // Star Honey Gold (Level Ups & Excellent Mood)
    gold: '#F5A623',
    goldLight: '#FEF6E6',
    goldDark: '#B87B11',

    // Hairlines & Subtle Accents
    border: '#EBE7DC',
    borderLight: '#F3F0E6',
    divider: '#EBE6DA',
  },

  // 4-Point Grid Spacing Scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Smooth Continuous Radii
  radii: {
    xs: 8,
    sm: 14,
    md: 20,
    lg: 26,
    xl: 32,
    full: 9999,
  },

  // Typography Scale (Inspired by Apple HIG & Reference Designs)
  typography: {
    largeTitle: {
      fontSize: 28,
      fontWeight: '900' as const,
      letterSpacing: -0.8,
    },
    title: {
      fontSize: 22,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    headline: {
      fontSize: 17,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    subhead: {
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    footnote: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
  },

  // Modern Native Shadows (Refined & Subtle, No Harsh Shadowboxing)
  shadows: {
    subtle: {
      boxShadow: '0 2px 8px rgba(23, 24, 31, 0.03)',
      shadowColor: '#17181F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    card: {
      boxShadow: '0 4px 16px rgba(23, 24, 31, 0.05)',
      shadowColor: '#17181F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 2,
    },
    float: {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
