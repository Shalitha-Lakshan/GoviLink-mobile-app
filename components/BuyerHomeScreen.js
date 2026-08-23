import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { placeOrderInFirestore } from '../services/firebaseDatabase';

// ----------------------------------------------------
// THEME COLORS
// ----------------------------------------------------
const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
  emeraldDark: '#15803D',
  emeraldLight: '#E8F5E9',
  accentLeaf: '#2ECC71',
  bg: '#F4F7F6',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
};

// ----------------------------------------------------
// LOCALIZATION
// ----------------------------------------------------
const TRANSLATIONS = {
  en: {
    dashboardTitle: 'Fresh Harvest Marketplace',
    tagline: 'Farm-direct fresh produce delivered to your doorstep',
    searchPlaceholder: 'Search vegetables, fruits, grains, or farmer...',
    categories: ['All', 'Vegetables', 'Fruits', 'Rice & Grains', 'Spices'],
    tabs: {
      market: 'Fresh Marketplace',
      myOrders: 'My Orders & Tracking',
    },
    labels: {
      farmer: 'Farmer:',
      location: 'Farm Location:',
      inStock: 'In Stock',
      grade: 'Quality:',
      orderBtn: 'Order Produce',
      currency: 'Rs.',
      logout: 'Logout',
    },
    modal: {
      title: 'Place Direct Farm Order',
      qtyLabel: 'Select Quantity',
      deliveryLabel: 'Delivery Destination Address',
      deliveryPlaceholder: 'e.g. No 45, Galle Road, Colombo 03',
      notesLabel: 'Special Instructions for Farmer / Driver',
      notesPlaceholder: 'e.g. Pack in standard crates, call before arrival',
      subtotal: 'Produce Subtotal:',
      estLogistics: 'Co-op Transport Fee:',
      totalPrice: 'Total Payable:',
      confirmBtn: 'Confirm & Place Order',
      cancelBtn: 'Cancel',
    },
    orderStatus: {
      PENDING: 'Order Sent ⏳',
      ACCEPTED: 'Farmer Confirmed 👨‍🌾',
      READY_FOR_PICKUP: 'Packed for Dispatch 📦',
      IN_TRANSIT: 'In Transit 🚛',
      DELIVERED: 'Delivered ✅',
    },
  },
  si: {
    dashboardTitle: 'නැවුම් කෘෂි අස්වැන්න වෙළඳපොළ',
    tagline: 'ගොවිපලෙන්ම කෙළින්ම ඔබේ දොරකඩටම',
    searchPlaceholder: 'එළවළු, පලතුරු, ධාන්‍ය හෝ ගොවියා සොයන්න...',
    categories: ['සියල්ල', 'එළවළු', 'පලතුරු', 'ධාන්‍ය', 'කුළුබඩු'],
    tabs: {
      market: 'නැවුම් වෙළඳපොළ',
      myOrders: 'මගේ ඇණවුම් සහ ප්‍රවාහනය',
    },
    labels: {
      farmer: 'ගොවියා:',
      location: 'ස්ථානය:',
      inStock: 'තොග ඇත',
      grade: 'තත්ත්වය:',
      orderBtn: 'ඇණවුම් කරන්න',
      currency: 'රු.',
      logout: 'ඉවත් වන්න',
    },
    modal: {
      title: 'කෙලින්ම ගොවියාගෙන් ඇණවුම් කරන්න',
      qtyLabel: 'ප්‍රමාණය තෝරන්න',
      deliveryLabel: 'භාරදිය යුතු ලිපිනය',
      deliveryPlaceholder: 'උදා: අංක 45, ගාලු පාර, කොළඹ 03',
      notesLabel: 'විශේෂ උපදෙස්',
      notesPlaceholder: 'උදා: ආරක්ෂිතව අසුරන්න',
      subtotal: 'අස්වනු වටිනාකම:',
      estLogistics: 'ප්‍රවාහන ගාස්තුව:',
      totalPrice: 'මුළු මුදල:',
      confirmBtn: 'ඇණවුම තහවුරු කරන්න',
      cancelBtn: 'අවලංගු කරන්න',
    },
    orderStatus: {
      PENDING: 'ඇණවුම යොමු කළා ⏳',
      ACCEPTED: 'ගොවියා පිළිගත්තා 👨‍🌾',
      READY_FOR_PICKUP: 'පැටවීමට සූදානම් 📦',
      IN_TRANSIT: 'ප්‍රවාහනයේ පවතී 🚛',
      DELIVERED: 'භාරදුන්නා ✅',
    },
  },
  ta: {
    dashboardTitle: 'புதிய விவசாய சந்தை',
    tagline: 'பண்ணையிலிருந்து நேரடியாக உங்கள் வீட்டு வாசலுக்கு',
    searchPlaceholder: 'காய்கறிகள், பழங்கள் அல்லது விவசாயியைத் தேடுங்கள்...',
    categories: ['அனைத்தும்', 'காய்கறிகள்', 'பழங்கள்', 'தானியங்கள்', 'மசாலா'],
    tabs: {
      market: 'சந்தை',
      myOrders: 'என் ஆர்டர்கள்',
    },
    labels: {
      farmer: 'விவசாயி:',
      location: 'இடம்:',
      inStock: 'இருப்பில் உள்ளது',
      grade: 'தரம்:',
      orderBtn: 'ஆர்டர் செய்',
      currency: 'ரூ.',
      logout: 'வெளியேறு',
    },
    modal: {
      title: 'விவசாயியிடம் நேரடியாக ஆர்டர் செய்யுங்கள்',
      qtyLabel: 'அளவைத் தேர்ந்தெடுக்கவும்',
      deliveryLabel: 'விநியோக முகவரி',
      deliveryPlaceholder: 'e.g. No 45, Galle Road, Colombo 03',
      notesLabel: 'குறிப்புகள்',
      notesPlaceholder: 'e.g. Call upon arrival',
      subtotal: 'மொத்த விலை:',
      estLogistics: 'போக்குவரத்து கட்டணம்:',
      totalPrice: 'செலுத்த வேண்டிய தொகை:',
      confirmBtn: 'ஆர்டரை உறுதிப்படுத்தவும்',
      cancelBtn: 'ரத்து செய்',
    },
    orderStatus: {
      PENDING: 'ஆர்டர் அனுப்பப்பட்டது ⏳',
      ACCEPTED: 'உறுதிப்படுத்தப்பட்டது 👨‍🌾',
      READY_FOR_PICKUP: 'தயாராக உள்ளது 📦',
      IN_TRANSIT: 'பயணத்தில் உள்ளது 🚛',
      DELIVERED: 'முடிந்தது ✅',
    },
  },
};

export default function BuyerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
}) {
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'myOrders'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQty, setOrderQty] = useState(5);
  const [deliveryAddress, setDeliveryAddress] = useState(userProfile?.district?.nameEn ? `${userProfile.district.nameEn} Central Outlet` : 'Colombo 03');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const getProduceTitle = (item) => {
    if (!item) return '';
    if (lang === 'si') return item.nameSi || item.nameEn;
    if (lang === 'ta') return item.nameTa || item.nameEn;
    return item.nameEn;
  };

  const getProduceUnit = (item) => {
    if (!item) return 'kg';
    if (lang === 'si') return item.unitSi || item.unitEn || 'කි.ග්‍රෑ.';
    if (lang === 'ta') return item.unitTa || item.unitEn || 'கிலோ';
    return item.unitEn || 'kg';
  };

  // Filter listings based on search and category
  const filteredListings = produceListings.filter((item) => {
    const title = getProduceTitle(item).toLowerCase();
    const farmer = (item.farmerName || '').toLowerCase();
    const loc = (item.location || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = title.includes(query) || farmer.includes(query) || loc.includes(query);

    if (!matchesSearch) return false;
    if (selectedCategory === 0) return true; // 'All'

    const catName = t.categories[selectedCategory];
    const itemCat = item.category || 'Vegetables';
    if (selectedCategory === 1) return itemCat.toLowerCase().includes('veg');
    if (selectedCategory === 2) return itemCat.toLowerCase().includes('fruit');
    if (selectedCategory === 3) return itemCat.toLowerCase().includes('rice') || itemCat.toLowerCase().includes('grain');
    if (selectedCategory === 4) return itemCat.toLowerCase().includes('spice');
    return true;
  });

  // Filter buyer's own orders
  const myBuyerOrders = ordersList.filter(
    (o) => !o.buyerPhone || o.buyerPhone === userProfile?.phoneNumber || o.buyerName === userProfile?.fullName || true
  );

  const handleOpenOrderModal = (item) => {
    setSelectedProduce(item);
    setOrderQty(Math.min(5, Math.max(1, Math.floor((item.stockQty || 10) / 10) || 5)));
    setShowOrderModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduce) return;
    if (orderQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please select at least 1 unit.');
      return;
    }

    setIsPlacingOrder(true);
    const produceName = getProduceTitle(selectedProduce);
    const unitPrice = selectedProduce.price || 0;
    const subtotal = unitPrice * orderQty;
    const logisticsFee = 350;
    const totalAmount = subtotal + logisticsFee;

    const orderPayload = {
      produceId: selectedProduce.id,
      produceName,
      qty: orderQty,
      unit: getProduceUnit(selectedProduce),
      unitPrice,
      subtotal,
      logisticsFee,
      totalPrice: totalAmount,
      farmerName: selectedProduce.farmerName || 'Registered Farmer',
      farmerId: selectedProduce.farmerId || 'farmer_uid',
      pickupLocation: selectedProduce.location || 'Farm Origin',
      buyerName: userProfile?.fullName || 'GoviLink Buyer',
      buyerPhone: userProfile?.phoneNumber || '',
      buyerUid: userProfile?.uid || '',
      deliveryAddress: deliveryAddress.trim() || 'Default Address',
      deliveryNotes: deliveryNotes.trim(),
      status: 'PENDING',
    };

    const res = await placeOrderInFirestore(orderPayload);
    setIsPlacingOrder(false);

    if (res.success) {
      setShowOrderModal(false);
      Alert.alert(
        'Order Placed! 🌾✨',
        `Your order for ${orderQty} ${getProduceUnit(selectedProduce)} of ${produceName} was placed successfully.\nThe farmer and cooperative logistics have been alerted!`,
        [
          {
            text: 'Track Order',
            onPress: () => setActiveTab('myOrders'),
          },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert('Order Failed', `Could not complete order: ${res.error}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logoBadge}
            resizeMode="contain"
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.brandGovi}>Govi</Text>
              <Text style={styles.brandLink}>Link</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>🛒 Buyer</Text>
              </View>
            </View>
            <Text style={styles.buyerWelcome} numberOfLines={1}>
              Hi, {userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'Buyer'} • 📍 {userProfile?.district?.nameEn || 'Colombo'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Active Orders Pill */}
          <TouchableOpacity
            style={styles.ordersPill}
            onPress={() => setActiveTab('myOrders')}
          >
            <Text style={styles.ordersPillText}>
              📦 {myBuyerOrders.length}
            </Text>
          </TouchableOpacity>

          {/* Language Switcher Pill */}
          {onChangeLanguage && (
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => {
                const nextLang = lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en';
                onChangeLanguage(nextLang);
              }}
            >
              <Text style={styles.langPillText}>
                {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>{t.labels.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'market' && styles.tabBtnActive]}
            onPress={() => setActiveTab('market')}
          >
            <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
              🌾 {t.tabs.market}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'myOrders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('myOrders')}
          >
            <Text style={[styles.tabText, activeTab === 'myOrders' && styles.tabTextActive]}>
              📦 {t.tabs.myOrders} ({myBuyerOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================== */}
        {/* TAB 1: FRESH MARKETPLACE BROWSE & SEARCH       */}
        {/* ============================================== */}
        {activeTab === 'market' && (
          <View>
            {/* Search Input Box */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={THEME.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Category Chips Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
              {t.categories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(idx)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === idx && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === idx && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.marketTitleRow}>
              <Text style={styles.sectionHeader}>{t.dashboardTitle}</Text>
              <Text style={styles.itemCountText}>{filteredListings.length} available</Text>
            </View>

            {/* Produce Cards */}
            {filteredListings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No matching produce found</Text>
                <Text style={styles.emptySubtitle}>Try changing your search term or selecting another category.</Text>
              </View>
            ) : (
              filteredListings.map((item) => (
                <View key={item.id} style={styles.produceCard}>
                  <Image source={{ uri: item.image }} style={styles.produceImage} resizeMode="cover" />
                  <View style={styles.produceDetails}>
                    <View style={styles.badgeRow}>
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>✓ {t.labels.inStock} ({item.stockQty} {getProduceUnit(item)})</Text>
                      </View>
                      <Text style={styles.locationText}>📍 {item.location || 'Sri Lanka'}</Text>
                    </View>

                    <Text style={styles.produceName}>{getProduceTitle(item)}</Text>
                    
                    {item.grade ? (
                      <Text style={styles.gradeBadge}>🌿 {item.grade}</Text>
                    ) : null}

                    <Text style={styles.farmerSubText}>
                      {t.labels.farmer} <Text style={{ fontWeight: '600', color: THEME.textDark }}>{item.farmerName || 'Local Cooperative'}</Text>
                    </Text>

                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.priceText}>
                          {t.labels.currency} {Number(item.price).toFixed(2)}
                        </Text>
                        <Text style={styles.unitSub}>per {getProduceUnit(item)}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.orderButton}
                        activeOpacity={0.85}
                        onPress={() => handleOpenOrderModal(item)}
                      >
                        <Text style={styles.orderButtonText}>🛒 {t.labels.orderBtn}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* TAB 2: MY ORDERS & REAL-TIME TRACKING          */}
        {/* ============================================== */}
        {activeTab === 'myOrders' && (
          <View>
            <Text style={styles.sectionHeader}>{t.tabs.myOrders}</Text>
            {myBuyerOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>No orders placed yet</Text>
                <Text style={styles.emptySubtitle}>Browse the marketplace and place your first fresh farm order!</Text>
              </View>
            ) : (
              myBuyerOrders.map((order) => {
                const status = order.status || 'PENDING';
                const statusLabel = t.orderStatus[status] || status;

                return (
                  <View key={order.id} style={styles.buyerOrderCard}>
                    <View style={styles.orderTopHeader}>
                      <View style={styles.orderIdBadge}>
                        <Text style={styles.orderIdText}>
                          ORDER #{order.id ? order.id.slice(-6).toUpperCase() : 'GL-100'}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusPill,
                        status === 'PENDING' && { backgroundColor: THEME.warningLight },
                        status === 'ACCEPTED' && { backgroundColor: THEME.infoLight },
                        status === 'IN_TRANSIT' && { backgroundColor: THEME.warningLight },
                        status === 'DELIVERED' && { backgroundColor: THEME.emeraldLight },
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          status === 'PENDING' && { color: THEME.warning },
                          status === 'ACCEPTED' && { color: THEME.info },
                          status === 'IN_TRANSIT' && { color: THEME.warning },
                          status === 'DELIVERED' && { color: THEME.emerald },
                        ]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderProduceTitle}>{order.produceName || 'Fresh Harvest Crop'}</Text>
                    
                    <View style={styles.buyerOrderDetailsRow}>
                      <Text style={styles.buyerOrderSub}>
                        👨‍🌾 Farmer: <Text style={{ fontWeight: '600', color: THEME.textDark }}>{order.farmerName || 'GoviLink Farmer'}</Text>
                      </Text>
                      <Text style={styles.buyerOrderSub}>
                        📍 Delivery: <Text style={{ fontWeight: '600', color: THEME.textDark }}>{order.deliveryAddress || 'Address on file'}</Text>
                      </Text>
                    </View>

                    {/* LIVE TRACKING STEPPER */}
                    <View style={styles.stepperContainer}>
                      <View style={[styles.stepItem, { opacity: 1 }]}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <Text style={styles.stepText}>Placed</Text>
                      </View>
                      <View style={[styles.stepLine, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepLineActive]} />
                      <View style={[styles.stepItem, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, (status === 'ACCEPTED' || status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepDotActive]} />
                        <Text style={styles.stepText}>Confirmed</Text>
                      </View>
                      <View style={[styles.stepLine, (status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepLineActive]} />
                      <View style={[styles.stepItem, (status === 'IN_TRANSIT' || status === 'DELIVERED') ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, (status === 'IN_TRANSIT' || status === 'DELIVERED') && styles.stepDotActive]} />
                        <Text style={styles.stepText}>In Transit</Text>
                      </View>
                      <View style={[styles.stepLine, status === 'DELIVERED' && styles.stepLineActive]} />
                      <View style={[styles.stepItem, status === 'DELIVERED' ? { opacity: 1 } : { opacity: 0.4 }]}>
                        <View style={[styles.stepDot, status === 'DELIVERED' && styles.stepDotActive]} />
                        <Text style={styles.stepText}>Delivered</Text>
                      </View>
                    </View>

                    <View style={styles.orderFooterTotalRow}>
                      <Text style={styles.orderFooterQty}>
                        Quantity: <Text style={{ fontWeight: 'bold', color: THEME.textDark }}>{order.qty} {order.unit || 'kg'}</Text>
                      </Text>
                      <Text style={styles.orderFooterPrice}>
                        Total: {t.labels.currency} {Number(order.totalPrice || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================== */}
      {/* MODAL: ORDER CONFIRMATION SHEET                */}
      {/* ============================================== */}
      {selectedProduce && (
        <Modal visible={showOrderModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{t.modal.title}</Text>
                <TouchableOpacity onPress={() => setShowOrderModal(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: THEME.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalProduceName}>{getProduceTitle(selectedProduce)}</Text>
                <Text style={styles.modalFarmerText}>
                  👨‍🌾 {selectedProduce.farmerName} • 📍 {selectedProduce.location}
                </Text>

                {/* QUANTITY CONTROLS */}
                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyLabel}>{t.modal.qtyLabel}:</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQty(Math.max(1, orderQty - 1))}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValText}>
                      {orderQty} {getProduceUnit(selectedProduce)}
                    </Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQty(orderQty + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* QUICK QTY CHIPS */}
                <View style={styles.quickQtyRow}>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.quickQtyPill, orderQty === num && styles.quickQtyPillActive]}
                      onPress={() => setOrderQty(num)}
                    >
                      <Text style={[styles.quickQtyText, orderQty === num && styles.quickQtyTextActive]}>
                        {num} {getProduceUnit(selectedProduce)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* DESTINATION INPUT */}
                <Text style={styles.fieldLabel}>{t.modal.deliveryLabel}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={t.modal.deliveryPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                {/* SPECIAL NOTES */}
                <Text style={styles.fieldLabel}>{t.modal.notesLabel}</Text>
                <TextInput
                  style={[styles.inputField, { height: 60 }]}
                  placeholder={t.modal.notesPlaceholder}
                  placeholderTextColor={THEME.textMuted}
                  multiline
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                />

                {/* BREAKDOWN */}
                <View style={styles.priceBreakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{t.modal.subtotal}</Text>
                    <Text style={styles.breakdownValue}>
                      {t.labels.currency} {((selectedProduce.price || 0) * orderQty).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{t.modal.estLogistics}</Text>
                    <Text style={styles.breakdownValue}>{t.labels.currency} 350.00</Text>
                  </View>
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={styles.totalLabel}>{t.modal.totalPrice}</Text>
                    <Text style={styles.totalVal}>
                      {t.labels.currency} {(((selectedProduce.price || 0) * orderQty) + 350).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowOrderModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>{t.modal.cancelBtn}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    disabled={isPlacingOrder}
                    onPress={handleConfirmOrder}
                  >
                    {isPlacingOrder ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.modalBtnConfirmText}>{t.modal.confirmBtn}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  brandGovi: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandLink: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.accentLeaf,
  },
  roleTag: {
    backgroundColor: THEME.emerald,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buyerWelcome: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordersPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  ordersPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  scrollContainer: {
    backgroundColor: THEME.bg,
    padding: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: THEME.cardBg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  tabTextActive: {
    color: THEME.navy,
    fontWeight: 'bold',
  },

  // Search & Filter
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.textDark,
  },
  chipScrollView: {
    marginBottom: 14,
  },
  categoryChip: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  categoryChipText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  marketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  itemCountText: {
    fontSize: 11,
    color: THEME.textMuted,
  },

  // Cards
  produceCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  produceImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  produceDetails: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: THEME.emeraldDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  produceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginVertical: 4,
  },
  gradeBadge: {
    fontSize: 11,
    color: THEME.emeraldDark,
    marginBottom: 4,
  },
  farmerSubText: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
  },
  priceText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  unitSub: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  orderButton: {
    backgroundColor: THEME.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Buyer Orders
  buyerOrderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdBadge: {
    backgroundColor: THEME.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderProduceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 6,
  },
  buyerOrderDetailsRow: {
    marginBottom: 10,
  },
  buyerOrderSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 2,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.bg,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: THEME.emerald,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginTop: -14,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: THEME.emerald,
  },
  stepText: {
    fontSize: 9,
    color: THEME.textMuted,
    fontWeight: '600',
  },

  orderFooterTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 8,
    marginTop: 4,
  },
  orderFooterQty: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  orderFooterPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },

  // Empty
  emptyCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProduceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  modalFarmerText: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 14,
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textDark,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    backgroundColor: THEME.bg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  qtyValText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: THEME.navy,
  },
  quickQtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickQtyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  quickQtyPillActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  quickQtyText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  quickQtyTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 4,
    marginTop: 6,
  },
  inputField: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.textDark,
    marginBottom: 8,
  },
  priceBreakdownBox: {
    backgroundColor: THEME.bg,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: THEME.bg,
  },
  modalBtnCancelText: {
    color: THEME.textMuted,
    fontWeight: 'bold',
  },
  modalBtnConfirm: {
    backgroundColor: THEME.emerald,
    flex: 2,
  },
  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
