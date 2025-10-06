import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps {
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  style?: ViewStyle;
}

interface CardContentProps {
  children: ReactNode;
  noPadding?: boolean;
  style?: ViewStyle;
}

export function Card({
  variant = 'default',
  pressable = false,
  onPress,
  loading = false,
  disabled = false,
  style,
  children,
}: CardProps) {
  const cardStyles = [
    styles.card,
    styles[`card_${variant}`],
    disabled && styles.cardDisabled,
    style,
  ];

  if (pressable && onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyles,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {children}
        {loading && <LoadingOverlay />}
      </Pressable>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
      {loading && <LoadingOverlay />}
    </View>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  style,
}: CardHeaderProps) {
  return (
    <View style={[styles.cardHeader, style]}>
      <View style={styles.cardHeaderLeft}>
        {icon && <View style={styles.cardIcon}>{icon}</View>}
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

export function CardContent({
  children,
  noPadding = false,
  style,
}: CardContentProps) {
  return (
    <View style={[!noPadding && styles.cardContentPadding, style]}>
      {children}
    </View>
  );
}

function LoadingOverlay() {
  return <View style={styles.loadingOverlay} />;
}

const COLORS = {
  background: '#FFFFFF',
  border: '#DCD1C1',
  primary: '#3F6B5C',
  secondary: '#A3D9A1',
  forest: '#24534A',
  text: '#333333',
  textLight: '#666666',
  shadow: '#000000',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  card_default: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },

  card_elevated: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },

  card_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },

  card_flat: {
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },

  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  cardDisabled: {
    opacity: 0.5,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(163, 217, 161, 0.1)',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  cardIcon: {
    marginRight: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.forest,
  },

  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },

  cardContentPadding: {},
});