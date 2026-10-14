import React, { useState, useEffect } from 'react';
import { Alert, BackHandler, Platform, View } from 'react-native';
import FarmerWorkspace from './FarmerWorkspace';
import {
  deleteProduceListing,
  updateOrderStatus,
  subscribeToBuyerRequests,
  acceptBuyerCustomRequest,
} from '../services/firebaseDatabase';
import AddProduceScreen from './AddProduceScreen';
import DeliveryTrackingScreen from './DeliveryTrackingScreen';

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Farmer Dashboard',
    tagline: 'Farm Harvest & Orders Hub',
    verifiedBadge: 'Verified Farmer 🧑‍🌾',
    stats: {
      activeListings: 'Active Listings',
      totalRevenue: 'Est. Earnings',
      pendingOrders: 'Pending Orders',
      dispatched: 'In Transit',
    },
    tabs: {
      myListings: 'My Harvest Listings',
      incomingOrders: 'Incoming Requests',
      acceptedOrders: 'Accepted Orders',
    },
    acceptedOrders: {
      sectionTitle: '✅ Accepted Harvest Orders',
      sectionSub: 'Orders & commitments you agreed to supply',
      emptyTitle: 'No accepted orders yet',
      emptySub: 'When you accept custom requests or buyers place orders, they will appear here for delivery confirmation.',
      confirmDeliveryTitle: 'Confirm Order Delivered',
      confirmDeliveryMsg: 'Are you sure this harvest order has been delivered / received by the buyer?',
      confirmDeliveryBtn: 'Confirm Delivered ✅',
      deliveredStatus: 'Order Delivered & Completed ✅',
      readyDriverBtn: 'Ready for delivary 📦',
      waitingDriver: 'Awaiting Driver Pickup 🚛',
      inTransit: 'In Transit with Driver 🚚',
    },
    customRequests: {
      sectionTitle: '📢 Broadcasted Buyer Inquiries',
      sectionSub: 'Buyers requesting specific produce by region & harvest window',
      provideBtn: "I'll Provide 🌾",
      providing: 'Accepting...',
      targetDistrict: 'Target District:',
      datePeriod: 'Required Period:',
      targetPrice: 'Target Budget:',
      quality: 'Grade:',
      delivery: 'Delivery:',
      doorstep: 'Doorstep Delivery 🚚',
      selfPickup: 'Farm Self-Pickup 🚜',
      confirmTitle: 'Provide this Harvest?',
      confirmMsg: 'Do you want to commit to supplying this custom order for the buyer?',
      successTitle: 'Harvest Request Accepted! 🌾',
      successMsg: 'You have committed to supply this harvest. It has been moved to your active orders for dispatch!',
      openBadge: '⏳ Open Inquiry',
      noInquiries: 'No broadcasted buyer inquiries currently matching your region.',
    },
    actions: {
      addNewListing: '+ Add New Harvest Listing',
      logout: 'Logout',
      edit: 'Edit',
      delete: 'Delete',
      acceptOrder: 'Accept Order',
      readyPickup: 'Mark Ready for Driver 📦',
      waitingDriver: 'Awaiting Driver 🚛',
      inTransit: 'In Transit 🚛',
      delivered: 'Delivered ✅',
    },
    modal: {
      title: 'List Fresh Produce',
      subtitle: 'Publish your crop to buyers and cooperatives across Sri Lanka',
      nameEnLabel: 'Crop Name (English)',
      nameEnPlaceholder: 'e.g. Fresh Nuwara Eliya Leeks',
      nameSiLabel: 'Crop Name (Sinhala)',
      nameSiPlaceholder: 'උදා: නැවුම් ලීක්ස්',
      categoryLabel: 'Category',
      priceLabel: 'Price per Unit (Rs.)',
      stockLabel: 'Stock Available (kg / units)',
      locationLabel: 'Farm Location / District',
      gradeLabel: 'Quality Grade / Description',
      submitBtn: 'Publish Harvest to Marketplace',
      cancelBtn: 'Cancel',
    },
    currency: 'Rs.',
  },
  si: {
    dashboardTitle: 'ගොවි උපකරණ පුවරුව',
    tagline: 'අස්වනු සහ ඇණවුම් කළමනාකරණය',
    verifiedBadge: 'සත්‍යාපිත ගොවියා 🧑‍🌾',
    stats: {
      activeListings: 'සක්‍රිය අස්වැන්න',
      totalRevenue: 'ඇස්තමේන්තු ආදායම',
      pendingOrders: 'ලැබුණු ඉල්ලුම්',
      dispatched: 'ප්‍රවාහනයේ පවතින',
    },
    tabs: {
      myListings: 'මගේ අස්වැන්න',
      incomingOrders: 'ලැබුණු ඉල්ලුම්',
      acceptedOrders: 'භාරගත් ඇණවුම්',
    },
    acceptedOrders: {
      sectionTitle: '✅ භාරගත් අස්වනු ඇණවුම්',
      sectionSub: 'ඔබ සැපයීමට එකඟ වූ ඇණවුම් සහ ඉල්ලුම්',
      emptyTitle: 'භාරගත් ඇණවුම් තවමත් නොමැත',
      emptySub: 'ඔබ ඉල්ලුමක් භාරගත් පසු එය මෙහි දිස්වන අතර භාරදුන් බව තහවුරු කළ හැක.',
      confirmDeliveryTitle: 'ඇණවුම භාරදුන් බව තහවුරු කිරීම',
      confirmDeliveryMsg: 'මෙම අස්වනු ඇණවුම ගැනුම්කරු වෙත සාර්ථකව භාරදුන් බව තහවුරු කරනවාද?',
      confirmDeliveryBtn: 'භාරදුන් බව තහවුරු කරන්න ✅',
      deliveredStatus: 'සාර්ථකව භාරදුන්නා ✅',
      readyDriverBtn: 'පැටවීමට සූදානම් 📦',
      waitingDriver: 'රියදුරු පැමිණෙන තෙක් 🚛',
      inTransit: 'ප්‍රවාහනයේ පවතී 🚚',
    },
    customRequests: {
      sectionTitle: '📢 ගැනුම්කරුවන්ගේ විශේෂ අස්වනු ඉල්ලුම්',
      sectionSub: 'ප්‍රදේශය සහ දින වකවානුව අනුව ගැනුම්කරුවන් ඉදිරිපත් කර ඇති ඉල්ලුම්',
      provideBtn: 'මම සපයන්නම් 🌾',
      providing: 'භාරගනිමින් පවතී...',
      targetDistrict: 'අපේක්ෂිත ප්‍රදේශය:',
      datePeriod: 'දින වකවානුව:',
      targetPrice: 'බලාපොරොත්තු මිල:',
      quality: 'තත්ත්ව ශ්‍රේණිය:',
      delivery: 'ප්‍රවාහනය:',
      doorstep: 'ප්‍රවාහන පහසුකම් අවශ්‍යයි 🚚',
      selfPickup: 'ස්වයං ප්‍රවාහනය (ගොවිපලෙන්ම) 🚜',
      confirmTitle: 'මෙම අස්වැන්න සැපයීමට ඔබ එකඟද?',
      confirmMsg: 'ගැනුම්කරුගේ මෙම ඉල්ලුම සපුරාලීමට ඔබ කැපවීමට සූදානම්ද?',
      successTitle: 'ඉල්ලුම සාර්ථකව භාරගත්තා! 🌾',
      successMsg: 'ඔබ මෙම අස්වැන්න සැපයීමට එකඟ විය. එය ඔබගේ සක්‍රිය ඇණවුම් ලැයිස්තුවට එක් විය!',
      openBadge: '⏳ විවෘත ඉල්ලුමක්',
      noInquiries: 'දැනට නව විශේෂ ඉල්ලුම් කිසිවක් නොමැත.',
    },
    actions: {
      addNewListing: '+ අලුත් අස්වැන්නක් එක් කරන්න',
      logout: 'ඉවත් වන්න',
      edit: 'සංස්කරණය',
      delete: 'මකන්න',
      acceptOrder: 'ඇණවුම භාරගන්න',
      readyPickup: 'ප්‍රවාහනයට සූදානම් 📦',
      waitingDriver: 'රියදුරු පැමිණෙන තෙක් 🚛',
      inTransit: 'ප්‍රවාහනයේ පවතී 🚛',
      delivered: 'භාරදුන්නා ✅',
    },
    modal: {
      title: 'අලුත් අස්වැන්න ලැයිස්තුගත කරන්න',
      subtitle: 'ගණුදෙනුකරුවන්ට ඔබේ අස්වැන්න ප්‍රදර්ශනය කරන්න',
      nameEnLabel: 'නම (ඉංග්‍රීසි)',
      nameEnPlaceholder: 'උදා: Nuwara Eliya Leeks',
      nameSiLabel: 'නම (සිංහල)',
      nameSiPlaceholder: 'උදා: නැවුම් ලීක්ස්',
      categoryLabel: 'කාණ්ඩය',
      priceLabel: 'ඒකකයක මිල (රු.)',
      stockLabel: 'ලබාදිය හැකි තොග ප්‍රමාණය (කි.ග්‍රෑ.)',
      locationLabel: 'ගොවිපල පිහිටි ස්ථානය / දිස්ත්‍රික්කය',
      gradeLabel: 'තත්ත්ව සහතිකය / විස්තරය',
      submitBtn: 'වෙළඳපොළට එක් කරන්න',
      cancelBtn: 'අවලංගු කරන්න',
    },
    currency: 'රු.',
  },
  ta: {
    dashboardTitle: 'விவசாயி டாஷ்போர்டு',
    tagline: 'விளைச்சல் & ஆர்டர் மேலாண்மை',
    verifiedBadge: 'சரிபார்க்கப்பட்ட விவசாயி 🧑‍🌾',
    stats: {
      activeListings: 'செயலில் உள்ளவை',
      totalRevenue: 'வருவாய்',
      pendingOrders: 'நிலுவை கோரிக்கைகள்',
      dispatched: 'விநியோகத்தில்',
    },
    tabs: {
      myListings: 'என் விளைச்சல்',
      incomingOrders: 'வந்த கோரிக்கைகள்',
      acceptedOrders: 'ஏற்றுக்கொண்டவை',
    },
    acceptedOrders: {
      sectionTitle: '✅ ஏற்றுக்கொள்ளப்பட்ட ஆர்டர்கள்',
      sectionSub: 'நீங்கள் வழங்க ஒப்புக்கொண்ட ஆர்டர்கள்',
      emptyTitle: 'ஏற்றுக்கொண்ட ஆர்டர்கள் இல்லை',
      emptySub: 'நீங்கள் கோரிக்கையை ஏற்றுக்கொண்டவுடன் இங்கே தோன்றும்.',
      confirmDeliveryTitle: 'விநியோகத்தை உறுதிப்படுத்து',
      confirmDeliveryMsg: 'இந்த ஆர்டர் வாங்குபவருக்கு வெற்றிகரமாக வழங்கப்பட்டதா?',
      confirmDeliveryBtn: 'விநியோகத்தை உறுதிப்படுத்து ✅',
      deliveredStatus: 'விநியோகம் முடிந்தது ✅',
      readyDriverBtn: 'ஓட்டுநருக்கு தயார் 📦',
      waitingDriver: 'ஓட்டுநருக்கு காத்திருக்கிறது 🚛',
      inTransit: 'பயணத்தில் உள்ளது 🚚',
    },
    customRequests: {
      sectionTitle: '📢 வாங்குபவர்களின் விசேட கோரிக்கைகள்',
      sectionSub: 'பகுதி மற்றும் திகதி அடிப்படையிலான பயிர் கோரிக்கைகள்',
      provideBtn: 'நான் வழங்குகிறேன் 🌾',
      providing: 'ஏற்றுக்கொள்கிறது...',
      targetDistrict: 'மாவட்டம்:',
      datePeriod: 'திகதி காலம்:',
      targetPrice: 'எதிர்பார்க்கப்படும் விலை:',
      grade: 'தரம்:',
      delivery: 'விநியோகம்:',
      doorstep: 'விநியோகம் தேவை 🚚',
      selfPickup: 'சுய போக்குவரத்து 🚜',
      confirmTitle: 'இந்த விளைச்சலை வழங்க ஒப்புக்கொள்கிறீர்களா?',
      confirmMsg: 'வாங்குபவருக்கு இந்த ஆர்டரை வழங்க விரும்புகிறீர்களா?',
      successTitle: 'கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது! 🌾',
      successMsg: 'நீங்கள் இந்த ஆர்டரை வழங்க ஒப்புக்கொண்டுள்ளீர்கள்.',
      openBadge: '⏳ திறந்த கோரிக்கை',
      noInquiries: 'புதிய கோரிக்கைகள் எதுவும் இல்லை.',
    },
    actions: {
      addNewListing: '+ புதிய விளைச்சலைச் சேர்க்கவும்',
      logout: 'வெளியேறு',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      acceptOrder: 'ஆர்டரை ஏற்றுக்கொள்',
      readyPickup: 'ஓட்டுநருக்கு தயார் 📦',
      waitingDriver: 'ஓட்டுநருக்கு காத்திருக்கிறது 🚛',
      inTransit: 'பயணத்தில் உள்ளது 🚛',
      delivered: 'முடிந்தது ✅',
    },
    modal: {
      title: 'புதிய விளைச்சலைச் சேர்க்க',
      subtitle: 'கொள்முதல் செய்பவர்களுக்கு உங்கள் விளைச்சலை பகிரவும்',
      nameEnLabel: 'பெயர் (ஆங்கிலம்)',
      nameEnPlaceholder: 'e.g. Fresh Nuwara Eliya Leeks',
      nameSiLabel: 'பெயர் (சிங்களம்)',
      nameSiPlaceholder: 'උදා: ලීක්ස්',
      categoryLabel: 'வகை',
      priceLabel: 'விலை (ரூ.)',
      stockLabel: 'இருப்பு அளவு (கிலோ)',
      locationLabel: 'பண்ணை இடம் / மாவட்டம்',
      gradeLabel: 'தர விவரம்',
      submitBtn: 'சந்தையில் சேர்க்கவும்',
      cancelBtn: 'ரத்து செய்',
    },
    currency: 'ரூ.',
  },
};

export default function FarmerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
  onProfileUpdated,
}) {
  const [activeTab, setActiveTab] = useState('home'); // Overview, harvest, requests, orders, profile
  const [customRequests, setCustomRequests] = useState([]);
  const [providingRequestId, setProvidingRequestId] = useState(null);
  const [showAddProduceScreen, setShowAddProduceScreen] = useState(false);
  const [editingProduceItem, setEditingProduceItem] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [produceToDelete, setProduceToDelete] = useState(null);
  const [isDeletingProduce, setIsDeletingProduce] = useState(false);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showAddProduceScreen || editingProduceItem) {
        setShowAddProduceScreen(false);
        setEditingProduceItem(null);
      } else if (selectedDeliveryForTracking) {
        setSelectedDeliveryForTracking(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        return false;
      }
      return true;
    });
    return () => subscription.remove();
  }, [showAddProduceScreen, editingProduceItem, selectedDeliveryForTracking, activeTab]);

  // Real-time listener for buyer custom produce requests
  useEffect(() => {
    const unsub = subscribeToBuyerRequests((requests) => {
      setCustomRequests(requests || []);
    });
    return () => unsub && unsub();
  }, []);

  // Filter open custom requests broadcasted by buyers
  const openCustomRequests = customRequests.filter(
    (r) => r.status === 'OPEN' || !r.status
  );

  // Filter listings for this farmer or display active listings
  // Filter listings for this farmer
  const myProduce = produceListings.filter(
    (item) => !item.farmerId || item.farmerId === userProfile?.uid || item.farmerName?.includes(userProfile?.fullName || 'Farmer')
  );
  const displayListings = myProduce;

  const handleDeleteProduce = (item) => {
    setProduceToDelete(item);
  };

  const confirmDeleteProduce = async () => {
    if (!produceToDelete?.id) return;
    setIsDeletingProduce(true);
    try {
      const res = await deleteProduceListing(produceToDelete.id);
      setIsDeletingProduce(false);
      const deletedItemName = produceToDelete.nameEn || produceToDelete.nameSi || 'Produce';
      setProduceToDelete(null);

      if (res && !res.success) {
        if (Platform.OS === 'web') {
          window.alert(`Could not delete produce: ${res.error}`);
        } else {
          Alert.alert('Error', `Could not delete produce: ${res.error}`);
        }
      }
    } catch (e) {
      setIsDeletingProduce(false);
      setProduceToDelete(null);
      console.error('Delete produce error:', e);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    const res = await updateOrderStatus(orderId, newStatus, {
      farmerName: userProfile?.fullName || 'Farmer Partner',
      farmerId: userProfile?.uid || '',
      changedBy: userProfile?.fullName || 'Farmer Partner',
      actorRole: 'farmer',
    });
    setUpdatingOrderId(null);

    if (res.success) {
      if (Platform.OS === 'web') {
        window.alert(`Order status updated to: ${newStatus.replace(/_/g, ' ')}`);
      } else {
        Alert.alert('Order Updated', `Status changed to: ${newStatus.replace(/_/g, ' ')}`);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Update Failed: ${res.error || 'Could not update order status.'}`);
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update order status.');
      }
    }
  };

  const handleConfirmDelivered = (order) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(
        `${t.acceptedOrders.confirmDeliveryTitle}\n\n${t.acceptedOrders.confirmDeliveryMsg}\n\nProduce: ${order.produceName || 'Produce'} (${order.qty} ${order.unit || 'kg'})\nBuyer: ${order.buyerName || 'Buyer'}`
      );
      if (ok) {
        handleUpdateOrderStatus(order.id, 'DELIVERED');
      }
      return;
    }
    Alert.alert(
      t.acceptedOrders.confirmDeliveryTitle,
      `${t.acceptedOrders.confirmDeliveryMsg}\n\n📦 ${order.produceName || 'Produce'} (${order.qty} ${order.unit || 'kg'})\n👤 Buyer: ${order.buyerName || 'Buyer'}\n📍 Delivery: ${order.deliveryAddress || 'Self-Pickup'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t.acceptedOrders.confirmDeliveryBtn,
          onPress: async () => {
            await handleUpdateOrderStatus(order.id, 'DELIVERED');
          },
        },
      ]
    );
  };

  const handleProvideCustomRequest = (request) => {
    const cropTitle = request.cropName || 'Harvest';
    const districtDisplay =
      lang === 'si'
        ? request.targetDistrictName || request.targetDistrictEn || 'දිවයින පුරා'
        : lang === 'ta'
        ? request.targetDistrictName || request.targetDistrictEn || 'நாடு முழுவதும்'
        : request.targetDistrictName || request.targetDistrictEn || 'Island-wide';
    const areaDetail = request.specificArea ? ` (${request.specificArea})` : '';

    const message = `${t.customRequests.confirmMsg}\n\n${request.quantity} ${request.unit || 'kg'} of ${cropTitle}\n${districtDisplay}${areaDetail}\n${request.datePeriodDescription || [request.requiredDateStart, request.requiredDateEnd].filter(Boolean).join(' – ')}\n${request.buyerName || 'Buyer'}`;
    const acceptRequest = async () => {
      setProvidingRequestId(request.id);
      try {
        const res = await acceptBuyerCustomRequest(request, userProfile);
        if (!res.success) throw new Error(res.error || 'Please try again.');
        setActiveTab('accepted');
        if (Platform.OS === 'web') window.alert(t.customRequests.successMsg);
        else Alert.alert(t.customRequests.successTitle, t.customRequests.successMsg);
      } catch (error) {
        if (Platform.OS === 'web') window.alert(error.message);
        else Alert.alert('Could not accept request', error.message);
      } finally {
        setProvidingRequestId(null);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(message)) acceptRequest();
    } else {
      Alert.alert(t.customRequests.confirmTitle, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: t.customRequests.provideBtn, onPress: acceptRequest },
      ]);
    }
  };

  // Filter accepted orders for this farmer
  const myAcceptedOrders = ordersList.filter(
    (o) =>
      !o.farmerId ||
      o.farmerId === userProfile?.uid ||
      o.farmerName === userProfile?.fullName ||
      o.farmerName?.includes(userProfile?.fullName || 'Farmer')
  );

  if (selectedDeliveryForTracking) {
    return (
      <DeliveryTrackingScreen
        delivery={selectedDeliveryForTracking}
        userProfile={userProfile}
        lang={lang}
        onBack={() => setSelectedDeliveryForTracking(null)}
        onLogout={onLogout}
      />
    );
  }

  return (
    <>
    <View style={{ flex: 1 }} accessibilityElementsHidden={Boolean(showAddProduceScreen || editingProduceItem)}
      importantForAccessibility={showAddProduceScreen || editingProduceItem ? 'no-hide-descendants' : 'auto'}
      aria-hidden={Boolean(showAddProduceScreen || editingProduceItem)}>
    <FarmerWorkspace
      userProfile={userProfile} lang={lang} t={t}
      activeTab={activeTab} setActiveTab={setActiveTab}
      listings={displayListings} requests={openCustomRequests} orders={myAcceptedOrders}
      onAdd={() => setShowAddProduceScreen(true)} onEdit={setEditingProduceItem}
      onDelete={handleDeleteProduce} onProvide={handleProvideCustomRequest}
      onUpdateStatus={handleUpdateOrderStatus} onDelivered={handleConfirmDelivered}
      onTrack={setSelectedDeliveryForTracking} onLogout={onLogout}
      onChangeLanguage={onChangeLanguage} onProfileUpdated={onProfileUpdated}
      providingRequestId={providingRequestId} updatingOrderId={updatingOrderId}
      produceToDelete={produceToDelete} isDeletingProduce={isDeletingProduce}
      onCancelDelete={() => setProduceToDelete(null)} onConfirmDelete={confirmDeleteProduce}
    />
    </View>
    {(showAddProduceScreen || editingProduceItem) && (
      <AddProduceScreen
        userProfile={userProfile}
        lang={lang}
        initialProduce={editingProduceItem}
        onBack={() => {
          setShowAddProduceScreen(false);
          setEditingProduceItem(null);
        }}
        onProduceAdded={() => {
          setShowAddProduceScreen(false);
          setEditingProduceItem(null);
        }}
      />
    )}
    </>
  );
}
