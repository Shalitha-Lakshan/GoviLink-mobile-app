/**
 * GoviLink Guided Onboarding Tour Translations
 * Concise, action-focused localization in English (en), Sinhala (si), and Tamil (ta)
 * Every step description is under 20-25 words with zero large paragraphs.
 */

export const TOUR_TRANSLATIONS = {
  en: {
    common: {
      skip: 'Skip Tour',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      stepProgress: 'Step {current} of {total}',
      replayTour: 'Replay App Tour',
      replayTourSub: 'Explore the guided feature tour for your role again',
      tourCompletedToast: 'Tour completed! You can replay it anytime from your Profile.',
      farmerRoleBadge: '🧑‍🌾 Farmer Tour',
      buyerRoleBadge: '🛒 Buyer Tour',
      driverRoleBadge: '🚛 Driver Tour',
      adminRoleBadge: '🏢 Admin Tour',
    },
    farmer: {
      step1: {
        title: 'Welcome to GoviLink',
        content: 'Sell your fresh farm harvest directly to wholesale buyers and cooperatives at fair prices.',
      },
      step2: {
        title: 'Farmer Dashboard',
        content: 'See your active listings, incoming requests, and estimated revenue at a glance.',
      },
      step3: {
        title: 'Add Farm Produce',
        content: 'Tap here to add your farm produce and publish fresh crops to buyers.',
      },
      step4: {
        title: 'Produce Listing Form',
        content: 'Enter produce name, category, price, quantity, unit, and image, then save.',
      },
      step5: {
        title: 'Manage Produce',
        content: 'View, edit prices, update available stock, or remove crops anytime.',
      },
      step6: {
        title: 'Orders & Requests',
        content: 'View orders from buyers, prepare items for driver pickup, and confirm deliveries.',
      },
    },
    buyer: {
      step1: {
        title: 'Explore Your Dashboard',
        content: 'See your key activity and quick access to important features.',
      },
      step2: {
        title: 'Browse the Marketplace',
        content: 'Explore fresh produce from available farmers.',
      },
      step3: {
        title: 'Send an Inquiry',
        content: 'Ask farmers about produce availability or specific requirements.',
      },
      step4: {
        title: 'Place Your Order',
        content: 'Choose quantity and review the order total before confirming.',
      },
      step5: {
        title: 'Choose Delivery Location',
        content: 'Select where you want your order delivered. Use your current location or pick a location on the map.',
      },
      step6: {
        title: 'Track Your Orders',
        content: 'View order status and delivery progress from My Orders.',
      },
    },
    driver: {
      step1: {
        title: 'Welcome to GoviLink',
        content: 'Manage deliveries assigned to you and plan your farm-to-market routes.',
      },
      step2: {
        title: 'Assigned Deliveries',
        content: 'View all active transport jobs assigned to you and their schedule.',
      },
      step3: {
        title: 'Delivery Details',
        content: 'Check farmer pickup location and buyer delivery information before you start.',
      },
      step4: {
        title: 'GPS Navigation',
        content: 'Use real-time navigation and maps to travel between farms and buyers.',
      },
      step5: {
        title: 'Update Delivery Status',
        content: 'Keep everyone updated: Assigned, Picked Up, In Transit, and Delivered.',
      },
      step6: {
        title: 'Manage Vehicles',
        content: 'View and manage your registered transport vehicles and cargo capacities.',
      },
    },
    admin: {
      step1: {
        title: 'Cooperative Admin Hub',
        content: 'Welcome to the Cooperative Admin dashboard to oversee regional agricultural logistics.',
      },
      step2: {
        title: 'Dashboard Overview',
        content: 'Monitor key activity, transport requests, available drivers, and active deliveries.',
      },
      step3: {
        title: 'Stakeholder Directories',
        content: 'View and manage registered farmers, buyers, and delivery drivers.',
      },
      step4: {
        title: 'Orders & Deliveries',
        content: 'Review incoming transport requests and organize bulk produce dispatches.',
      },
      step5: {
        title: 'Assign Driver',
        content: 'Select an available delivery driver for the harvest transport route.',
      },
      step6: {
        title: 'Vehicle Assignment',
        content: 'Only vehicles belonging to the selected driver are available for allocation.',
      },
      step7: {
        title: 'Monitor Delivery Status',
        content: 'Track real-time delivery milestones and ensure timely harvest arrivals.',
      },
    },
  },

  si: {
    common: {
      skip: 'මඟහරින්න',
      back: 'ආපසු',
      next: 'ඊළඟ',
      finish: 'අවසන්',
      stepProgress: 'පියවර {current} න් {total}',
      replayTour: 'යෙදුම් මඟපෙන්වීම නැවත බලන්න',
      replayTourSub: 'ඔබගේ කාර්යභාරය සඳහා වන මඟපෙන්වීම නැවත පෙන්වන්න',
      tourCompletedToast: 'මඟපෙන්වීම සාර්ථකව අවසන් විය! ඔබගේ ගිණුම් පිටුවෙන් මෙය ඕනෑම වේලාවක නැවත නැරඹිය හැක.',
      farmerRoleBadge: '🧑‍🌾 ගොවි මඟපෙන්වීම',
      buyerRoleBadge: '🛒 ගැනුම්කරු මඟපෙන්වීම',
      driverRoleBadge: '🚛 රියදුරු මඟපෙන්වීම',
      adminRoleBadge: '🏢 පරිපාලන මඟපෙන්වීම',
    },
    farmer: {
      step1: {
        title: 'GoviLink වෙත සාදරයෙන් පිළිගනිමු',
        content: 'අතරමැදියන් නොමැතිව සාධාරණ මිලකට ඔබේ අස්වැන්න තොග ගැනුම්කරුවන්ට විකුණන්න.',
      },
      step2: {
        title: 'ගොවි උපකරණ පුවරුව',
        content: 'ඔබගේ සක්‍රිය අස්වනු, ලැබුණු ඇණවුම් සහ ආදායම් වාර්තා එකම තැනකින් බලන්න.',
      },
      step3: {
        title: 'අස්වැන්න එක් කරන්න',
        content: 'ඔබගේ ගොවිපළේ නැවුම් අස්වැන්න වෙළඳපොළට එක් කිරීමට මෙතැන ස්පර්ශ කරන්න.',
      },
      step4: {
        title: 'අස්වනු පෝරමය',
        content: 'නම, කාණ්ඩය, මිල, තොග ප්‍රමාණය, ඒකකය සහ ඡායාරූපය ඇතුළත් කර Save ඔබන්න.',
      },
      step5: {
        title: 'අස්වනු කළමනාකරණය',
        content: 'තොග ප්‍රමාණ යාවත්කාලීන කිරීමට, මිල සංශෝධනය කිරීමට හෝ ඉවත් කිරීමට මෙතැනින් පිවිසෙන්න.',
      },
      step6: {
        title: 'ඇණවුම් සහ ඉල්ලුම්',
        content: 'ගැනුම්කරු ඇණවුම් පරීක්ෂා කර රියදුරු වෙත භාරදීම සහ බෙදාහැරීම තහවුරු කරන්න.',
      },
    },
    buyer: {
      step1: {
        title: 'ඔබේ උපකරණ පුවරුව',
        content: 'ඔබගේ ප්‍රධාන ක්‍රියාකාරකම් සහ වැදගත් අංග ඉක්මනින් මෙතැනින් බලන්න.',
      },
      step2: {
        title: 'වෙළඳපොළ පිරික්සන්න',
        content: 'දිවයිනේ ලියාපදිංචි ගොවීන්ගෙන් නැවුම් අස්වැන්න සෘජුවම සොයාගන්න.',
      },
      step3: {
        title: 'විමසීමක් යොමු කරන්න',
        content: 'අවශ්‍ය බෝග සහ තොග පිළිබඳව ගොවීන්ගෙන් සෘජුවම විමසන්න.',
      },
      step4: {
        title: 'ඇණවුමක් කරන්න',
        content: 'අවශ්‍ය ප්‍රමාණය තෝරා මුළු මුදල පරීක්ෂා කර ඇණවුම තහවුරු කරන්න.',
      },
      step5: {
        title: 'බෙදාහැරීමේ ස්ථානය තෝරන්න',
        content: 'ඇණවුම ලැබිය යුතු ස්ථානය තෝරන්න. වත්මන් ස්ථානය හෝ සිතියමෙන් ලක්ෂ්‍යයක් තෝරාගත හැක.',
      },
      step6: {
        title: 'ඇණවුම් නිරීක්ෂණය',
        content: 'ඇණවුම්වල තත්ත්වය සහ බෙදාහැරීමේ ප්‍රගතිය My Orders වෙතින් බලන්න.',
      },
    },
    driver: {
      step1: {
        title: 'GoviLink වෙත සාදරයෙන් පිළිගනිමු',
        content: 'ඔබ වෙත පවරන ලද බෙදාහැරීම් සහ ගමන් මාර්ග මෙතැනින් කළමනාකරණය කරන්න.',
      },
      step2: {
        title: 'පැවරුණු බෙදාහැරීම්',
        content: 'භාරගැනීමට ඇති සහ දැනට ප්‍රවාහනය කෙරෙන සියලුම ඇණවුම් මෙතැනින් බලන්න.',
      },
      step3: {
        title: 'බෙදාහැරීමේ විස්තර',
        content: 'ගොවිපළ පිහිටීම, ගැනුම්කරුගේ ලිපිනය සහ අස්වනු තොරතුරු පරීක්ෂා කරන්න.',
      },
      step4: {
        title: 'GPS මඟපෙන්වීම',
        content: 'සිතියම් මඟපෙන්වීම භාවිතා කර ඔබගේ සජීවී ස්ථානය ගැනුම්කරුට පෙන්වන්න.',
      },
      step5: {
        title: 'තත්ත්වය යාවත්කාලීන කිරීම',
        content: 'භාණ්ඩ ලබාගත් පසු Picked Up, In Transit සහ Delivered ලෙස යාවත්කාලීන කරන්න.',
      },
      step6: {
        title: 'වාහන කළමනාකරණය',
        content: 'ඔබේ ලියාපදිංචි ප්‍රවාහන වාහන සහ ධාරිතා විස්තර මෙතැනින් බලන්න.',
      },
    },
    admin: {
      step1: {
        title: 'සමූපකාර පරිපාලන පියස',
        content: 'ප්‍රාදේශීය කෘෂි වෙළඳාම, ප්‍රවාහන පැවරුම් සහ සැපයුම් මෙතැනින් පාලනය කරන්න.',
      },
      step2: {
        title: 'දළ විශ්ලේෂණය',
        content: 'ප්‍රවාහන ඉල්ලීම්, ලබාගත හැකි රියදුරන් සහ බෙදාහැරීම් ප්‍රගතිය නිරීක්ෂණය කරන්න.',
      },
      step3: {
        title: 'පාර්ශ්වකරුවන්',
        content: 'සමූපකාර ගොවීන්, ගැනුම්කරුවන් සහ ලියාපදිංචි රියදුරන් මෙතැනින් පරීක්ෂා කරන්න.',
      },
      step4: {
        title: 'ප්‍රවාහන ඉල්ලීම්',
        content: 'ප්‍රවාහනය අවශ්‍ය ඇණවුම් පරීක්ෂා කර බෙදාහැරීම් සංවිධානය කරන්න.',
      },
      step5: {
        title: 'රියදුරෙකු පවරන්න',
        content: 'අස්වනු ප්‍රවාහනය සඳහා ලබාගත හැකි සුදුසු රියදුරෙකු තෝරන්න.',
      },
      step6: {
        title: 'වාහනයක් වෙන් කරන්න',
        content: 'තෝරාගත් රියදුරුගේ ලියාපදිංචි වාහනයක් ප්‍රවාහනය සඳහා තෝරන්න.',
      },
      step7: {
        title: 'බෙදාහැරීම් නිරීක්ෂණය',
        content: 'ගොවිපළේ සිට ගැනුම්කරු දක්වා සජීවී බෙදාහැරීමේ ප්‍රගතිය නිරීක්ෂණය කරන්න.',
      },
    },
  },

  ta: {
    common: {
      skip: 'தவிர்',
      back: 'பின்னே',
      next: 'அடுத்து',
      finish: 'முடிக்க',
      stepProgress: 'படி {current} / {total}',
      replayTour: 'வழிகாட்டலை மீண்டும் பார்க்க',
      replayTourSub: 'உங்கள் பாத்திரத்திற்கான வழிகாட்டலை மீண்டும் தொடங்கவும்',
      tourCompletedToast: 'வழிகாட்டல் முடிந்தது! உங்கள் சுயவிவரத்திலிருந்து எப்போது வேண்டுமானாலும் இதை மீண்டும் இயக்கலாம்.',
      farmerRoleBadge: '🧑‍🌾 விவசாயி வழிகாட்டல்',
      buyerRoleBadge: '🛒 வாங்குபவர் வழிகாட்டல்',
      driverRoleBadge: '🚛 சாரதி வழிகாட்டல்',
      adminRoleBadge: '🏢 நிர்வாக வழிகாட்டல்',
    },
    farmer: {
      step1: {
        title: 'GoviLink இற்கு நல்வரவு',
        content: 'இடைத்தரகர்கள் இன்றி உங்கள் விளைச்சலை நியாயமான விலையில் மொத்த கொள்வனவாளர்களுக்கு விற்கலாம்.',
      },
      step2: {
        title: 'விவசாயி தகவல் பலகை',
        content: 'உங்கள் பயிர் பட்டியல்கள், பெறப்பட்ட கட்டளைகள் மற்றும் வருமானத்தை உடனுக்குடன் பாருங்கள்.',
      },
      step3: {
        title: 'விளைச்சலைச் சேர்க்கவும்',
        content: 'உங்கள் புதிய விளைச்சலை சந்தையில் வெளியிட இங்கே தட்டவும்.',
      },
      step4: {
        title: 'விளைச்சல் படிவம்',
        content: 'பெயர், வகை, விலை, அளவு, அலகு மற்றும் புகைப்படத்தை உள்ளிட்டு சேமிக்கவும்.',
      },
      step5: {
        title: 'விளைச்சலை நிர்வகிக்க',
        content: 'கையிருப்பு, விலையைத் திருத்த அல்லது பட்டியலை நீக்க இங்கு செல்லவும்.',
      },
      step6: {
        title: 'கட்டளைகள் & கோரிக்கைகள்',
        content: 'கொள்வனவாளர் கட்டளைகளை ஏற்று, சாரதியிடம் ஒப்படைத்து விநியோகத்தை உறுதிசெய்யவும்.',
      },
    },
    buyer: {
      step1: {
        title: 'உங்கள் தகவல் பலகை',
        content: 'உங்கள் முக்கிய நடவடிக்கைகள் மற்றும் வசதிகளை எளிதாகப் பாருங்கள்.',
      },
      step2: {
        title: 'சந்தையை உலாவுக',
        content: 'சரிபார்க்கப்பட்ட விவசாயிகளிடமிருந்து புதிய விளைச்சலை நேரடியாகப் பாருங்கள்.',
      },
      step3: {
        title: 'விசாரிப்பை அனுப்புக',
        content: 'பயிர் கிடைக்கும் தன்மை பற்றி விவசாயிகளிடம் நேரடியாக விசாரிக்கவும்.',
      },
      step4: {
        title: 'கட்டளையிடவும்',
        content: 'அளவைத் தேர்ந்தெடுத்து மொத்த தொகையைச் சரிபார்த்து உறுதிசெய்யவும்.',
      },
      step5: {
        title: 'விநியோக இடத்தை தேர்வு செய்க',
        content: 'விநியோகிக்க வேண்டிய இடத்தை தெரிவுசெய்யுங்கள். தற்போதைய இடம் அல்லது வரைபடத்தைப் பயன்படுத்தலாம்.',
      },
      step6: {
        title: 'கட்டளைகளை கண்காணிக்க',
        content: 'கட்டளை நிலை மற்றும் விநியோக முன்னேற்றத்தை My Orders இல் பாருங்கள்.',
      },
    },
    driver: {
      step1: {
        title: 'GoviLink இற்கு நல்வரவு',
        content: 'ஒதுக்கப்பட்ட விநியோகங்களை மற்றும் பாதைகளை இங்கிருந்து நிர்வகிக்கவும்.',
      },
      step2: {
        title: 'ஒதுக்கப்பட்ட விநியோகங்கள்',
        content: 'ஏற்றுக்கொள்ள வேண்டிய மற்றும் பயணத்திலுள்ள விநியோகங்களை இங்கே பார்க்கவும்.',
      },
      step3: {
        title: 'விநியோக விவரங்கள்',
        content: 'பண்ணை அமைவிடம், வாங்குபவர் முகவரி மற்றும் பயிர் விவரங்களை சரிபார்க்கவும்.',
      },
      step4: {
        title: 'GPS வழிகாட்டல்',
        content: 'வரைபட வழிகாட்டலை பயன்படுத்தி நேரலை இருப்பிடத்தை வாங்குபவருக்கு காட்டவும்.',
      },
      step5: {
        title: 'விநியோக நிலையை மாற்றுக',
        content: 'விநியோக நிலையை Picked Up, In Transit மற்றும் Delivered என மாற்றவும்.',
      },
      step6: {
        title: 'வாகனங்கள்',
        content: 'உங்கள் பதிவுசெய்த வாகனங்கள் மற்றும் கொள்ளளவை இங்கு பார்வையிடவும்.',
      },
    },
    admin: {
      step1: {
        title: 'கூட்டுறவு நிர்வாக மையம்',
        content: 'விவசாய வர்த்தகம் மற்றும் போக்குவரத்து ஒதுக்கீடுகளை இங்கிருந்து மேற்பார்வையிடுங்கள்.',
      },
      step2: {
        title: 'பொது கண்ணோட்டம்',
        content: 'போக்குவரத்து கோரிக்கைகள், சாரதிகள் மற்றும் விநியோக நிலவரங்களை கண்காணிக்கவும்.',
      },
      step3: {
        title: 'பங்குதாரர்கள்',
        content: 'விவசாயிகள், வாங்குபவர்கள் மற்றும் சாரதிகளை இங்கிருந்து நிர்வகிக்கவும்.',
      },
      step4: {
        title: 'போக்குவரத்து கோரிக்கைகள்',
        content: 'போக்குவரத்து தேவைப்படும் கட்டளைகளை ஆய்வு செய்து ஒழுங்கமைக்கவும்.',
      },
      step5: {
        title: 'சாரதியை ஒதுக்கவும்',
        content: 'விளைச்சல் போக்குவரத்துக்காக கிடைக்கக்கூடிய சாரதியைத் தேர்ந்தெடுக்கவும்.',
      },
      step6: {
        title: 'வாகன ஒதுக்கீடு',
        content: 'தெரிவுசெய்த சாரதிக்குரிய வாகனத்தை விநியோகத்திற்கு ஒதுக்குங்கள்.',
      },
      step7: {
        title: 'விநியோக கண்காணிப்பு',
        content: 'பண்ணையிலிருந்து வாங்குபவர் வரை நிகழ்நேர விநியோக முன்னேற்றத்தைக் கண்காணிக்கவும்.',
      },
    },
  },
};
