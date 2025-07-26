// Design System para o aplicativo de agendamento
export const Colors = {
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6E6E73',
  primary: '#007AFF',
  border: '#E5E5EA',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  blockBackground: '#EFEFF4',
};

export const Typography = {
  H1: {
    fontSize: 26,
    fontWeight: 'bold' as const,
  },
  H2: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  Body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  BodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  Caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  Button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export const Spacing = {
  base: 8,
  screenPadding: 16,
  cardRadius: 12,
  buttonRadius: 8,
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const Icons = {
  size: 22,
  color: Colors.textSecondary,
}; 