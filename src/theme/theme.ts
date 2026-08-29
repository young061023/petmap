export const theme = {
  colors: {
    // 1. App Main Background set to #FFE7FF
    background: '#FFE7FF',       // #FFE7FF (Soft Light Pink Tint)
    cardBackground: '#FFFFFF',

    // 5 Pastel Palette Accent Colors:
    pastelYellow: '#FFFABF',     // #FFFABF (Soft Yellow Accent)
    pastelSoftPink: '#FFE7FF',   // #FFE7FF (Soft Light Pink)
    pastelMint: '#B2F9E7',       // #B2F9E7 (Pastel Mint)
    pastelPinkDark: '#F4ADCF',   // #F4ADCF (Rose Pink Accent)
    pastelLavender: '#BFC4FF',   // #BFC4FF (Periwinkle Blue Accent)

    primaryMint: '#B2F9E7',
    primaryMintDark: '#2CA58D',
    pastelPink: '#F4ADCF',
    pastelPinkSoft: '#FFE7FF',
    pastelMintSoft: '#EAFDF7',
    pastelPurple: '#BFC4FF',
    pastelPurpleSoft: '#F2F3FF',

    textMain: '#2C3036',
    textSub: '#6E6E73',
    textLight: '#A0A0A8',
    border: 'rgba(244, 173, 207, 0.4)',
    divider: 'rgba(244, 173, 207, 0.3)',
    selectedUnderline: '#F4ADCF',
  },
  fontFamily: {
    regular: 'NanumSquareRound',
    bold: 'NanumSquareRoundB',
    extraBold: 'NanumSquareRoundEB',
  },
  shadows: {
    soft: {
      shadowColor: '#8A5070',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    gentle: {
      shadowColor: '#7A4060',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    floating: {
      shadowColor: '#F4ADCF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 26,
    full: 999,
  },
  typography: {
    title: {
      fontFamily: 'NanumSquareRound',
      fontSize: 26,
      fontWeight: '800' as const,
      color: '#2C3036',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontFamily: 'NanumSquareRound',
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#6E6E73',
      lineHeight: 20,
    },
    headerDate: {
      fontFamily: 'NanumSquareRound',
      fontSize: 22,
      fontWeight: '800' as const,
      color: '#2C3036',
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    sectionTitle: {
      fontFamily: 'NanumSquareRound',
      fontSize: 17,
      fontWeight: '700' as const,
      color: '#2C3036',
    },
  },
};
