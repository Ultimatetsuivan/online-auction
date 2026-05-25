import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mn from './locales/mn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      mn: {
        translation: mn
      }
    },
    lng: 'mn', // default language
    fallbackLng: 'mn',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
