import { useAppearance } from '../hooks/use-appearance';

export function useTheme() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return {
        theme: resolvedAppearance,
        toggleTheme,
    };
}
