export const loadTranslations = async () => {
  const translations = {
    en: (await import('./locales/en')).en,
    th: (await import('./locales/th')).th
  };
  return translations;
}
