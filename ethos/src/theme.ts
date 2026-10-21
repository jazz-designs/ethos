export const Theme = {
  colors: {
    // Canvas & Surfaces (Clean Minimal White from Design)
    background: '#FFFFFF',
    backgroundPure: '#FFFFFF',
    backgroundCard: '#F8F9FA',
    backgroundSubtle: '#F4F5F7',
    backgroundInput: '#FFFFFF',
    surfaceTonal: '#F8F9FA',

    // Floating Dock (From Design: White pill dock with soft pink active oval)
    dockBg: '#FFFFFF',
    dockActivePill: '#F5E8E8',
    dockTextActive: '#2C3036',
    dockTextInactive: '#6F7983',

    // Typography & General Icons (From User: 6F7983 for icon and stats text, 2C3036 for primary titles)
    textPrimary: '#2C3036',
    textSecondary: '#6F7983',
    textMuted: '#6F7983',
    iconColor: '#6F7983',
    textLight: '#FFFFFF',

    // ── Exact Stat Colors from User ──────────────────────────────────────
    physique: '#FFD5D8',
    intelligence: '#E7F1FD',
    health: '#E9F6ED',
    mental_health: '#FCF2E8',

    // Mood Pastel Palette (Matching Design Doodle Faces)
    moodWorst: '#FFD5D7',
    moodBad: '#FCF2E8',
    moodNeutral: '#E5DEFF',
    moodGood: '#E9F6ED',
    moodExcellent: '#E7F1FD',

    // Semantic Accents
    successGreen: '#48A868',
    dangerRed: '#E06D6D',

    // Retained helpers
    purple: '#7C6EE6',
    purpleLight: '#E7F1FD',
    purpleDark: '#6F7983',
    orange: '#F9733E',
    orangeLight: '#FFD5D8',
    orangeDark: '#6F7983',
    mint: '#24B69B',
    mintLight: '#E9F6ED',
    mintDark: '#6F7983',
    rose: '#F5536B',
    roseLight: '#FFD5D8',
    roseDark: '#6F7983',
    gold: '#F5A623',
    goldLight: '#FCF2E8',
    goldDark: '#B87B11',

    // Hairlines & Subtle Accents
    border: '#EAECEF',
    borderLight: '#F2F4F7',
    divider: '#EAECEF',
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
