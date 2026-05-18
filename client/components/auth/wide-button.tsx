import React, {useState} from 'react';
import { Text, Pressable } from 'react-native';
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
    disabled?: boolean;
    colors?: {
        primary?: string;
        primaryPressed?: string;
        surface?: string;
        surfaceMuted?: string;
        border?: string;
        textOnPrimary?: string;
        textOnSurface?: string;
    };
}

export default function Button({label, onPress, variant="primary", icon, disabled, colors}:Props) {
    const [pressed, setPressed] = useState(false);
    const isPrimary = variant === 'primary';
    const palette = {
        primary: UI_COLORS.accent,
        primaryPressed: UI_COLORS.accentPressed,
        surface: UI_COLORS.surface,
        surfaceMuted: UI_COLORS.surfaceMuted,
        border: UI_COLORS.border,
        textOnPrimary: UI_COLORS.surface,
        textOnSurface: UI_COLORS.textPrimary,
        ...colors,
    };
    const backgroundColor = pressed
        ? (isPrimary ? palette.primaryPressed : palette.surfaceMuted)
        : (isPrimary ? palette.primary : palette.surface);
    const textColor = isPrimary ? palette.textOnPrimary : palette.textOnSurface;

    return (
            <Pressable 
                disabled={disabled}
                onPress={onPress} 
                onPressIn={()=>setPressed(true)}
                onPressOut={()=>setPressed(false)}
                accessibilityRole="button"
                accessibilityLabel={label}
                className={`flex-row items-center justify-center p-4 rounded-full gap-[8px]`}
                style={{
                    opacity: disabled ? 0.6 : (pressed ? 0.9 : 1),
                    backgroundColor,
                    borderWidth: isPrimary ? 0 : 1,
                    borderColor: palette.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                }}
            >
                {icon && icon} 
                <Text
                    className="font-grotesk-bold text-[16px]"
                    style={{ color: textColor }}
                > 
                    {label}</Text>
            </Pressable>
    );
}
