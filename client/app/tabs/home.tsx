import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Alert, ScrollView, FlatList, Text, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import NoMarkets from "@/components/home/no-markets";
import * as api from '../../utils/api';
import {Prediction} from "../../.expo/types/model";
import  PredictionCard from "@/components/explore/prediction-card";
import CategoryBtn from "@/components/home/category-btn";
import HomeHeader from "@/components/home/home-header";
import ClaimAllowance from "@/components/home/claim-allowance";
import HomeListSkeleton from '@/components/home/home-list-skeleton';
import Fab from '@/components/common/fab';
import { useUserStore } from '../../context/useUserStore';
import { PortfolioUpdatedPayload, subscribeRealtime } from '../../context/realtimeClient';
import { useNotificationBadge } from '../../context/NotificationBadgeContext';
import categories from "../../constants/categories";
import { ExploreTheme } from "../../constants/explore-theme";
import { UI_COLORS, useUITheme } from '@/constants/ui-tokens';
import { normalizePrediction } from '../../utils/prediction-helpers';

export default function HomeScreen() {
  useUITheme();

    const router = useRouter();
    const tabBarHeight = useBottomTabBarHeight();
    const { userData, fetchUserData, setBalanceFromSnapshot } = useUserStore();
    const { unreadCount } = useNotificationBadge();

    const [predictions, setPrediction] = useState<Prediction[]>([]);
    const [activeCategory, setActiveCategory] = useState("trending"); 
    const [marketsLoading, setMarketsLoading] = useState(false);
    const [noMarket, setNoMarket] = useState(true);
    const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'stale' | 'disconnected'>('disconnected');

    const realtimeStatus = useMemo(() => {
        if (connectionState === 'connected') {
            return { label: 'Live updates connected', color: UI_COLORS.success };
        }

        if (connectionState === 'reconnecting') {
            return { label: 'Reconnecting live updates...', color: UI_COLORS.warning };
        }

        if (connectionState === 'stale') {
            return { label: 'Live updates are stale. Retrying...', color: UI_COLORS.danger };
        }

        return { label: 'Live updates disconnected', color: ExploreTheme.secondaryText };
    }, [connectionState]);

    const canClaimAllowance = useMemo(() => {
        if (!userData) return false;
        if (!userData.last_claim_date) return true;
        const now = new Date();
        const last = new Date(userData.last_claim_date);
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) >
               Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
    }, [userData]);

    const getMarketData = useCallback(async (endpoint:string) => {
        setMarketsLoading(true);
        const {ok, data} = await api.get("/markets/"+endpoint);
        if(ok){
            const normalizedPredictions = Array.isArray(data)
                ? data.filter(i => i && i.id).map((item: Prediction) => normalizePrediction(item))
                : (Array.isArray(data.data)
                    ? data.data.filter((i: any) => i && i.id).map((item: Prediction) => normalizePrediction(item))
                    : []);

            setPrediction(normalizedPredictions);
            setNoMarket(normalizedPredictions.length === 0);
        } else {
            Alert.alert('Something wrong happened when fetching for predictions!');
        }
        setMarketsLoading(false);
    }, []);

    useEffect(() => {
        getMarketData(activeCategory);
    }, [activeCategory, getMarketData]);

    useFocusEffect(
        useCallback(() => {
            void getMarketData(activeCategory);
        }, [activeCategory, getMarketData])
    );

    useEffect(() => {
        const unsubscribe = subscribeRealtime({
            channels: ['market.updated', 'portfolio.updated'],
            onEvent: (event, payload) => {
                if (event === 'market.updated') {
                    void getMarketData(activeCategory);
                    return;
                }

                const portfolioPayload = payload as PortfolioUpdatedPayload;
                if (event === 'portfolio.updated' && portfolioPayload.userId === String(userData?.id ?? '')) {
                    setBalanceFromSnapshot(portfolioPayload.balance);
                    void getMarketData(activeCategory);
                }
            },
            onReconnect: () => {
                void getMarketData(activeCategory);
                void fetchUserData();
            },
            onConnectionState: setConnectionState,
        });

        return unsubscribe;
    }, [activeCategory, fetchUserData, getMarketData, setBalanceFromSnapshot, userData?.id]);

    const goMarketDetails = useCallback((id:number) => {
        router.push({ pathname: '/marketDetails', params: {id} });
    }, [router]);

    const openCreateMarket = useCallback(() => {
        router.push({ pathname: '/marketDetails', params: { mode: 'create' } });
    }, [router]);


    return (
        <View className="flex-1" style={{ backgroundColor: ExploreTheme.pageBg }}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: UI_COLORS.surface }}>
                <View
                    className="px-5"
                    style={{
                        backgroundColor: UI_COLORS.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: ExploreTheme.headerBorder,
                        paddingVertical: 14,
                    }}
                >
                    <HomeHeader
                        balance={userData?.balance ?? 0}
                        unreadCount={unreadCount}
                        onNotificationPress={() => router.push('/notifications')}
                    />
                    <Text className="font-jetbrain text-[11px] mt-2" style={{ color: realtimeStatus.color }}>
                        {realtimeStatus.label}
                    </Text>
                 </View>   
            </SafeAreaView>

            <View className="px-5 pt-3 gap-3">
                {canClaimAllowance && (
                    <ClaimAllowance onClaimed={fetchUserData}/>
                )}
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2">
                            {categories.map((cat) => (
                                <CategoryBtn
                                    key={cat.endpoint}
                                    label={cat.label}
                                    isActive={activeCategory === cat.endpoint}
                                    onPress={() => setActiveCategory(cat.endpoint)}
                                />
                            ))}
                        </View>
                    </ScrollView>
            </View>

            {/* Scrollable content */}
            <View className="flex-1 px-5 pt-3">
                {marketsLoading ? (
                    <HomeListSkeleton count={5} />
                ) : (
                    noMarket ? (
                        <View className="gap-3">
                            <NoMarkets/>
                            <TouchableOpacity
                                onPress={openCreateMarket}
                                accessibilityRole="button"
                                accessibilityLabel="Create market"
                                accessibilityHint="Opens create market form"
                                className="rounded-full self-center px-4 py-2"
                                style={{ backgroundColor: UI_COLORS.surfaceSoft, borderWidth: 1, borderColor: UI_COLORS.borderSoft }}
                            >
                                <Text className="font-jetbrain-bold text-[12px]" style={{ color: ExploreTheme.secondaryText }}>
                                    Propose first market
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={predictions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <PredictionCard
                                    prediction={item}
                                    onPress={() => goMarketDetails(item.id)}
                                    index={index}
                                />
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ gap: 14, paddingBottom: tabBarHeight + 100 }}
                        />       
                    )
                )}
            </View>

            <Fab onPress={openCreateMarket} style={{ bottom: tabBarHeight + 28, right: 16 }} />
        </View>
    );
}

