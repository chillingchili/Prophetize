import React from 'react';
import {View, Text, TextInput, TextInputProps }from 'react-native'
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = TextInputProps & {
    label: string;
    colors?: {
        label?: string;
        text?: string;
        surface?: string;
        border?: string;
    };
}

export default function inputField({label, colors, ...props}:Props) {
    const palette = {
        label: UI_COLORS.textSecondary,
        text: UI_COLORS.textPrimary,
        surface: UI_COLORS.surface,
        border: UI_COLORS.border,
        ...colors,
    };
    return (
        <View className="gap-0">
            <Text className="font-grotesk-bold text-base px-3" style={{ color: palette.label }}>{label}</Text>
            <TextInput
                className="font-inter text-base p-3.5 rounded-xl border-2"
                style={{
                    color: palette.text,
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                }}
                {...props}
            />
        </View>
    );
}
