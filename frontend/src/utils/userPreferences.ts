export type ThemePreference = 'light' | 'dark' | 'system';
export type CurrencyPreference = 'USD' | 'EUR' | 'GBP' | 'CNY';
export type LanguagePreference = 'en' | 'zh';
export type FontSizePreference = 'small' | 'medium' | 'large';

export interface UserPreferences {
  theme: ThemePreference;
  currency: CurrencyPreference;
  language: LanguagePreference;
  fontSize: FontSizePreference;
  notifications: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  currency: 'USD',
  language: 'en',
  fontSize: 'medium',
  notifications: true,
};

function isCurrencyPreference(value: unknown): value is CurrencyPreference {
  return value === 'USD' || value === 'EUR' || value === 'GBP' || value === 'CNY';
}

function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'en' || value === 'zh';
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isFontSizePreference(value: unknown): value is FontSizePreference {
  return value === 'small' || value === 'medium' || value === 'large';
}

export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  const saved = window.localStorage.getItem('userPreferences');
  if (!saved) {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;

    return {
      theme: isThemePreference(parsed['theme']) ? parsed['theme'] : DEFAULT_USER_PREFERENCES.theme,
      currency: isCurrencyPreference(parsed['currency'])
        ? parsed['currency']
        : DEFAULT_USER_PREFERENCES.currency,
      language: isLanguagePreference(parsed['language'])
        ? parsed['language']
        : DEFAULT_USER_PREFERENCES.language,
      fontSize: isFontSizePreference(parsed['fontSize'])
        ? parsed['fontSize']
        : DEFAULT_USER_PREFERENCES.fontSize,
      notifications:
        typeof parsed['notifications'] === 'boolean'
          ? parsed['notifications']
          : DEFAULT_USER_PREFERENCES.notifications,
    };
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

export function getPreferredLocale(language?: LanguagePreference): string {
  return language === 'zh' ? 'zh-CN' : 'en-US';
}

export function resolveThemePreference(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }

  return theme;
}

export function applyUserPreferencesToDocument(preferences: UserPreferences): void {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedTheme = resolveThemePreference(preferences.theme);
  document.documentElement.setAttribute('data-theme', preferences.theme);
  document.documentElement.setAttribute('data-theme-mode', resolvedTheme);
  document.documentElement.lang = preferences.language;

  const fontSizeMap: Record<FontSizePreference, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };

  document.documentElement.style.fontSize = fontSizeMap[preferences.fontSize];
}

export function formatCurrencyWithPreference(
  amount: number,
  options?: { absolute?: boolean },
): string {
  const preferences = loadUserPreferences();
  const value = options?.absolute ? Math.abs(amount) : amount;

  return value.toLocaleString(getPreferredLocale(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
  });
}
