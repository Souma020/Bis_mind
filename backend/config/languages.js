// Supported chat languages. To add a language: add an entry here AND in
// frontend/js/languages.js (which holds the chat UI strings for that language).
const SUPPORTED_LANGUAGES = {
    en: { name: 'English', nativeName: 'English' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी' },
    bn: { name: 'Bengali', nativeName: 'বাংলা' },
    mr: { name: 'Marathi', nativeName: 'मराठी' },
    ta: { name: 'Tamil', nativeName: 'தமிழ்' },
    te: { name: 'Telugu', nativeName: 'తెలుగు' },
    gu: { name: 'Gujarati', nativeName: 'ગુજરાતી' },
    kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
};

const DEFAULT_LANGUAGE = 'en';

function normalizeLanguage(code) {
    const c = typeof code === 'string' ? code.trim().toLowerCase() : '';
    return SUPPORTED_LANGUAGES[c] ? c : DEFAULT_LANGUAGE;
}

module.exports = { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, normalizeLanguage };
