import { View } from 'react-native';

import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS } from '@/constants/ui-tokens';
import SkeletonShell from '../skeleton/skeleton-shell';

export default function CardSkeleton() {
    return (
        <SkeletonShell
            style={{
                height: 140,
                borderRadius: 12,
                backgroundColor: ExploreTheme.sectionDivider,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
                paddingHorizontal: 14,
                paddingVertical: 14,
            }}
        >
            <View testID="card-skeleton" style={{ flex: 1, justifyContent: 'space-between' }}>
                <View style={{ gap: 9 }}>
                    <View
                        style={{
                            width: '72%',
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: UI_COLORS.borderSoft,
                        }}
                    />
                    <View
                        style={{
                            width: '54%',
                            height: 11,
                            borderRadius: 6,
                            backgroundColor: UI_COLORS.surfaceSoft,
                        }}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                        style={{
                            width: 66,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: UI_COLORS.surfaceMuted,
                        }}
                    />
                    <View
                        style={{
                            width: 84,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: UI_COLORS.success + '30',
                        }}
                    />
                </View>
            </View>
        </SkeletonShell>
    );
}
