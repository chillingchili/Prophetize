import React, {useState} from 'react';
import { Text, View, Pressable, useWindowDimensions, Image, TextInput, Alert} from 'react-native';
import { useRouter } from 'expo-router';
import Logo from "@/components/auth/logo-hint"
import BackBtn from "@/components/auth/backbtn"
import WideButton from '@/components/auth/wide-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../utils/api';
import InputField from '@/components/auth/input-field';
import GoogleLogin from "@/components/auth/google-login";
import { UI_COLORS, useUITheme } from '@/constants/ui-tokens';



export default function SignUpScreen() {
  useUITheme();
    const { width, height } = useWindowDimensions();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const heroSize = Math.min(width * 0.35, 180);
    const heroTop = Math.max(72, height * 0.18);

    // For signup inputs
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    //Email Verifier 
    const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function validateEmail(email:string): boolean {
        return emailRegex.test(email);
    }
    
    
    const handleSignUp = async () => {

        if(!email || !password || !username){
            Alert.alert('Please fill out all fields!');
            return;
        } 
        if(!validateEmail(email)){
            Alert.alert('Please enter a valid email!');
            return;
        }
        if(password.length < 6){
            Alert.alert('Please increase your password length!'); 
            return;
        }


        try{
            setLoading(true);
            const endpoint = '/auth/register';
            const { ok, data } = await api.post(endpoint, {username, email, password});
            if(ok){
                Alert.alert('Success');
                router.replace('/login');
            } else {
                Alert.alert('Signup failed', data.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Network Error', 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
        
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg }}>
            <View className="flex-1 p-6">

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

                <Image
                    resizeMode="contain"
                    source={require("../assets/app-icons/ledger.png")}
                    style={{ position: 'absolute', right: 0, top: heroTop, width: heroSize, height: heroSize }}
                />

                <View className="flex-1 justify-end gap-[12px] mt-4">
                    <Text className="text-[42px] font-grotesk-bold tracking-[-2px]" style={{ color: UI_COLORS.textPrimary }}>
                        Create {'\n'}an account
                    </Text>
                    <Text className="text-[18px] font-inter" style={{ color: UI_COLORS.textSecondary }}>
                        Start trading without the risk.
                    </Text>
                </View>
            </View>

            <View className="px-6 pt-6 pb-8 gap-3" style={{ backgroundColor: UI_COLORS.surfaceMuted, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <InputField
                    label="Username"
                    placeholder="John Doe"
                    placeholderTextColor={UI_COLORS.textSecondary}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <InputField
                    label="Email"
                    placeholder="example@gmail.com"
                    placeholderTextColor={UI_COLORS.textSecondary}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    inputMode="email"
                    autoCapitalize="none"
                />

                <View className="gap-6">
                    <InputField
                        label="Password"
                        placeholder="••••••"
                        placeholderTextColor={UI_COLORS.textSecondary}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                        
                    <WideButton 
                        onPress={handleSignUp} 
                        label={ loading ? "Creating Account..." : "Create Account"}
                        variant="primary"
                        disabled={loading}
                    />
                </View>

                <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-[1px]" style={{ backgroundColor: UI_COLORS.border }} />
                    <Text className="font-grotesk-bold text-[13px]" style={{ color: UI_COLORS.textSecondary }}>or continue with</Text>
                    <View className="flex-1 h-[1px]" style={{ backgroundColor: UI_COLORS.border }} />
                </View>

                <GoogleLogin />

                <View className="flex-row items-center justify-center gap-1 mt-2">
                    <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.textSecondary }}>Already have an account?</Text>
                    <Pressable onPress={() => router.replace('/login')}>
                        <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.link }}>Log in</Text>
                    </Pressable>
                </View>

            </View>
        </SafeAreaView>
    );
}

