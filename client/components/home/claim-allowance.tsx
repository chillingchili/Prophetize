import React, {useState} from 'react';
import {View, Pressable, Text} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as api from '@/utils/api';
import AnimatedIcon from "./animated-gift";
import { UI_COLORS } from '@/constants/ui-tokens';
import ConfirmModal from '@/components/common/confirm-modal';


export default function ClaimAllowance({ onClaimed }: { onClaimed?: () => void }) {
    const [showResult, setShowResult] = useState(false);
    const [resultTitle, setResultTitle] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const claimAllowance = async () => {
        const {ok, data} = await api.post('/auth/claim-allowance');
        if(ok){
            setResultTitle('Success');
            setResultMessage(`You received ${data.reward} P-coins! (Day ${data.streakDay})`);
            setShowResult(true);
            onClaimed?.();
        } else {
            setResultTitle('Error');
            setResultMessage(data.error || 'Something wrong happened.');
            setShowResult(true);
        }
    }

    return (
        <>
            <View className="">
                <View
                    className="rounded-xl h-auto p-4 border-[1px] flex-row gap-3 items-center"
                    style={{ backgroundColor: UI_COLORS.surface, borderColor: UI_COLORS.border }}
                >
                    <View className="w-13 h-13 rounded-full p-3 inline-flex z-0 items-center" style={{ backgroundColor: UI_COLORS.accentSoft }}>
                        <MaterialCommunityIcons name="gift-outline" size={24} color={UI_COLORS.accent} />
                        {/* <AnimatedIcon /> */}
                    </View>
                    <View className="flex-col">
                        <Text className="font-grotesk-bold text-sm" style={{ color: UI_COLORS.textPrimary }}>Daily Login Bonus</Text>
                        <Text className="font-jetbrain text-xs" style={{ color: UI_COLORS.textSecondary }}>+15 P-coins</Text>
                    </View>
                    <View className="flex-1"/>
                    <Pressable
                        onPress={claimAllowance}
                        hitSlop={10}
                        className="px-4 py-2 rounded-lg"
                        style={{ backgroundColor: UI_COLORS.accentSoft }}
                        accessibilityLabel="Claim daily bonus"
                        accessibilityRole="button"
                        accessibilityHint="Adds 15 P-coins to your balance"
                    >
                        <Text 
                            className="font-grotesk-bold text-sm" 
                            style={{ color: UI_COLORS.accent }}
                        >
                            Claim
                        </Text>
                    </Pressable>
                </View>
            </View>

            <ConfirmModal
                visible={showResult}
                title={resultTitle}
                message={resultMessage}
                onCancel={() => setShowResult(false)}
            />
        </>
    )
}
