import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Prediction } from '../../.expo/types/model';
import { UI_COLORS, UI_FONTS, UI_SHADOWS } from '@/constants/ui-tokens';

interface Props {
    prediction: Prediction;
    userPosition?: number | null;
    userPL?: number | null;
}

function formatCountdown(endDate: string): string {
    if (!endDate) return 'TBD';

    const now = new Date();
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return 'TBD';

    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ended';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d  ${String(hours).padStart(2, '0')}h  ${String(mins).padStart(2, '0')}m`;
}

const PCoin = () => (
    <Image
        source={require('../../assets/app-icons/p-coin.png')}
        style={{ width: 18, height: 18 }}
        resizeMode="contain"
    />
);

export default function MarketDetailSummary({ prediction, userPosition = null, userPL = null }: Props) {
    const [countdown, setCountdown] = useState(() => formatCountdown(prediction.endDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(formatCountdown(prediction.endDate));
        }, 60000);
        return () => clearInterval(interval);
    }, [prediction.endDate]);

    const hasPL = userPL !== null && userPL !== undefined;

    return (
        <View
            className="mx-4 rounded-xl overflow-hidden"
            style={{
                backgroundColor: UI_COLORS.surface,
                ...UI_SHADOWS.soft,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
            }}
        >
            {/* Row 1 */}
            <View className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: UI_COLORS.borderSoft }}>
                {/* VOLUME */}
                <View className="flex-1 p-4" style={{ borderRightWidth: 1, borderRightColor: UI_COLORS.borderSoft }}>
                    <Text
                        className="text-[10px] tracking-widest mb-1"
                        style={{ color: UI_COLORS.textSecondary, fontFamily: UI_FONTS.bodyBold }}
                    >
                        VOLUME
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                        <PCoin />
                        <Text
                            className="text-base"
                            style={{ color: UI_COLORS.textPrimary, fontFamily: UI_FONTS.monoBold }}
                        >
                            {(prediction.total_volume ?? 0).toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* EXPIRATION */}
                <View className="flex-1 p-4">
                    <Text
                        className="text-[10px] tracking-widest mb-1"
                        style={{ color: UI_COLORS.textSecondary, fontFamily: UI_FONTS.bodyBold }}
                    >
                        EXPIRATION
                    </Text>
                    <Text
                        className="text-base"
                        style={{ color: UI_COLORS.textPrimary, fontFamily: UI_FONTS.monoBold }}
                    >
                        {countdown}
                    </Text>
                </View>
            </View>

            {/* Row 2 */}
            <View className="flex-row">
                {/* YOUR POSITION */}
                <View className="flex-1 p-4" style={{ borderRightWidth: 1, borderRightColor: UI_COLORS.borderSoft }}>
                    <Text
                        className="text-[10px] tracking-widest mb-1"
                        style={{ color: UI_COLORS.textSecondary, fontFamily: UI_FONTS.bodyBold }}
                    >
                        YOUR POSITION
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                        <PCoin />
                        <Text
                            className="text-base"
                            style={{ color: UI_COLORS.textPrimary, fontFamily: UI_FONTS.monoBold }}
                        >
                            {userPosition !== null ? userPosition!.toFixed(2) : '--'}
                        </Text>
                    </View>
                </View>

                {/* P/L */}
                <View className="flex-1 p-4">
                    <Text
                        className="text-[10px] tracking-widest mb-1"
                        style={{ color: UI_COLORS.textSecondary, fontFamily: UI_FONTS.bodyBold }}
                    >
                        P/L
                    </Text>
                    <Text
                        className="text-base"
                        style={{
                            fontFamily: UI_FONTS.monoBold,
                            color: !hasPL ? UI_COLORS.textMuted : userPL! >= 0 ? UI_COLORS.success : UI_COLORS.danger,
                        }}
                    >
                        {!hasPL ? '--' : (userPL! >= 0 ? '+' : '') + userPL!.toFixed(2)}
                    </Text>
                </View>
            </View>
        </View>
    );
}
