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
import {
  addProduceListing,
  deleteProduceListing,
  updateOrderStatus,
} from '../services/firebaseDatabase';
import AddProduceScreen from './AddProduceScreen';

// ----------------------------------------------------
// COLOR TOKENS
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
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
};

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
      incomingOrders: 'Incoming Orders',
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
      pendingOrders: 'ලැබුණු ඇණවුම්',
      dispatched: 'ප්‍රවාහනයේ පවතින',
    },
    tabs: {
      myListings: 'මගේ අස්වැන්න ලැයිස්තුව',
      incomingOrders: 'ලැබුණු ඇණවුම්',
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
      pendingOrders: 'நிலுவை ஆர்டர்கள்',
      dispatched: 'விநியோகத்தில்',
    },
    tabs: {
      myListings: 'என் விளைச்சல்',
      incomingOrders: 'வந்த ஆர்டர்கள்',
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

const CATEGORIES = ['Vegetables', 'Fruits', 'Rice & Grains', 'Spices'];

const DEFAULT_IMAGE_BY_CAT = {
  Vegetables: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  Fruits: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  'Rice & Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  Spices: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
};

export default function FarmerHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
}) {
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'orders'
  const [showAddProduceScreen, setShowAddProduceScreen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Add Produce Form State
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameSi, setFormNameSi] = useState('');
  const [formCategory, setFormCategory] = useState('Vegetables');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formLocation, setFormLocation] = useState(userProfile?.district?.nameEn || 'Nuwara Eliya');
  const [formGrade, setFormGrade] = useState('Grade A Fresh Harvest');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Filter listings for this farmer or display active listings
  // Filter listings for this farmer
  const myProduce = produceListings.filter(
    (item) => !item.farmerId || item.farmerId === userProfile?.uid || item.farmerName?.includes(userProfile?.fullName || 'Farmer')
  );
  const displayListings = myProduce;

  // Real-time calculations
  const pendingOrders = ordersList.filter((o) => o.status === 'PENDING' || !o.status);
  const inTransitOrders = ordersList.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'READY_FOR_PICKUP');
  
  // Calculate total earnings strictly from real orders
  const totalSalesCalculated = ordersList
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const handleCreateProduce = async () => {
    if (!formNameEn.trim()) {
      Alert.alert('Required', 'Please enter the crop name.');
      return;
    }
    if (!formPrice || isNaN(formPrice) || Number(formPrice) <= 0) {
      Alert.alert('Required', 'Please enter a valid price per unit.');
      return;
    }
    if (!formStock || isNaN(formStock) || Number(formStock) <= 0) {
      Alert.alert('Required', 'Please enter valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    const newProduce = {
      nameEn: formNameEn.trim(),
      nameSi: formNameSi.trim() || formNameEn.trim(),
      nameTa: formNameEn.trim(),
      category: formCategory,
      price: parseFloat(formPrice),
      stockQty: parseFloat(formStock),
      unitEn: 'kg',
      unitSi: 'කි.ග්‍රෑ.',
      unitTa: 'கிலோ',
      location: formLocation.trim() || 'Sri Lanka',
      grade: formGrade.trim(),
      farmerName: userProfile?.fullName || 'Registered Farmer',
      farmerId: userProfile?.uid || 'farmer_uid',
      farmerPhone: userProfile?.phoneNumber || '',
      image: DEFAULT_IMAGE_BY_CAT[formCategory] || DEFAULT_IMAGE_BY_CAT.Vegetables,
    };

    const res = await addProduceListing(newProduce);
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert('Success 🌱', 'Your produce listing has been published live to the GoviLink marketplace!');
      setShowAddModal(false);
      // Reset form
      setFormNameEn('');
      setFormNameSi('');
      setFormPrice('');
      setFormStock('');
    } else {
      Alert.alert('Error', `Could not add produce: ${res.error}`);
    }
  };

  const handleDeleteProduce = (item) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to remove "${item.nameEn || item.nameSi}" from your inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item.id) {
              await deleteProduceListing(item.id);
            }
            Alert.alert('Listing Removed', 'Produce was removed from marketplace.');
          },
        },
      ]
    );
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    const res = await updateOrderStatus(orderId, newStatus);
    setUpdatingOrderId(null);

    if (res.success) {
      Alert.alert('Order Updated', `Status changed to: ${newStatus.replace(/_/g, ' ')}`);
    } else {
      Alert.alert('Update Failed', res.error || 'Could not update order status.');
    }
  };

  if (showAddProduceScreen) {
    return (
      <AddProduceScreen
        userProfile={userProfile}
        lang={lang}
        onBack={() => setShowAddProduceScreen(false)}
        onProduceAdded={() => setShowAddProduceScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP BRAND & PROFILE BAR */}
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
                <Text style={styles.roleTagText}>🧑‍🌾 Farmer</Text>
              </View>
            </View>
            <Text style={styles.farmerWelcome}>
              {userProfile?.fullName ? userProfile.fullName : 'Farmer Partner'} • 📍 {userProfile?.district?.nameEn || 'Nuwara Eliya'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
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
                {lang === 'en' ? 'සිං' : lang === 'si' ? 'தம' : 'EN'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>{t.actions.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* KPI DASHBOARD STATS */}
        <View style={styles.statsGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: THEME.emerald }]}>
            <Text style={styles.kpiIcon}>🌾</Text>
            <Text style={styles.kpiValue}>{displayListings.length}</Text>
            <Text style={styles.kpiLabel}>{t.stats.activeListings}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.navy }]}>
            <Text style={styles.kpiIcon}>💰</Text>
            <Text style={styles.kpiValue}>{t.currency} {totalSalesCalculated.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>{t.stats.totalRevenue}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.warning }]}>
            <Text style={styles.kpiIcon}>⏳</Text>
            <Text style={styles.kpiValue}>{pendingOrders.length}</Text>
            <Text style={styles.kpiLabel}>{t.stats.pendingOrders}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.info }]}>
            <Text style={styles.kpiIcon}>🚛</Text>
            <Text style={styles.kpiValue}>{inTransitOrders.length}</Text>
            <Text style={styles.kpiLabel}>{t.stats.dispatched}</Text>
          </View>
        </View>

        {/* PRIMARY ACTION BANNER: + ADD PRODUCE */}
        <TouchableOpacity
          style={styles.addListingBanner}
          activeOpacity={0.85}
          onPress={() => setShowAddProduceScreen(true)}
        >
          <View style={styles.addIconCircle}>
            <Text style={styles.addPlusText}>+</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.addBannerTitle}>{t.actions.addNewListing}</Text>
            <Text style={styles.addBannerSub}>Broadcast fresh harvest directly to verified buyers & islandwide transport</Text>
          </View>
          <Text style={styles.addBannerArrow}>➔</Text>
        </TouchableOpacity>

        {/* TAB SWITCHER: MY LISTINGS vs INCOMING ORDERS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'listings' && styles.tabBtnActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
              🌾 {t.tabs.myListings} ({displayListings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              📦 {t.tabs.incomingOrders} {pendingOrders.length > 0 ? `(${pendingOrders.length} New)` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================== */}
        {/* TAB CONTENT 1: MY HARVEST LISTINGS             */}
        {/* ============================================== */}
        {activeTab === 'listings' && (
          <View>
            {displayListings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🌾</Text>
                <Text style={styles.emptyTitle}>No harvest listings published yet</Text>
                <Text style={styles.emptySubtitle}>Tap the "+ Add New Harvest Listing" button above to publish your first crop.</Text>
              </View>
            ) : (
              displayListings.map((item) => (
                <View key={item.id} style={styles.listingCard}>
                  <Image source={{ uri: item.image || DEFAULT_IMAGE_BY_CAT[item.category] }} style={styles.produceThumb} />
                  <View style={styles.produceInfo}>
                    <View style={styles.badgeRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category || 'Vegetables'}</Text>
                      </View>
                      <Text style={styles.locationSmall}>📍 {item.location || 'Sri Lanka'}</Text>
                    </View>

                    <Text style={styles.produceNameText}>
                      {lang === 'si' ? item.nameSi || item.nameEn : item.nameEn}
                    </Text>

                    <Text style={styles.stockText}>
                      In Stock: <Text style={{ fontWeight: 'bold', color: THEME.textDark }}>{item.stockQty} {item.unitEn || 'kg'}</Text>
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceTag}>
                        {t.currency} {Number(item.price).toFixed(2)}
                        <Text style={styles.unitSub}> / {item.unitEn || 'kg'}</Text>
                      </Text>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteProduce(item)}
                      >
                        <Text style={styles.deleteBtnText}>✕ {t.actions.delete}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================== */}
        {/* TAB CONTENT 2: INCOMING ORDERS FROM BUYERS     */}
        {/* ============================================== */}
        {activeTab === 'orders' && (
          <View>
            {ordersList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>No buyer orders yet</Text>
                <Text style={styles.emptySubtitle}>When buyers place orders for your produce, they will appear here live with dispatch actions.</Text>
              </View>
            ) : (
              ordersList.map((order) => {
                const status = order.status || 'PENDING';
                const isPending = status === 'PENDING';
                const isAccepted = status === 'ACCEPTED';
                const isReady = status === 'READY_FOR_PICKUP';
                const isInTransit = status === 'IN_TRANSIT';
                const isDelivered = status === 'DELIVERED';

                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeaderRow}>
                      <View style={[
                        styles.orderStatusPill,
                        isPending && { backgroundColor: THEME.warningLight },
                        (isAccepted || isReady) && { backgroundColor: THEME.infoLight },
                        isInTransit && { backgroundColor: THEME.warningLight },
                        isDelivered && { backgroundColor: THEME.emeraldLight },
                      ]}>
                        <Text style={[
                          styles.orderStatusPillText,
                          isPending && { color: THEME.warning },
                          (isAccepted || isReady) && { color: THEME.info },
                          isInTransit && { color: THEME.warning },
                          isDelivered && { color: THEME.emerald },
                        ]}>
                          ● {status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text style={styles.orderDate}>
                        Order #{order.id ? order.id.slice(-5).toUpperCase() : 'GL-01'}
                      </Text>
                    </View>

                    <Text style={styles.orderItemName}>{order.produceName || 'Fresh Harvest Crop'}</Text>
                    
                    <View style={styles.orderMetaGrid}>
                      <View style={styles.orderMetaItem}>
                        <Text style={styles.metaLabel}>Quantity</Text>
                        <Text style={styles.metaValue}>{order.qty} {order.unit || 'kg'}</Text>
                      </View>
                      <View style={styles.orderMetaItem}>
                        <Text style={styles.metaLabel}>Total Value</Text>
                        <Text style={styles.metaValueHighlight}>
                          {t.currency} {Number(order.totalPrice || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.orderMetaItem}>
                        <Text style={styles.metaLabel}>Buyer</Text>
                        <Text style={styles.metaValue}>{order.buyerName || 'Buyer'}</Text>
                      </View>
                    </View>

                    {/* ACTION BUTTONS BASED ON CURRENT STATUS */}
                    <View style={styles.orderActionRow}>
                      {isPending && (
                        <TouchableOpacity
                          style={styles.btnPrimaryAction}
                          disabled={updatingOrderId === order.id}
                          onPress={() => handleUpdateOrderStatus(order.id, 'ACCEPTED')}
                        >
                          {updatingOrderId === order.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.btnPrimaryActionText}>✓ {t.actions.acceptOrder}</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {isAccepted && (
                        <TouchableOpacity
                          style={[styles.btnPrimaryAction, { backgroundColor: THEME.navy }]}
                          disabled={updatingOrderId === order.id}
                          onPress={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                        >
                          {updatingOrderId === order.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.btnPrimaryActionText}>📦 {t.actions.readyPickup}</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {isReady && (
                        <View style={styles.statusInfoBox}>
                          <Text style={styles.statusInfoText}>🚛 {t.actions.waitingDriver}</Text>
                        </View>
                      )}

                      {isInTransit && (
                        <View style={[styles.statusInfoBox, { backgroundColor: THEME.warningLight }]}>
                          <Text style={[styles.statusInfoText, { color: THEME.warning }]}>
                            🚚 {t.actions.inTransit}
                          </Text>
                        </View>
                      )}

                      {isDelivered && (
                        <View style={[styles.statusInfoBox, { backgroundColor: THEME.emeraldLight }]}>
                          <Text style={[styles.statusInfoText, { color: THEME.emerald }]}>
                            ✅ {t.actions.delivered}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
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
  farmerWelcome: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // KPI Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  kpiIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  kpiLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },

  // Banner
  addListingBanner: {
    backgroundColor: THEME.emerald,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
    shadowColor: THEME.emerald,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlusText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  addBannerArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
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

  // Listings Cards
  listingCard: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  produceThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  produceInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  categoryBadge: {
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: THEME.emeraldDark,
    fontSize: 10,
    fontWeight: '700',
  },
  locationSmall: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  produceNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginVertical: 2,
  },
  stockText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  unitSub: {
    fontSize: 11,
    fontWeight: 'normal',
    color: THEME.textMuted,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: THEME.dangerLight,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: THEME.danger,
    fontSize: 10,
    fontWeight: '700',
  },

  // Orders
  orderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  orderMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.bg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  orderMetaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  metaValueHighlight: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.emeraldDark,
  },
  orderActionRow: {
    flexDirection: 'row',
  },
  btnPrimaryAction: {
    flex: 1,
    backgroundColor: THEME.emerald,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusInfoBox: {
    flex: 1,
    backgroundColor: THEME.infoLight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusInfoText: {
    color: THEME.info,
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty State
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
  modalSheet: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.navy,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.textDark,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryPickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryPickerPillActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy,
  },
  categoryPickerPillText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  categoryPickerPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: THEME.emerald,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
