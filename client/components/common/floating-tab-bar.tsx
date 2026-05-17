import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { UI_COLORS } from '@/constants/ui-tokens';

type IconFamily = 'MaterialIcons' | 'Ionicons' | 'Feather';

interface TabIconConfig {
  routeName: string;
  family: IconFamily;
  iconName: string;
  label: string;
}

const TAB_CONFIG: TabIconConfig[] = [
  { routeName: 'home', family: 'MaterialIcons', iconName: 'home-filled', label: 'Home' },
  { routeName: 'explore', family: 'Ionicons', iconName: 'search', label: 'Explore' },
  { routeName: 'leaderboard', family: 'MaterialIcons', iconName: 'leaderboard', label: 'Board' },
  { routeName: 'profile', family: 'Feather', iconName: 'user', label: 'Profile' },
];

const TAB_GAP = 6;
const PILL_H_PADDING = 6;

function TabIcon({ family, name, color, size }: { family: IconFamily; name: string; color: string; size: number }) {
  const props = { name: name as any, size, color };
  switch (family) {
    case 'MaterialIcons': return <MaterialIcons {...props} />;
    case 'Ionicons': return <Ionicons {...props} />;
    case 'Feather': return <Feather {...props} />;
  }
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [pillWidth, setPillWidth] = useState(0);
  const indicatorOffset = useSharedValue(0);
  const indicatorWidthSV = useSharedValue(0);
  const isReady = useRef(false);

  const visibleTabs = state.routes.filter(r => !['_sitemap', '+not-found'].includes(r.name));
  const activeIndex = state.index;

  useEffect(() => {
    if (pillWidth === 0 || visibleTabs.length === 0) return;

    const tabCount = visibleTabs.length;
    const availableWidth = pillWidth - PILL_H_PADDING * 2;
    const tabWidth = availableWidth / tabCount;
    const iw = tabWidth - TAB_GAP;
    indicatorWidthSV.value = iw;
    const targetOffset = PILL_H_PADDING + activeIndex * tabWidth + (tabWidth - iw) / 2;

    if (!isReady.current) {
      indicatorOffset.value = targetOffset;
      isReady.current = true;
    } else {
      indicatorOffset.value = withSpring(targetOffset, {
        damping: 22,
        stiffness: 180,
        mass: 0.4,
      });
    }
  }, [activeIndex, pillWidth, visibleTabs.length, indicatorOffset, indicatorWidthSV]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidthSV.value,
    transform: [{ translateX: indicatorOffset.value }],
  }));

  const onPillLayout = (e: LayoutChangeEvent) => {
    setPillWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: UI_COLORS.surface,
            borderColor: UI_COLORS.borderSoft,
          },
        ]}
        onLayout={onPillLayout}
      >
        {pillWidth > 0 ? (
          <Animated.View
            style={[
              styles.indicator,
              {
                backgroundColor: UI_COLORS.accentSoft,
                borderColor: UI_COLORS.accentBorder,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
        {visibleTabs.map((route, index) => {
          const isFocused = activeIndex === index;
          const config = TAB_CONFIG.find(t => t.routeName === route.name);
          const color = isFocused ? UI_COLORS.accent : UI_COLORS.textMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {config ? (
                <>
                  <TabIcon family={config.family} name={config.iconName} color={color} size={20} />
                  <Text
                    style={[
                      styles.label,
                      { color, opacity: isFocused ? 1 : 0.5 },
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 36,
    paddingVertical: 10,
    paddingHorizontal: PILL_H_PADDING,
    alignItems: 'center',
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 28,
    borderWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 1,
    zIndex: 1,
  },
  label: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
    letterSpacing: 0.3,
  },
});
