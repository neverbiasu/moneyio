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

const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';

let cachedPreferences: UserPreferences | null = null;
const currencyFormatterCache = new Map<string, Intl.NumberFormat>();
let systemThemeMediaQuery: MediaQueryList | null = null;
let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

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
  if (cachedPreferences) {
    return { ...cachedPreferences };
  }

  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  const saved = window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
  if (!saved) {
    cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
    return { ...cachedPreferences };
  }

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;

    cachedPreferences = {
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

    return { ...cachedPreferences };
  } catch {
    cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
    return { ...cachedPreferences };
  }
}

export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  cachedPreferences = { ...preferences };
  window.localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(cachedPreferences));
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

function detachSystemThemeListener(): void {
  if (!systemThemeMediaQuery || !systemThemeListener) {
    return;
  }

  if (typeof systemThemeMediaQuery.removeEventListener === 'function') {
    systemThemeMediaQuery.removeEventListener('change', systemThemeListener);
  } else {
    systemThemeMediaQuery.removeListener(systemThemeListener);
  }

  systemThemeMediaQuery = null;
  systemThemeListener = null;
}

function attachSystemThemeListener(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || systemThemeListener) {
    return;
  }

  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeListener = (event: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-theme-mode', event.matches ? 'dark' : 'light');
  };

  if (typeof systemThemeMediaQuery.addEventListener === 'function') {
    systemThemeMediaQuery.addEventListener('change', systemThemeListener);
  } else {
    systemThemeMediaQuery.addListener(systemThemeListener);
  }
}

export function applyUserPreferencesToDocument(preferences: UserPreferences): void {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedTheme = resolveThemePreference(preferences.theme);
  document.documentElement.setAttribute('data-theme', preferences.theme);
  document.documentElement.setAttribute('data-theme-mode', resolvedTheme);
  document.documentElement.lang = getPreferredLocale(preferences.language);

  if (preferences.theme === 'system') {
    attachSystemThemeListener();
  } else {
    detachSystemThemeListener();
  }

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
  const locale = getPreferredLocale(preferences.language);
  const cacheKey = `${locale}:${preferences.currency}`;

  let formatter = currencyFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: preferences.currency,
    });
    currencyFormatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value);
}
