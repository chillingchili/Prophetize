import {Pressable, Text} from 'react-native';
import {useState} from 'react';
import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = {
    label:string;
    isActive:boolean;
    onPress: () => void;
}

export default function CategoryBtn({label, isActive, onPress}:Props) {
    const [pressed, setPressed] = useState(false);
    return(
        <Pressable
            className="h-[38px] w-[88px] rounded-full items-center justify-center"
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityHint={`Selects ${label} category`}
            onPressIn={()=>setPressed(true)}
            onPressOut={()=>setPressed(false)}
            style={{
                    backgroundColor: (isActive ? UI_COLORS.accent : UI_COLORS.surface),
                    borderWidth: 1,
                    borderColor: (isActive ? UI_COLORS.accent : ExploreTheme.headerBorder),
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                }}
            >
            <Text
            className="font-grotesk-bold text-[14px]"
            style={{ color: isActive ? UI_COLORS.surface : ExploreTheme.secondaryText }}
            >
                {label}
            </Text>
        </Pressable>
    )
}
