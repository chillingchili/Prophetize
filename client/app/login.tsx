import React, {useState} from 'react';
import { Text, View, Pressable, useWindowDimensions, Image, Alert} from 'react-native';
import { useRouter } from 'expo-router';
import Logo from "@/components/auth/logo-hint"
import BackBtn from "@/components/auth/backbtn"
import WideButton from '@/components/auth/wide-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../utils/api';
import  { useAuth }  from '../context/AuthContext';
import InputField from '@/components/auth/input-field';
import GoogleLogin from "@/components/auth/google-login";
import { UI_COLORS, useUITheme } from '@/constants/ui-tokens';

export default function LoginScreen() {
    useUITheme();
    const { width, height } = useWindowDimensions();
    const router = useRouter();
    const heroSize = Math.min(width * 0.35, 180);
    const heroTop = Math.max(72, height * 0.18);

    // For login inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const {login} = useAuth();

    const handleLogin = async () => {
        if(!email || !password){
            Alert.alert('Please input all fields!');
            return;
        }
        
        try{
            setLoading(true);
            const { ok, data } = await api.post('/auth/login', {email, password});
            if(ok){
                // Alert.alert('success');
                await login(data.user, data.session.access_token, data.session.refresh_token);
                router.push('/tabs/home');
            } else {
                Alert.alert('Failed to log in', data.error);
            }
        } catch(error){
            console.error('Signup error:', error);
            Alert.alert('Network Error', 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }

    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg }} edges={['top']} >
        
            <View className="flex-1 p-6 ">
                <View className="flex flex-row gap-3 items-center">
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={10}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                        accessibilityHint="Navigates to previous screen"
                    >
                        <BackBtn size={24} color={UI_COLORS.textPrimary} />
                    </Pressable>
                    
                    <View className="">
                        <Logo />
                    </View>
                </View>


                <View style={{ position: 'absolute', right: 0, top: heroTop }} pointerEvents="none">
                    <Image
                        resizeMode="contain"
                        source={require("../assets/app-icons/ledger.png")}
                        style={{ width: heroSize, height: heroSize }}
                    />
                </View>
                <View className="flex-1 justify-end">
                    <Text className="text-[42px] font-grotesk-bold tracking-[-2px]" style={{ color: UI_COLORS.textPrimary }}>
                        Welcome {'\n'}back.
                    </Text>
                    <Text className="text-[18px] font-inter" style={{ color: UI_COLORS.textSecondary }}>
                        Continue your predictions on real-world outcomes.
                    </Text>
                </View>
            </View>

            <View
                className="px-6 pt-6 pb-8 gap-4"
                style={{
                    backgroundColor: UI_COLORS.surfaceMuted,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
            >

                <InputField
                    label="Email"
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    placeholderTextColor={UI_COLORS.textSecondary}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    colors={{
                        label: UI_COLORS.textSecondary,
                        text: UI_COLORS.textPrimary,
                        surface: UI_COLORS.surface,
                        border: UI_COLORS.border,
                    }}
                />

                <InputField
                    label="Password"
                    placeholder="••••••"
                    placeholderTextColor={UI_COLORS.textSecondary}
                    onChangeText={setPassword}
                    secureTextEntry
                    colors={{
                        label: UI_COLORS.textSecondary,
                        text: UI_COLORS.textPrimary,
                        surface: UI_COLORS.surface,
                        border: UI_COLORS.border,
                    }}
                />

                <Pressable className="self-end">
                    <Text className="font-inter text-[14px]" style={{ color: UI_COLORS.link }}>Forgot Password?</Text>
                </Pressable>

                <WideButton 
                    onPress={handleLogin}
                    label={loading ? "Logging in..." : "Log in"}
                    variant="primary"
                    disabled={loading}
                />

                <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-[1px]" style={{ backgroundColor: UI_COLORS.border }} />
                    <Text className="font-inter text-[13px]" style={{ color: UI_COLORS.textSecondary }}>or</Text>
                    <View className="flex-1 h-[1px]" style={{ backgroundColor: UI_COLORS.border }} />
                </View>

                <GoogleLogin />

                <View className="flex-row items-center justify-center gap-1 mt-2">
                    <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.textSecondary }}>Don't have an account?</Text>
                    <Pressable onPress={() => router.push('/signUp')}>
                        <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.link }}>Sign Up</Text>
                    </Pressable>
                </View>
            </View>

        </SafeAreaView>
    );
}

