import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { UI_COLORS, UI_SHADOWS } from '@/constants/ui-tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress: () => void;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
};

const SIZE_MAP = {
  small: { container: 40, icon: 20, radius: 14 },
  medium: { container: 48, icon: 24, radius: 16 },
  large: { container: 56, icon: 24, radius: 18 },
};

export default function Fab({ onPress, icon = 'add', size = 'large', style }: Props) {
  const pressed = useSharedValue(0);
  const dims = SIZE_MAP[size];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(1 - pressed.value * 0.08, { damping: 18, stiffness: 200 });
    return { transform: [{ scale }] };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      style={[
        styles.container,
        {
          width: dims.container,
          height: dims.container,
          borderRadius: dims.radius,
          backgroundColor: UI_COLORS.primaryContainer,
        },
        UI_SHADOWS.fab,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Create market"
      accessibilityHint="Opens the create market form"
    >
      <MaterialIcons name={icon as any} size={dims.icon} color={UI_COLORS.onPrimaryContainer} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
