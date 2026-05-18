import AntDesign from '@expo/vector-icons/AntDesign';
import { View } from 'react-native';
import { UI_COLORS } from '@/constants/ui-tokens';

interface BackBtnProps {
    size?: number;
    color?: string;
}

export const BackBtn = ({ size, color  }: BackBtnProps) => {
    return (
        <View
            style={{
                width: 50,
                height: 50,
                borderRadius: 100,
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1.5,
                borderColor: UI_COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <AntDesign name="arrow-left" size={size} color={color} />
        </View>
    );
};

export default BackBtn;