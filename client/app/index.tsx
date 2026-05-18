import { Text, View, Pressable, Image, useWindowDimensions } from "react-native";
import { useRouter } from 'expo-router';
import Logo from "@/components/auth/logo-hint"
import Fontisto from '@expo/vector-icons/Fontisto';
import WideButton from '@/components/auth/wide-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleLogin from "@/components/auth/google-login";
import { UI_COLORS, useUITheme } from "@/constants/ui-tokens";


export default function WelcomeScreen(){
    useUITheme();
    const { width, height } = useWindowDimensions();
    const router = useRouter();
    const heroSize = Math.min(width * 0.35, 180);
    const heroTop = Math.max(72, height * 0.18);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg }}>
            <View className="flex-1 p-6 ">
            
                <View className="mt-[40px]">
                    <Logo />
                </View>

                <Image
                    resizeMode="contain"
                    source={require("../assets/app-icons/ledger.png")}
                    style={{ position: "absolute", right: 0, top: heroTop, width: heroSize, height: heroSize }}
                />

                <View className="flex-1 justify-center gap-[12px] ">
                    <Text className="text-[52px] font-grotesk-bold tracking-[-1.05px]" style={{ color: UI_COLORS.textPrimary }}>
                        Predict{"\n"}the future.
                    </Text>
                    <Text className="text-[18px] font-inter" style={{ color: UI_COLORS.textSecondary }}>
                        Trade virtual currency on real-world {'\n'} outcomes without the risk.
                    </Text>
                </View>

            </View>

            <View className="p-6 gap-[12px]" style={{ backgroundColor: UI_COLORS.pageBg }}>

                <WideButton
                    onPress={() => router.push('/signUp')}
                    label="Continue with Email"
                    variant="primary"
                    icon={<Fontisto  name="email" size={24} color="white" />}
                />

                {/* <WideButton 
                    onPress={() => null}
                    label="Continue with Google"
                    variant="secondary"
                    icon={<AntDesign name="google" size={24} color="black" />}
                /> */}

                <GoogleLogin></GoogleLogin>

                <Text className=" text-center text-[12px] font-inter" style={{ color: UI_COLORS.textSecondary }}>
                    By continuing, you agree to our{" "}
                    <Text className="underline">Terms of Service</Text>
                    {" & "} 
                    <Text className="underline">Privacy Policy</Text>.
                </Text>

            </View>
        </SafeAreaView>
    )
}
