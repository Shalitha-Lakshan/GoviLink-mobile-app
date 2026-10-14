import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  FARMER_COLORS as C,
  FarmerButton,
  FilterChip,
  IconTile,
  cleanLabel,
} from './FarmerDesign';
import { createBuyerCustomRequest } from '../services/firebaseDatabase';

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
  { id: 'urgent', labelEn: 'Immediate (48h)', daysOffset: 2 },
  { id: 'week', labelEn: 'Within 7 Days', daysOffset: 7 },
  { id: 'two_weeks', labelEn: 'Next 14 Days', daysOffset: 14 },
  { id: 'month', labelEn: 'Next 30 Days', daysOffset: 30 },
  { id: 'custom', labelEn: 'Custom Period', daysOffset: 0 },
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
    selfPickupNotice: '🚜 Self-Pickup selected: You will arrange your own logistics from the farm or aggregation hub.',
    deliveryAddressLabel: 'Delivery Destination Address',
    deliveryAddressPlaceholder: 'e.g. Colombo Pettah Central Market, Store #14',
    notesLabel: 'Special Instructions / Packaging Requirements',
    notesPlaceholder: 'e.g. Must be washed, packed in 25kg wooden crates, call 2 days prior to dispatch',
    submitBtn: 'Broadcast Request to Farmers',
    submitting: 'Broadcasting Request...',
    backBtn: 'Cancel',
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
    deliveryCheckboxSub: 'GoviLink රියදුරන් මගින් ඔබේ ලිපිනයට ප්‍රවාහනය අවශ්‍ය නම් මෙය තෝරන්න.',
    selfPickupNotice: '🚜 ස්වයං ප්‍රවාහනය: ඔබ විසින්ම අදාළ ගොවිපලෙන් අස්වැන්න ලබාගත යුතුය.',
    deliveryAddressLabel: 'භාරගත යුතු ලිපිනය',
    deliveryAddressPlaceholder: 'උදා: පිටකොටුව තොග වෙළඳපොළ, අංක 14',
    notesLabel: 'විශේෂ උපදෙස් සහ ඇසුරුම් අවශ්‍යතා',
    notesPlaceholder: 'උදා: සෝදා පිරිසිදු කර 25kg ලී පෙට්ටිවල අසුරා තිබිය යුතුය',
    submitBtn: 'ගොවීන් වෙත ඉල්ලුම යොමු කරන්න',
    submitting: 'ඉල්ලුම යොමු කරමින්...',
    backBtn: 'අවලංගු කරන්න',
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
    submitBtn: 'கோரிக்கையை அனுப்பவும்',
    submitting: 'அனுப்பப்படுகிறது...',
    backBtn: 'ரத்து செய்',
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
      Alert.alert(
        t.successTitle,
        `${t.successMsg}\n\n📦 ${numQty} ${unit} of ${cropName.trim()}\n📍 ${districtLabel}${specificTown ? ` (${specificTown})` : ''}\n📅 ${startDate} to ${endDate}\n🚚 ${deliveryNeeded ? `Delivery to: ${deliveryAddress.trim() || 'Central Destination'}` : 'Self-Pickup by Buyer'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onRequestSubmitted) onRequestSubmitted(result.id);
              else if (onBack) onBack();
            },
          },
        ]
      );
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerBackBtn}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>
            {cleanLabel(t.headerTitle)}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t.headerSub}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO BANNER MATCHING FARMER WORKSPACE */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroPill}>
                <Ionicons name="megaphone-outline" size={13} color="#D1E9D9" />
                <Text style={styles.heroEyebrow}>DIRECT SOURCING</Text>
              </View>
              <Ionicons name="leaf-outline" size={32} color="#82AE92" />
            </View>
            <Text style={styles.heroTitle}>{t.headerTitle}</Text>
            <Text style={styles.heroSub}>{t.headerSub}</Text>
          </View>

          {/* 1. QUICK PICK POPULAR CROPS */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <IconTile name="leaf-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>01</Text>
                <Text style={styles.sectionTitle}>Crop & Category</Text>
                <Text style={styles.sectionSub}>{t.quickPickTitle}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {POPULAR_CROPS.map((crop) => {
                const displayName =
                  lang === 'si' ? crop.nameSi : lang === 'ta' ? crop.nameTa : crop.nameEn;
                const isSelected = cropName.toLowerCase() === displayName.toLowerCase();
                return (
                  <FilterChip
                    key={crop.id}
                    label={displayName}
                    selected={isSelected}
                    onPress={() => handleQuickSelectCrop(crop)}
                  />
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
                placeholderTextColor={C.muted}
                value={cropName}
                onChangeText={setCropName}
              />
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.categoryLabel}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Select category"
                style={styles.selectBox}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>{category}</Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. QUANTITY & UNIT */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <IconTile name="scale-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>02</Text>
                <Text style={styles.sectionTitle}>Required Volume</Text>
                <Text style={styles.sectionSub}>Set the quantity and packaging unit</Text>
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.formGroup, { flex: 1.4, marginRight: 10 }]}>
                <Text style={styles.label}>
                  {t.quantityLabel} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.quantityPlaceholder}
                  placeholderTextColor={C.muted}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t.unitLabel}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Select unit"
                  style={styles.selectBox}
                  onPress={() => setUnitModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectBoxText}>{unit}</Text>
                  <Ionicons name="chevron-down" size={18} color={C.muted} />
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
            <View style={styles.sectionHeader}>
              <IconTile name="location-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>03</Text>
                <Text style={styles.sectionTitle}>Target Sourcing District</Text>
                <Text style={styles.sectionSub}>Connect with farmers in specific agricultural zones</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t.selectDistrict} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Select target district"
                style={styles.selectBox}
                onPress={() => setDistrictModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>
                  {lang === 'si'
                    ? selectedDistrict.nameSi
                    : lang === 'ta'
                    ? selectedDistrict.nameTa
                    : selectedDistrict.nameEn}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.specificTownLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.specificTownPlaceholder}
                placeholderTextColor={C.muted}
                value={specificTown}
                onChangeText={setSpecificTown}
              />
            </View>
          </View>

          {/* 4. REQUIRED DATE PERIOD / DELIVERY WINDOW */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <IconTile name="calendar-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>04</Text>
                <Text style={styles.sectionTitle}>Harvest Period</Text>
                <Text style={styles.sectionSub}>{t.datePresetLabel}</Text>
              </View>
            </View>

            {/* Quick Presets */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {DATE_PRESETS.map((preset) => {
                const isSelected = selectedDatePreset === preset.id;
                return (
                  <FilterChip
                    key={preset.id}
                    label={preset.labelEn}
                    selected={isSelected}
                    onPress={() => handleSelectDatePreset(preset)}
                  />
                );
              })}
            </ScrollView>

            {/* Start & End Dates */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  {t.startDateLabel} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.muted}
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
                  placeholderTextColor={C.muted}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          </View>

          {/* 5. QUALITY GRADE & TARGET PRICE */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <IconTile name="ribbon-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>05</Text>
                <Text style={styles.sectionTitle}>Quality & Budget</Text>
                <Text style={styles.sectionSub}>Specify quality standards and pricing</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.gradeLabel}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Select quality grade"
                style={styles.selectBox}
                onPress={() => setGradeModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBoxText}>
                  {lang === 'si'
                    ? selectedGrade.labelSi
                    : lang === 'ta'
                    ? selectedGrade.labelTa
                    : selectedGrade.labelEn}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.targetPriceLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.targetPricePlaceholder}
                placeholderTextColor={C.muted}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 6. DESTINATION & SPECIAL NOTES */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <IconTile name="car-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionNumber}>06</Text>
                <Text style={styles.sectionTitle}>Logistics & Notes</Text>
                <Text style={styles.sectionSub}>Choose delivery method and instructions</Text>
              </View>
            </View>

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
                {deliveryNeeded && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
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
                  placeholderTextColor={C.muted}
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
                placeholderTextColor={C.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* ACTION BUTTONS ROW */}
          <View style={styles.actionsRow}>
            <FarmerButton
              label={t.backBtn}
              secondary
              onPress={onBack}
              style={{ flex: 1 }}
            />
            <FarmerButton
              label={cleanLabel(t.submitBtn)}
              icon="paper-plane-outline"
              loading={isSubmitting}
              onPress={handleSubmitRequest}
              style={{ flex: 1.4 }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================== */}
      {/* MODAL: DISTRICT PICKER                         */}
      {/* ============================================== */}
      <Modal visible={districtModalVisible} transparent animationType="fade" onRequestClose={() => setDistrictModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectDistrict}</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={C.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={18} color={C.muted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search district name..."
                placeholderTextColor={C.muted}
                value={districtSearch}
                onChangeText={setDistrictSearch}
              />
              {!!districtSearch && (
                <TouchableOpacity onPress={() => setDistrictSearch('')}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

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
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={isSelected ? C.greenDark : C.muted}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
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
      <Modal visible={categoryModalVisible} transparent animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.categoryLabel}</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={C.ink} />
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
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color={isSelected ? C.greenDark : C.muted}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {cat}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
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
      <Modal visible={unitModalVisible} transparent animationType="fade" onRequestClose={() => setUnitModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.unitLabel}</Text>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={C.ink} />
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
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color={isSelected ? C.greenDark : C.muted}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {u}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
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
      <Modal visible={gradeModalVisible} transparent animationType="fade" onRequestClose={() => setGradeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.gradeLabel}</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={C.ink} />
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
                    <Ionicons
                      name="ribbon-outline"
                      size={18}
                      color={isSelected ? C.greenDark : C.muted}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.green} />}
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
    backgroundColor: C.canvas,
  },
  headerBar: {
    backgroundColor: C.canvas,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  heroBanner: {
    backgroundColor: C.greenDark,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#487B65',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1E9D9',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 20,
    color: '#C1D9CC',
    marginTop: 8,
  },
  cardSection: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: C.green,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  sectionSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 12,
    paddingTop: 4,
  },
  formGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.ink,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: C.red,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  selectBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  stepperChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.greenDark,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.canvas,
    marginTop: 6,
    marginBottom: 12,
  },
  checkboxCardActive: {
    borderColor: C.green,
    backgroundColor: C.mint,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  checkboxSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  selfPickupBanner: {
    backgroundColor: C.amberBg,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  selfPickupText: {
    fontSize: 12,
    color: C.amber,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,35,26,0.5)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    minHeight: 40,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: C.mint,
  },
  modalItemText: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: C.greenDark,
    fontWeight: '700',
  },
});
