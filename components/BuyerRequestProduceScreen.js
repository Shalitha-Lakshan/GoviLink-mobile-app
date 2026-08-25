import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createBuyerCustomRequest } from '../services/firebaseDatabase';

// ----------------------------------------------------
// THEME COLORS (GOVILINK PREMIUM PALETTE)
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  navyLight: '#1B3B6F',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  borderActive: '#16A34A',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  inputBg: '#FFFFFF',
};

// ----------------------------------------------------
// SRI LANKAN DISTRICTS
// ----------------------------------------------------
const DISTRICTS = [
  { id: 'any', nameEn: 'Any District (Island-wide)', nameSi: 'ඕනෑම දිස්ත්‍රික්කයකින් (දිවයින පුරා)', nameTa: 'எந்த மாவட்டமும் (நாடு முழுவதும்)' },
  { id: 'nuwara_eliya', nameEn: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', nameTa: 'நுவரெலியா' },
  { id: 'badulla', nameEn: 'Badulla', nameSi: 'බදුල්ල', nameTa: 'பதுளை' },
  { id: 'kandy', nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' },
  { id: 'matale', nameEn: 'Matale', nameSi: 'මාතලේ', nameTa: 'மாத்தளை' },
  { id: 'anuradhapura', nameEn: 'Anuradhapura', nameSi: 'අනුරාධපුරය', nameTa: 'அனுராதபுரம்' },
  { id: 'polonnaruwa', nameEn: 'Polonnaruwa', nameSi: 'පොළොන්නරුව', nameTa: 'பொலன்னறுவை' },
  { id: 'kurunegala', nameEn: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருநாகல்' },
  { id: 'puttalam', nameEn: 'Puttalam', nameSi: 'පුත්තලම', nameTa: 'புத்தளம்' },
  { id: 'jaffna', nameEn: 'Jaffna', nameSi: 'යාපනය', nameTa: 'யாழ்ப்பாணம்' },
  { id: 'kilinochchi', nameEn: 'Kilinochchi', nameSi: 'කිලිනොච්චිය', nameTa: 'கிளிநோச்சி' },
  { id: 'mannar', nameEn: 'Mannar', nameSi: 'මන්නාරම', nameTa: 'மன்னார்' },
  { id: 'vavuniya', nameEn: 'Vavuniya', nameSi: 'වවුනියාව', nameTa: 'வவுனியா' },
  { id: 'mullaitivu', nameEn: 'Mullaitivu', nameSi: 'මුලතිව්', nameTa: 'முல்லைத்தீவு' },
  { id: 'batticaloa', nameEn: 'Batticaloa', nameSi: 'මඩකලපුව', nameTa: 'மட்டக்களப்பு' },
  { id: 'ampara', nameEn: 'Ampara', nameSi: 'අම්පාර', nameTa: 'அம்பாறை' },
  { id: 'trincomalee', nameEn: 'Trincomalee', nameSi: 'ත්‍රිකුණාමලය', nameTa: 'திருகோணமலை' },
  { id: 'hambantota', nameEn: 'Hambantota', nameSi: 'හම්බන්තොට', nameTa: 'ஹம்பாந்தோட்டை' },
  { id: 'monaragala', nameEn: 'Monaragala', nameSi: 'මොනරාගල', nameTa: 'மொணராகல' },
  { id: 'ratnapura', nameEn: 'Ratnapura', nameSi: 'රත්නපුරය', nameTa: 'இரத்தினபுரி' },
  { id: 'kegalle', nameEn: 'Kegalle', nameSi: 'කෑගල්ල', nameTa: 'கேகாலை' },
  { id: 'colombo', nameEn: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
  { id: 'gampaha', nameEn: 'Gampaha', nameSi: 'ගම්පහ', nameTa: 'கம்பஹா' },
  { id: 'kalutara', nameEn: 'Kalutara', nameSi: 'කළුතර', nameTa: 'களுத்துறை' },
  { id: 'galle', nameEn: 'Galle', nameSi: 'ගාල්ල', nameTa: 'காலி' },
  { id: 'matara', nameEn: 'Matara', nameSi: 'මාතර', nameTa: 'மாத்தறை' },
];

// ----------------------------------------------------
// POPULAR SRI LANKAN CROPS
// ----------------------------------------------------
const POPULAR_CROPS = [
  { id: 'carrot', nameEn: 'Carrots', nameSi: 'කැරට්', nameTa: 'கேரட்', category: 'Vegetables' },
  { id: 'potato', nameEn: 'Potatoes', nameSi: 'අල', nameTa: 'உருளைக்கிழங்கு', category: 'Vegetables' },
  { id: 'leeks', nameEn: 'Leeks', nameSi: 'ලීක්ස්', nameTa: 'லீக்ஸ்', category: 'Vegetables' },
  { id: 'tomato', nameEn: 'Tomatoes', nameSi: 'තක්කාලි', nameTa: 'தக்காளி', category: 'Vegetables' },
  { id: 'cabbage', nameEn: 'Cabbage', nameSi: 'ගෝවා', nameTa: 'முட்டைக்கோஸ்', category: 'Vegetables' },
  { id: 'green_chilli', nameEn: 'Green Chillies', nameSi: 'අමු මිරිස්', nameTa: 'பச்சை மிளகாய்', category: 'Vegetables' },
  { id: 'red_onion', nameEn: 'Red Onions', nameSi: 'රතු ළූණු', nameTa: 'சின்ன வெங்காயம்', category: 'Vegetables' },
  { id: 'big_onion', nameEn: 'Big Onions', nameSi: 'ලොකු ළූණු', nameTa: 'பெரிய வெங்காயம்', category: 'Vegetables' },
  { id: 'beans', nameEn: 'Green Beans', nameSi: 'බෝංචි', nameTa: 'பீன்ஸ்', category: 'Vegetables' },
  { id: 'banana', nameEn: 'Bananas (Ambul/Kolikuttu)', nameSi: 'කෙසෙල් (ඇඹුල්/කෝලිකුට්ටු)', nameTa: 'வாழைப்பழம்', category: 'Fruits' },
  { id: 'papaya', nameEn: 'Papaya (Red Lady)', nameSi: 'පැපොල් (රෙඩ් ලේඩි)', nameTa: 'பப்பாளி', category: 'Fruits' },
  { id: 'rice_samba', nameEn: 'Keeri Samba Rice', nameSi: 'කීරි සම්බා සහල්', nameTa: 'கீரி சம்பா அரிசி', category: 'Rice & Grains' },
  { id: 'cinnamon', nameEn: 'Ceylon Cinnamon (Alba/C5)', nameSi: 'කුරුඳු', nameTa: 'கருவாப்பட்டை', category: 'Spices' },
  { id: 'pepper', nameEn: 'Black Pepper', nameSi: 'ගම්මිරිස්', nameTa: 'மிளகு', category: 'Spices' },
];

const CATEGORIES = ['Vegetables', 'Fruits', 'Rice & Grains', 'Spices', 'Other'];

const UNITS = ['kg', 'MT (Tonnes)', 'Bags (50kg)', 'Crates (20kg)', 'Bundles', 'Pieces / Units'];

const QUALITY_GRADES = [
  { id: 'grade_a', labelEn: 'Grade A (Supermarket / Export Quality)', labelSi: 'A ශ්‍රේණිය (සුපිරි වෙළඳසැල් / අපනයන තත්ත්වය)', labelTa: 'தரம் A (ஏற்றுமதி / சூப்பர் மார்க்கெட்)' },
  { id: 'grade_b', labelEn: 'Grade B (Standard Market Quality)', labelSi: 'B ශ්‍රේණිය (සාමාන්‍ය වෙළඳපොළ තත්ත්වය)', labelTa: 'தரம் B (சாதாரண சந்தை தரம்)' },
  { id: 'organic', labelEn: '100% Certified Organic', labelSi: '100% කාබනික සහතිකලත්', labelTa: 'இயற்கை விவசாயம் (Organic)' },
  { id: 'any', labelEn: 'Any Grade / Commercial Standard', labelSi: 'ඕනෑම සාමාන්‍ය තත්ත්වයක්', labelTa: 'எந்த தரமும்' },
];

// Quick date window presets
const DATE_PRESETS = [
  { id: 'urgent', labelEn: 'Immediate (Next 48 Hours)', daysOffset: 2 },
  { id: 'week', labelEn: 'This Week (Within 7 Days)', daysOffset: 7 },
  { id: 'two_weeks', labelEn: 'Next 2 Weeks (14 Days)', daysOffset: 14 },
  { id: 'month', labelEn: 'Next Month (Forward Contract)', daysOffset: 30 },
  { id: 'custom', labelEn: 'Custom Date Period', daysOffset: 0 },
];

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    headerTitle: 'Broadcast Harvest Request',
    headerSub: 'Specify exact crop, target district, and required date period',
    quickPickTitle: 'Quick Select Popular Crops',
    cropNameLabel: 'Produce / Crop Name',
    cropNamePlaceholder: 'e.g. Carrots, Leeks, Keeri Samba',
    categoryLabel: 'Produce Category',
    quantityLabel: 'Required Quantity',
    quantityPlaceholder: 'e.g. 100',
    unitLabel: 'Unit',
    originAreaLabel: 'Target Sourcing District / Area',
    selectDistrict: 'Select Target District',
    specificTownLabel: 'Specific Village / Town / Area (Optional)',
    specificTownPlaceholder: 'e.g. Welimada, Kandapola, Jaffna Peninsula',
    datePeriodLabel: 'Required Delivery / Harvest Date Period',
    datePresetLabel: 'Quick Timeframe',
    startDateLabel: 'Period Start Date',
    endDateLabel: 'Period End Date',
    targetPriceLabel: 'Target Budget / Price per unit (Optional)',
    targetPricePlaceholder: 'e.g. 240 (Rs./kg)',
    gradeLabel: 'Quality / Grade Requirement',
    selectGrade: 'Select Preferred Quality',
    deliveryCheckboxLabel: 'Require Co-op Transport & Doorstep Delivery',
    deliveryCheckboxSub: 'Check if you want GoviLink registered drivers to deliver to your address. Uncheck for farm self-pickup.',
    selfPickupNotice: '🚜 Self-Pickup selected: You will arrange your own logistics from the farm or regional aggregation hub.',
    deliveryAddressLabel: 'Delivery Destination Address',
    deliveryAddressPlaceholder: 'e.g. Colombo Pettah Central Market, Store #14',
    notesLabel: 'Special Instructions / Packaging Requirements',
    notesPlaceholder: 'e.g. Must be washed, packed in 25kg wooden crates, call 2 days prior to dispatch',
    submitBtn: 'Broadcast Request to Farmers 📢',
    submitting: 'Submitting Request...',
    backBtn: 'Cancel / Back',
    requiredAlert: 'Missing Information',
    successTitle: 'Produce Request Broadcasted! 🌾',
    successMsg: 'Your custom harvest request has been posted. Local farmers and cooperatives matching your district & date period will be alerted.',
  },
  si: {
    headerTitle: 'අස්වනු ඉල්ලුම් පත්‍රය',
    headerSub: 'ඔබට අවශ්‍ය බෝගය, ප්‍රදේශය සහ දින වකවානුව නිශ්චිතව දක්වන්න',
    quickPickTitle: 'ජනප්‍රිය බෝග තෝරන්න',
    cropNameLabel: 'බෝගයේ / අස්වැන්නේ නම',
    cropNamePlaceholder: 'උදා: කැරට්, ලීක්ස්, කීරි සම්බා',
    categoryLabel: 'බෝග වර්ගය',
    quantityLabel: 'අවශ්‍ය ප්‍රමාණය',
    quantityPlaceholder: 'උදා: 100',
    unitLabel: 'මිනුම් ඒකකය',
    originAreaLabel: 'බෝගය ලබාගත යුතු දිස්ත්‍රික්කය / ප්‍රදේශය',
    selectDistrict: 'දිස්ත්‍රික්කය තෝරන්න',
    specificTownLabel: 'නිශ්චිත නගරය / ගම්මානය (විකල්ප)',
    specificTownPlaceholder: 'උදා: වැලිමඩ, කඳපොළ, යාපනය',
    datePeriodLabel: 'අවශ්‍ය දින වකවානුව / කාලසීමාව',
    datePresetLabel: 'කාලරාමුව',
    startDateLabel: 'ආරම්භක දිනය',
    endDateLabel: 'අවසාන දිනය',
    targetPriceLabel: 'බලාපොරොත්තු වන මිල / ඒකකයකට (විකල්ප)',
    targetPricePlaceholder: 'උදා: 240 (රු./කි.ග්‍රෑ.)',
    gradeLabel: 'තත්ත්ව / ශ්‍රේණි අවශ්‍යතාව',
    selectGrade: 'තත්ත්ව ශ්‍රේණිය තෝරන්න',
    deliveryCheckboxLabel: 'ප්‍රවාහන පහසුකම් සහ භාරදීම අවශ්‍යයි',
    deliveryCheckboxSub: 'GoviLink රියදුරන් මගින් ඔබේ ලිපිනයට ප්‍රවාහනය අවශ්‍ය නම් මෙය තෝරන්න. ඔබම ප්‍රවාහනය කරගන්නේ නම් අක්‍රිය කරන්න.',
    selfPickupNotice: '🚜 ස්වයං ප්‍රවාහනය තෝරා ඇත: ඔබ විසින්ම අදාළ ගොවිපලෙන් හෝ මධ්‍යස්ථානයෙන් අස්වැන්න ලබාගත යුතුය.',
    deliveryAddressLabel: 'භාරගත යුතු ලිපිනය',
    deliveryAddressPlaceholder: 'උදා: පිටකොටුව තොග වෙළඳපොළ, අංක 14',
    notesLabel: 'විශේෂ උපදෙස් සහ ඇසුරුම් අවශ්‍යතා',
    notesPlaceholder: 'උදා: සෝදා පිරිසිදු කර 25kg ලී පෙට්ටිවල අසුරා තිබිය යුතුය',
    submitBtn: 'ගොවීන් වෙත ඉල්ලුම යොමු කරන්න 📢',
    submitting: 'ඉල්ලුම යොමු කරමින්...',
    backBtn: 'ආපසු',
    requiredAlert: 'අවශ්‍ය තොරතුරු අසම්පූර්ණයි',
    successTitle: 'අස්වනු ඉල්ලුම සාර්ථකව යොමු කළා! 🌾',
    successMsg: 'ඔබගේ විශේෂ අස්වනු ඉල්ලුම පද්ධතියට එක් කරන ලදී.',
  },
  ta: {
    headerTitle: 'விளைச்சல் கோரிக்கை படிவம்',
    headerSub: 'தேவையான பயிர், மாவட்டம் மற்றும் திகதி கால அளவை குறிப்பிடவும்',
    quickPickTitle: 'பிரபலமான பயிர்களைத் தேர்ந்தெடுக்கவும்',
    cropNameLabel: 'பயிர் / விளைச்சல் பெயர்',
    cropNamePlaceholder: 'e.g. கேரட், லீக்ஸ், உருளைக்கிழங்கு',
    categoryLabel: 'வகை',
    quantityLabel: 'தேவையான அளவு',
    quantityPlaceholder: 'e.g. 100',
    unitLabel: 'அலகு',
    originAreaLabel: 'இலக்கு மாவட்டம் / பகுதி',
    selectDistrict: 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
    specificTownLabel: 'குறிப்பிட்ட ஊர் / பகுதி (விருப்பமானது)',
    specificTownPlaceholder: 'e.g. வெலிமட, கந்தபொல',
    datePeriodLabel: 'தேவையான திகதி காலம்',
    datePresetLabel: 'கால அளவு',
    startDateLabel: 'தொடக்கத் திகதி',
    endDateLabel: 'முடிவுத் திகதி',
    targetPriceLabel: 'எதிர்பார்க்கப்படும் விலை (விருப்பமானது)',
    targetPricePlaceholder: 'e.g. 240 (ரூ./கிலோ)',
    gradeLabel: 'தர வகை',
    selectGrade: 'தரத்தைத் தேர்ந்தெடுக்கவும்',
    deliveryCheckboxLabel: 'போக்குவரத்து மற்றும் விநியோகம் தேவை',
    deliveryCheckboxSub: 'GoviLink ஓட்டுநர்கள் மூலம் விநியோகம் செய்ய வேண்டுமெனில் இதைத் தேர்ந்தெடுக்கவும்.',
    selfPickupNotice: '🚜 சுய போக்குவரத்து: பண்ணையிலிருந்து நீங்களே பெற்றுக் கொள்வீர்கள்.',
    deliveryAddressLabel: 'விநியோக முகவரி',
    deliveryAddressPlaceholder: 'e.g. Colombo Pettah Central Market',
    notesLabel: 'குறிப்புகள் மற்றும் பொதி தேவைகள்',
    notesPlaceholder: 'e.g. 25kg மரப் பெட்டிகளில் பொதி செய்யப்பட வேண்டும்',
    submitBtn: 'கோரிக்கையை அனுப்பவும் 📢',
    submitting: 'அனுப்பப்படுகிறது...',
    backBtn: 'பின்செல்க',
    requiredAlert: 'முழுமையான தகவலை உள்ளிடவும்',
    successTitle: 'கோரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது! 🌾',
    successMsg: 'உங்கள் பயிர் கோரிக்கை பதிவு செய்யப்பட்டுள்ளது.',
  },
};

const formatDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function BuyerRequestProduceScreen({
  userProfile,
  lang = 'en',
  onBack,
  onRequestSubmitted,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Form State
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('kg');
  
  // Origin District / Area
  const [selectedDistrict, setSelectedDistrict] = useState(
    DISTRICTS.find((d) => d.id === 'nuwara_eliya') || DISTRICTS[1]
  );
  const [specificTown, setSpecificTown] = useState('');

  // Date Period State
  const [selectedDatePreset, setSelectedDatePreset] = useState('week');
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDate(d);
  });

  // Additional Fields & Logistics
  const [deliveryNeeded, setDeliveryNeeded] = useState(true);
  const [targetPrice, setTargetPrice] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(QUALITY_GRADES[0]);
  const [deliveryAddress, setDeliveryAddress] = useState(
    userProfile?.district?.nameEn
      ? `${userProfile.district.nameEn} Central Outlet / Warehouse`
      : 'Colombo Pettah Central Market'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  // Quick Preset Selection handler for date period
  const handleSelectDatePreset = (preset) => {
    setSelectedDatePreset(preset.id);
    const start = new Date();
    setStartDate(formatDate(start));
    if (preset.daysOffset > 0) {
      const end = new Date();
      end.setDate(end.getDate() + preset.daysOffset);
      setEndDate(formatDate(end));
    }
  };

  // Quick select crop handler
  const handleQuickSelectCrop = (crop) => {
    const name = lang === 'si' ? crop.nameSi : lang === 'ta' ? crop.nameTa : crop.nameEn;
    setCropName(name);
    setCategory(crop.category || 'Vegetables');
    // If carrots/leeks/potatoes, smartly pre-suggest Nuwara Eliya or Badulla
    if (crop.id === 'carrot' || crop.id === 'leeks' || crop.id === 'potato') {
      const nDistrict = DISTRICTS.find((d) => d.id === 'nuwara_eliya');
      if (nDistrict) setSelectedDistrict(nDistrict);
    } else if (crop.id === 'rice_samba') {
      const pDistrict = DISTRICTS.find((d) => d.id === 'polonnaruwa');
      if (pDistrict) setSelectedDistrict(pDistrict);
    }
  };

  // Quick quantity increment
  const handleAddQty = (amount) => {
    const current = parseFloat(quantity) || 0;
    setQuantity(String(Math.max(1, current + amount)));
  };

  // Submit Handler
  const handleSubmitRequest = async () => {
    if (!cropName.trim()) {
      Alert.alert(t.requiredAlert, 'Please enter or select the produce name.');
      return;
    }
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      Alert.alert(t.requiredAlert, 'Please specify a valid quantity greater than 0.');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert(t.requiredAlert, 'Please specify the start and end dates for the required period.');
      return;
    }

    setIsSubmitting(true);

    const districtLabel =
      lang === 'si'
        ? selectedDistrict.nameSi
        : lang === 'ta'
        ? selectedDistrict.nameTa
        : selectedDistrict.nameEn;

    const requestPayload = {
      buyerUid: userProfile?.uid || 'anonymous_buyer',
      buyerName: userProfile?.fullName || 'GoviLink Buyer',
      buyerPhone: userProfile?.phoneNumber || '',
      buyerEmail: userProfile?.email || '',
      cropName: cropName.trim(),
      category: category,
      quantity: numQty,
      unit: unit,
      targetDistrictId: selectedDistrict.id,
      targetDistrictName: districtLabel,
      targetDistrictEn: selectedDistrict.nameEn,
      specificArea: specificTown.trim() || '',
      requiredDateStart: startDate.trim(),
      requiredDateEnd: endDate.trim(),
      datePeriodDescription: `${startDate.trim()} to ${endDate.trim()}`,
      targetPricePerUnit: targetPrice.trim() ? parseFloat(targetPrice) : null,
      qualityGrade: selectedGrade.labelEn,
      deliveryNeeded: deliveryNeeded,
      deliveryAddress: deliveryNeeded ? deliveryAddress.trim() : 'Self-Pickup by Buyer',
      notes: notes.trim(),
      status: 'OPEN',
    };

    const result = await createBuyerCustomRequest(requestPayload);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(t.successTitle, `${t.successMsg}\n\n📦 ${numQty} ${unit} of ${cropName.trim()}\n📍 ${districtLabel}${specificTown ? ` (${specificTown})` : ''}\n📅 ${startDate} to ${endDate}\n🚚 ${deliveryNeeded ? `Delivery to: ${deliveryAddress.trim() || 'Central Destination'}` : 'Self-Pickup by Buyer'}`, [
        {
          text: 'OK',
          onPress: () => {
            if (onRequestSubmitted) onRequestSubmitted(result.id);
            else if (onBack) onBack();
          },
        },
      ]);
    } else {
      Alert.alert('Error', `Failed to broadcast request: ${result.error}`);
    }
  };

  const filteredDistricts = DISTRICTS.filter((d) => {
    const q = districtSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      d.nameEn.toLowerCase().includes(q) ||
      d.nameSi.includes(q) ||
      d.nameTa.includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.headerBackBtnText}>← {t.backBtn}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.headerTitle}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO BANNER */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🎯 DIRECT FARM SOURCING</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{t.headerTitle}</Text>
            <Text style={styles.heroSub}>{t.headerSub}</Text>
          </View>

          {/* 1. QUICK PICK POPULAR CROPS */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>⚡ {t.quickPickTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickCropRow}>
              {POPULAR_CROPS.map((crop) => {
                const displayName =
                  lang === 'si' ? crop.nameSi : lang === 'ta' ? crop.nameTa : crop.nameEn;
                const isSelected = cropName.toLowerCase() === displayName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={crop.id}
                    style={[styles.quickCropChip, isSelected && styles.quickCropChipSelected]}
                    onPress={() => handleQuickSelectCrop(crop)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickCropChipText,
                        isSelected && styles.quickCropChipTextSelected,
                      ]}
                    >
                      {crop.id === 'carrot' ? '🥕 ' : crop.id === 'potato' ? '🥔 ' : crop.id === 'tomato' ? '🍅 ' : crop.id === 'cabbage' ? '🥬 ' : crop.id === 'banana' ? '🍌 ' : crop.id === 'rice_samba' ? '🌾 ' : crop.id === 'cinnamon' ? '🌿 ' : '🌱 '}
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* CROP NAME INPUT */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t.cropNameLabel} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.cropNamePlaceholder}
                placeholderTextColor={THEME.placeholder}
                value={cropName}
                onChangeText={setCropName}
              />
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.categoryLabel}</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>🏷️ {category}</Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. QUANTITY & UNIT */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>⚖️ {t.quantityLabel}</Text>
            
            <View style={styles.rowTwoCols}>
              <View style={[styles.formGroup, { flex: 1.4, marginRight: 10 }]}>
                <Text style={styles.label}>
                  {t.quantityLabel} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.quantityPlaceholder}
                  placeholderTextColor={THEME.placeholder}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t.unitLabel}</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setUnitModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectBoxText}>{unit}</Text>
                  <Text style={styles.selectBoxArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Increment Steppers */}
            <View style={styles.stepperRow}>
              {[25, 50, 100, 500].map((inc) => (
                <TouchableOpacity
                  key={inc}
                  style={styles.stepperChip}
                  onPress={() => handleAddQty(inc)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperChipText}>+{inc} {unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. TARGET SOURCING DISTRICT & SPECIFIC AREA */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>📍 {t.originAreaLabel}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t.selectDistrict} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setDistrictModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>
                  📍{' '}
                  {lang === 'si'
                    ? selectedDistrict.nameSi
                    : lang === 'ta'
                    ? selectedDistrict.nameTa
                    : selectedDistrict.nameEn}
                </Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.specificTownLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.specificTownPlaceholder}
                placeholderTextColor={THEME.placeholder}
                value={specificTown}
                onChangeText={setSpecificTown}
              />
            </View>
          </View>

          {/* 4. REQUIRED DATE PERIOD / DELIVERY WINDOW */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>📅 {t.datePeriodLabel}</Text>

            {/* Quick Presets */}
            <Text style={styles.subLabel}>{t.datePresetLabel}:</Text>
            <View style={styles.presetWrap}>
              {DATE_PRESETS.map((preset) => {
                const isSelected = selectedDatePreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                    onPress={() => handleSelectDatePreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextSelected,
                      ]}
                    >
                      {preset.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Start & End Dates */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  {t.startDateLabel} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={THEME.placeholder}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  {t.endDateLabel} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={THEME.placeholder}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          </View>

          {/* 5. QUALITY GRADE & TARGET PRICE */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>💎 Quality & Target Budget</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.gradeLabel}</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setGradeModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>
                  ✨{' '}
                  {lang === 'si'
                    ? selectedGrade.labelSi
                    : lang === 'ta'
                    ? selectedGrade.labelTa
                    : selectedGrade.labelEn}
                </Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.targetPriceLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.targetPricePlaceholder}
                placeholderTextColor={THEME.placeholder}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 6. DESTINATION & SPECIAL NOTES */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>🚛 Logistics & Delivery Mode</Text>

            {/* DELIVERY NEEDED CHECKBOX */}
            <TouchableOpacity
              style={[
                styles.checkboxCard,
                deliveryNeeded && styles.checkboxCardActive,
              ]}
              onPress={() => setDeliveryNeeded(!deliveryNeeded)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, deliveryNeeded && styles.checkboxBoxActive]}>
                {deliveryNeeded && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.checkboxTitle}>{t.deliveryCheckboxLabel}</Text>
                <Text style={styles.checkboxSub}>{t.deliveryCheckboxSub}</Text>
              </View>
            </TouchableOpacity>

            {deliveryNeeded ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t.deliveryAddressLabel}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.deliveryAddressPlaceholder}
                  placeholderTextColor={THEME.placeholder}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
              </View>
            ) : (
              <View style={styles.selfPickupBanner}>
                <Text style={styles.selfPickupText}>{t.selfPickupNotice}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.notesLabel}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={THEME.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitRequest}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{t.submitBtn}</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================== */}
      {/* MODAL: DISTRICT PICKER                         */}
      {/* ============================================== */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectDistrict}</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search district name..."
              placeholderTextColor={THEME.placeholder}
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredDistricts.map((item) => {
                const name =
                  lang === 'si' ? item.nameSi : lang === 'ta' ? item.nameTa : item.nameEn;
                const isSelected = selectedDistrict.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedDistrict(item);
                      setDistrictModalVisible(false);
                      setDistrictSearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      📍 {name}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================== */}
      {/* MODAL: CATEGORY PICKER                         */}
      {/* ============================================== */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.categoryLabel}</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      🏷️ {cat}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================== */}
      {/* MODAL: UNIT PICKER                             */}
      {/* ============================================== */}
      <Modal visible={unitModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.unitLabel}</Text>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {UNITS.map((u) => {
                const isSelected = unit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setUnit(u);
                      setUnitModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      ⚖️ {u}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================== */}
      {/* MODAL: GRADE PICKER                            */}
      {/* ============================================== */}
      <Modal visible={gradeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.gradeLabel}</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {QUALITY_GRADES.map((g) => {
                const isSelected = selectedGrade.id === g.id;
                const label =
                  lang === 'si' ? g.labelSi : lang === 'ta' ? g.labelTa : g.labelEn;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedGrade(g);
                      setGradeModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      ✨ {label}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.navy,
  },
  headerBar: {
    backgroundColor: THEME.navy,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    marginRight: 12,
  },
  headerBackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  scrollContent: {
    backgroundColor: THEME.bg,
    padding: 16,
  },
  heroBanner: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: THEME.emerald,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  cardSection: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
    marginBottom: 8,
  },
  quickCropRow: {
    marginBottom: 14,
  },
  quickCropChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  quickCropChipSelected: {
    backgroundColor: THEME.emeraldLight,
    borderColor: THEME.emerald,
  },
  quickCropChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textDark,
  },
  quickCropChipTextSelected: {
    color: THEME.emeraldDark,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: THEME.danger,
    fontWeight: '900',
  },
  textInput: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: THEME.textDark,
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  selectBox: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
    flex: 1,
  },
  selectBoxArrow: {
    fontSize: 12,
    color: THEME.textMuted,
    marginLeft: 8,
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  stepperChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  stepperChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.navy,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  presetChipSelected: {
    backgroundColor: THEME.emeraldLight,
    borderColor: THEME.emerald,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
  },
  presetChipTextSelected: {
    color: THEME.emeraldDark,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: THEME.emerald,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.navy,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textMuted,
  },
  modalSearchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 12,
    color: THEME.textDark,
  },
  modalItem: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemSelected: {
    backgroundColor: THEME.emeraldLight,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
  },
  modalItemTextSelected: {
    color: THEME.emeraldDark,
    fontWeight: '800',
  },
  checkmark: {
    color: THEME.emerald,
    fontWeight: '900',
    fontSize: 16,
  },
  // Checkbox styles
  checkboxCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkboxCardActive: {
    backgroundColor: THEME.emeraldLight,
    borderColor: THEME.emerald,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.textMuted,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: THEME.emerald,
    borderColor: THEME.emerald,
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
  },
  checkboxSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  selfPickupBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  selfPickupText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 16,
  },
});
