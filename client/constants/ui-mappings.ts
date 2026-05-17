import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { UI_COLORS } from './ui-tokens';

export type CategoryIconMapping = {
    name: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bg: string;
};

const iconDefs: Record<string, () => CategoryIconMapping> = {
    SPORTS: () => ({ name: 'sports-basketball', color: '#10B981', bg: UI_COLORS.surfaceMuted }),
    POLITICS: () => ({ name: 'gavel', color: UI_COLORS.accent, bg: UI_COLORS.accentSoft }),
    CRYPTO: () => ({ name: 'attach-money', color: '#F59E0B', bg: UI_COLORS.surfaceMuted }),
    CULTURE: () => ({ name: 'movie', color: '#EC4899', bg: UI_COLORS.surfaceMuted }),
    TECHNOLOGY: () => ({ name: 'computer', color: UI_COLORS.accent, bg: UI_COLORS.accentSoft }),
    SCHOOL: () => ({ name: 'school', color: '#8B5CF6', bg: UI_COLORS.surfaceMuted }),
};

export const categoryIconMap = new Proxy<Record<string, CategoryIconMapping>>(
    {} as Record<string, CategoryIconMapping>,
    {
        get(_target, key: string) {
            const def = iconDefs[key];
            return def ? def() : undefined;
        },
        has(_target, key: string) {
            return key in iconDefs;
        },
        ownKeys() {
            return Reflect.ownKeys(iconDefs);
        },
        getOwnPropertyDescriptor() {
            return { enumerable: true, configurable: true };
        },
    },
);

export const OPTION_COLORS = ['#10B981', '#EF4444', UI_COLORS.accent, '#F59E0B', '#EC4899', UI_COLORS.info];
