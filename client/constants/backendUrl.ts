import Constants from 'expo-constants';
import { Platform } from 'react-native';

const RENDER_URL = 'https://prophetize.onrender.com';

const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
const expoHostUri = Constants.expoConfig?.hostUri;
const expoHost = expoHostUri?.split(':')[0];
const inferredLanBackendUrl = expoHost ? `http://${expoHost}:3001` : null;
const platformFallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

const backendUrl = envBackendUrl || inferredLanBackendUrl || platformFallbackUrl || RENDER_URL;

export default backendUrl;