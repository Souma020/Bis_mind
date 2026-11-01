/* Know Your BIS - Chat language selector & UI strings.
   To add a language: add an entry to CHAT_LANGUAGES below AND to
   backend/config/languages.js. */

const CHAT_LANGUAGES = {
    en: {
        label: 'English',
        placeholder: "Ask any question about BIS standards (e.g., 'Is IS 1786 mandatory for steel rebar?', 'What tests are required for IS 14543?')...",
        send: 'Send ➔',
        welcome: "Namaste! I am **Know Your BIS**, your AI-powered guide for Bureau of Indian Standards compliance, IS specifications, Quality Control Orders (QCOs), and certification schemes.\n\nHow may I assist your business or technical research today?",
        starters: [
            'Is IS 1786 mandatory for TMT steel bars?',
            'What testing is required for packaged water IS 14543?',
            'How does Gold Hallmarking with 6-digit HUID work?'
        ],
        typing: 'Analyzing official BIS evidence...',
        confidence: 'Grounded Confidence',
        followUps: 'Suggested Follow-ups:',
        helpful: 'Was this response helpful?',
        thanks: '✓ Thank you for your feedback!',
        error: 'Sorry, an error occurred while querying the BIS knowledge base:',
        offlineNote: ''
    },
    hi: {
        label: 'हिन्दी',
        placeholder: "BIS मानकों के बारे में कोई भी प्रश्न पूछें (जैसे, 'क्या स्टील रेबार के लिए IS 1786 अनिवार्य है?')...",
        send: 'भेजें ➔',
        welcome: "नमस्ते! मैं **Know Your BIS** हूँ, भारतीय मानक ब्यूरो (BIS) के अनुपालन, IS विनिर्देशों, गुणवत्ता नियंत्रण आदेशों (QCO) और प्रमाणन योजनाओं के लिए आपका AI मार्गदर्शक।\n\nआज मैं आपके व्यवसाय या तकनीकी शोध में कैसे सहायता कर सकता हूँ?",
        starters: [
            'क्या TMT स्टील बार के लिए IS 1786 अनिवार्य है?',
            'पैकेज्ड पानी IS 14543 के लिए कौन-से परीक्षण आवश्यक हैं?',
            '6-अंकीय HUID के साथ गोल्ड हॉलमार्किंग कैसे काम करती है?'
        ],
        typing: 'आधिकारिक BIS साक्ष्यों का विश्लेषण हो रहा है...',
        confidence: 'साक्ष्य-आधारित विश्वसनीयता',
        followUps: 'सुझाए गए अगले प्रश्न:',
        helpful: 'क्या यह उत्तर उपयोगी था?',
        thanks: '✓ आपकी प्रतिक्रिया के लिए धन्यवाद!',
        error: 'क्षमा करें, BIS ज्ञान-आधार से जानकारी लेते समय त्रुटि हुई:',
        offlineNote: 'ध्यान दें: AI सेवा उपलब्ध नहीं है, इसलिए यह उत्तर केवल अंग्रेज़ी में दिया गया है।'
    },
    bn: {
        label: 'বাংলা',
        placeholder: "BIS মান সম্পর্কে যেকোনো প্রশ্ন করুন (যেমন, 'স্টিল রিবারের জন্য IS 1786 কি বাধ্যতামূলক?')...",
        send: 'পাঠান ➔',
        welcome: "নমস্কার! আমি **Know Your BIS**, ভারতীয় মান ব্যুরো (BIS) সংক্রান্ত সম্মতি, IS স্পেসিফিকেশন, কোয়ালিটি কন্ট্রোল অর্ডার (QCO) ও সার্টিফিকেশন স্কিমের জন্য আপনার AI গাইড।\n\nআজ আমি আপনার ব্যবসা বা প্রযুক্তিগত গবেষণায় কীভাবে সাহায্য করতে পারি?",
        starters: [
            'TMT স্টিল বারের জন্য IS 1786 কি বাধ্যতামূলক?',
            'প্যাকেজড পানীয় জল IS 14543-এর জন্য কী কী পরীক্ষা প্রয়োজন?',
            '৬-সংখ্যার HUID সহ গোল্ড হলমার্কিং কীভাবে কাজ করে?'
        ],
        typing: 'অফিসিয়াল BIS তথ্যপ্রমাণ বিশ্লেষণ করা হচ্ছে...',
        confidence: 'তথ্যভিত্তিক নির্ভরযোগ্যতা',
        followUps: 'প্রস্তাবিত পরবর্তী প্রশ্ন:',
        helpful: 'এই উত্তরটি কি সহায়ক ছিল?',
        thanks: '✓ আপনার মতামতের জন্য ধন্যবাদ!',
        error: 'দুঃখিত, BIS জ্ঞানভান্ডারে অনুসন্ধানের সময় একটি ত্রুটি ঘটেছে:',
        offlineNote: 'দ্রষ্টব্য: AI পরিষেবা উপলব্ধ নয়, তাই এই উত্তর শুধুমাত্র ইংরেজিতে দেওয়া হয়েছে।'
    },
    mr: {
        label: 'मराठी',
        placeholder: "BIS मानकांविषयी कोणताही प्रश्न विचारा (उदा., 'स्टील रेबारसाठी IS 1786 अनिवार्य आहे का?')...",
        send: 'पाठवा ➔',
        welcome: "नमस्कार! मी **Know Your BIS** आहे, भारतीय मानक ब्युरो (BIS) अनुपालन, IS विनिर्देश, गुणवत्ता नियंत्रण आदेश (QCO) आणि प्रमाणन योजनांसाठी तुमचा AI मार्गदर्शक.\n\nआज मी तुमच्या व्यवसायात किंवा तांत्रिक संशोधनात कशी मदत करू शकतो?",
        starters: [
            'TMT स्टील बारसाठी IS 1786 अनिवार्य आहे का?',
            'पॅकेज्ड पाणी IS 14543 साठी कोणत्या चाचण्या आवश्यक आहेत?',
            '6-अंकी HUID सह गोल्ड हॉलमार्किंग कसे काम करते?'
        ],
        typing: 'अधिकृत BIS पुराव्यांचे विश्लेषण सुरू आहे...',
        confidence: 'पुराव्यावर आधारित विश्वासार्हता',
        followUps: 'सुचवलेले पुढील प्रश्न:',
        helpful: 'हे उत्तर उपयुक्त होते का?',
        thanks: '✓ तुमच्या प्रतिसादाबद्दल धन्यवाद!',
        error: 'क्षमस्व, BIS ज्ञानकोशात शोध घेताना त्रुटी आली:',
        offlineNote: 'टीप: AI सेवा उपलब्ध नसल्याने हे उत्तर फक्त इंग्रजीत दिले आहे.'
    },
    ta: {
        label: 'தமிழ்',
        placeholder: "BIS தரநிலைகள் பற்றி எந்தக் கேள்வியும் கேளுங்கள் (எ.கா., 'ஸ்டீல் ரீபார்களுக்கு IS 1786 கட்டாயமா?')...",
        send: 'அனுப்பு ➔',
        welcome: "வணக்கம்! நான் **Know Your BIS**, இந்தியத் தரநிலைகள் பணியகம் (BIS) இணக்கம், IS விவரக்குறிப்புகள், தரக் கட்டுப்பாட்டு ஆணைகள் (QCO) மற்றும் சான்றிதழ் திட்டங்களுக்கான உங்கள் AI வழிகாட்டி.\n\nஇன்று உங்கள் வணிகம் அல்லது தொழில்நுட்ப ஆய்வில் நான் எவ்வாறு உதவலாம்?",
        starters: [
            'TMT ஸ்டீல் கம்பிகளுக்கு IS 1786 கட்டாயமா?',
            'பேக்கேஜ்டு குடிநீர் IS 14543-க்கு என்ன சோதனைகள் தேவை?',
            '6 இலக்க HUID உடன் தங்க ஹால்மார்க்கிங் எவ்வாறு செயல்படுகிறது?'
        ],
        typing: 'அதிகாரப்பூர்வ BIS ஆதாரங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...',
        confidence: 'ஆதார அடிப்படையிலான நம்பகத்தன்மை',
        followUps: 'பரிந்துரைக்கப்பட்ட அடுத்த கேள்விகள்:',
        helpful: 'இந்தப் பதில் உதவிகரமாக இருந்ததா?',
        thanks: '✓ உங்கள் கருத்துக்கு நன்றி!',
        error: 'மன்னிக்கவும், BIS அறிவுத் தளத்தில் தேடும்போது பிழை ஏற்பட்டது:',
        offlineNote: 'குறிப்பு: AI சேவை கிடைக்காததால் இந்தப் பதில் ஆங்கிலத்தில் மட்டுமே வழங்கப்பட்டுள்ளது.'
    },
    te: {
        label: 'తెలుగు',
        placeholder: "BIS ప్రమాణాల గురించి ఏదైనా ప్రశ్న అడగండి (ఉదా., 'స్టీల్ రీబార్‌కు IS 1786 తప్పనిసరా?')...",
        send: 'పంపండి ➔',
        welcome: "నమస్కారం! నేను **Know Your BIS**ని, భారతీయ ప్రమాణాల సంస్థ (BIS) సమ్మతి, IS స్పెసిఫికేషన్లు, నాణ్యత నియంత్రణ ఉత్తర్వులు (QCO) మరియు సర్టిఫికేషన్ పథకాల కోసం మీ AI గైడ్‌ని.\n\nఈ రోజు మీ వ్యాపారానికి లేదా సాంకేతిక పరిశోధనకు నేను ఎలా సహాయపడగలను?",
        starters: [
            'TMT స్టీల్ బార్‌లకు IS 1786 తప్పనిసరా?',
            'ప్యాకేజ్డ్ వాటర్ IS 14543కి ఏ పరీక్షలు అవసరం?',
            '6 అంకెల HUIDతో గోల్డ్ హాల్‌మార్కింగ్ ఎలా పనిచేస్తుంది?'
        ],
        typing: 'అధికారిక BIS ఆధారాలను విశ్లేషిస్తున్నాము...',
        confidence: 'ఆధారిత విశ్వసనీయత',
        followUps: 'సూచించిన తదుపరి ప్రశ్నలు:',
        helpful: 'ఈ సమాధానం ఉపయోగకరంగా ఉందా?',
        thanks: '✓ మీ అభిప్రాయానికి ధన్యవాదాలు!',
        error: 'క్షమించండి, BIS నాలెడ్జ్ బేస్‌ను శోధిస్తున్నప్పుడు లోపం సంభవించింది:',
        offlineNote: 'గమనిక: AI సేవ అందుబాటులో లేనందున ఈ సమాధానం ఇంగ్లీష్‌లో మాత్రమే ఇవ్వబడింది.'
    },
    gu: {
        label: 'ગુજરાતી',
        placeholder: "BIS ધોરણો વિશે કોઈપણ પ્રશ્ન પૂછો (દા.ત., 'સ્ટીલ રીબાર માટે IS 1786 ફરજિયાત છે?')...",
        send: 'મોકલો ➔',
        welcome: "નમસ્તે! હું **Know Your BIS** છું, ભારતીય માનક બ્યૂરો (BIS) અનુપાલન, IS સ્પેસિફિકેશન, ગુણવત્તા નિયંત્રણ આદેશો (QCO) અને પ્રમાણન યોજનાઓ માટે તમારો AI માર્ગદર્શક.\n\nઆજે હું તમારા વ્યવસાય અથવા તકનીકી સંશોધનમાં કેવી રીતે મદદ કરી શકું?",
        starters: [
            'શું TMT સ્ટીલ બાર માટે IS 1786 ફરજિયાત છે?',
            'પેકેજ્ડ પાણી IS 14543 માટે કયા પરીક્ષણો જરૂરી છે?',
            '6-અંકના HUID સાથે ગોલ્ડ હોલમાર્કિંગ કેવી રીતે કામ કરે છે?'
        ],
        typing: 'અધિકૃત BIS પુરાવાઓનું વિશ્લેષણ થઈ રહ્યું છે...',
        confidence: 'પુરાવા-આધારિત વિશ્વસનીયતા',
        followUps: 'સૂચવેલા આગળના પ્રશ્નો:',
        helpful: 'શું આ જવાબ ઉપયોગી હતો?',
        thanks: '✓ તમારા પ્રતિભાવ બદલ આભાર!',
        error: 'માફ કરશો, BIS જ્ઞાનકોશમાં શોધ કરતી વખતે ભૂલ થઈ:',
        offlineNote: 'નોંધ: AI સેવા ઉપલબ્ધ ન હોવાથી આ જવાબ ફક્ત અંગ્રેજીમાં આપ્યો છે.'
    },
    kn: {
        label: 'ಕನ್ನಡ',
        placeholder: "BIS ಮಾನದಂಡಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಉದಾ., 'ಸ್ಟೀಲ್ ರೀಬಾರ್‌ಗೆ IS 1786 ಕಡ್ಡಾಯವೇ?')...",
        send: 'ಕಳುಹಿಸಿ ➔',
        welcome: "ನಮಸ್ಕಾರ! ನಾನು **Know Your BIS**, ಭಾರತೀಯ ಮಾನದಂಡ ಬ್ಯೂರೋ (BIS) ಅನುಸರಣೆ, IS ವಿಶೇಷಣಗಳು, ಗುಣಮಟ್ಟ ನಿಯಂತ್ರಣ ಆದೇಶಗಳು (QCO) ಮತ್ತು ಪ್ರಮಾಣೀಕರಣ ಯೋಜನೆಗಳಿಗೆ ನಿಮ್ಮ AI ಮಾರ್ಗದರ್ಶಿ.\n\nಇಂದು ನಿಮ್ಮ ವ್ಯವಹಾರ ಅಥವಾ ತಾಂತ್ರಿಕ ಸಂಶೋಧನೆಯಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        starters: [
            'TMT ಸ್ಟೀಲ್ ಬಾರ್‌ಗಳಿಗೆ IS 1786 ಕಡ್ಡಾಯವೇ?',
            'ಪ್ಯಾಕೇಜ್ಡ್ ನೀರು IS 14543 ಗೆ ಯಾವ ಪರೀಕ್ಷೆಗಳು ಬೇಕು?',
            '6 ಅಂಕಿಯ HUID ಜೊತೆ ಗೋಲ್ಡ್ ಹಾಲ್‌ಮಾರ್ಕಿಂಗ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?'
        ],
        typing: 'ಅಧಿಕೃತ BIS ಸಾಕ್ಷ್ಯಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
        confidence: 'ಸಾಕ್ಷ್ಯಾಧಾರಿತ ವಿಶ್ವಾಸಾರ್ಹತೆ',
        followUps: 'ಸೂಚಿಸಲಾದ ಮುಂದಿನ ಪ್ರಶ್ನೆಗಳು:',
        helpful: 'ಈ ಉತ್ತರ ಉಪಯುಕ್ತವಾಗಿತ್ತೇ?',
        thanks: '✓ ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು!',
        error: 'ಕ್ಷಮಿಸಿ, BIS ಜ್ಞಾನ ಭಂಡಾರದಲ್ಲಿ ಹುಡುಕುವಾಗ ದೋಷ ಉಂಟಾಯಿತು:',
        offlineNote: 'ಸೂಚನೆ: AI ಸೇವೆ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಈ ಉತ್ತರವನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತ್ರ ನೀಡಲಾಗಿದೆ.'
    }
};

const DEFAULT_CHAT_LANGUAGE = 'en';
const LANGUAGE_STORAGE_KEY = 'chat_language';

function getChatLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return CHAT_LANGUAGES[saved] ? saved : DEFAULT_CHAT_LANGUAGE;
}

function setChatLanguage(code) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, CHAT_LANGUAGES[code] ? code : DEFAULT_CHAT_LANGUAGE);
}

function chatText() {
    return CHAT_LANGUAGES[getChatLanguage()];
}

window.CHAT_LANGUAGES = CHAT_LANGUAGES;
window.getChatLanguage = getChatLanguage;
window.setChatLanguage = setChatLanguage;
window.chatText = chatText;
