import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UserProfileScreen from './UserProfileScreen';
import { VALID_DELIVERY_TRANSITIONS } from '../services/firebaseDatabase';
import { FARMER_COLORS as C, FARMER_NAV, FarmerButton, FarmerEmpty, FarmerHeading, FilterChip, IconTile, DetailRow, cleanLabel } from './FarmerDesign';

const NAV_ICONS = { home: 'grid-outline', listings: 'leaf-outline', orders: 'chatbubbles-outline', accepted: 'cube-outline' };
const STATUS = {
  PENDING: ['Awaiting acceptance', C.amber, C.amberBg], ACCEPTED: ['Accepted', C.blue, C.blueBg],
  ASSIGNED: ['Driver assigned', C.blue, C.blueBg], PREPARING: ['Preparing', C.amber, C.amberBg],
  READY_FOR_PICKUP: ['Ready for pickup', C.amber, C.amberBg], IN_TRANSIT: ['In transit', C.blue, C.blueBg],
  DELIVERED: ['Completed', C.green, C.mint], CANCELLED: ['Cancelled', C.red, C.redBg],
};
const cropName = (item, lang) => (lang === 'si' ? item.nameSi : lang === 'ta' ? item.nameTa : item.nameEn) || item.nameEn || 'Harvest';
const money = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function SectionLabel({ title, action, onPress }) {
  return <View style={s.sectionLabel}><Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>
    {action && <TouchableOpacity onPress={onPress} accessibilityRole="button" style={s.textAction}><Text style={s.textActionText}>{action}</Text><Ionicons name="arrow-forward" size={16} color={C.green} /></TouchableOpacity>}
  </View>;
}

export default function FarmerWorkspace({ userProfile, lang, t, activeTab, setActiveTab, listings, requests, orders,
  onAdd, onEdit, onDelete, onProvide, onUpdateStatus, onDelivered, onTrack, onLogout, onChangeLanguage, onProfileUpdated,
  providingRequestId, updatingOrderId, produceToDelete, isDeletingProduce, onCancelDelete, onConfirmDelete }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => { setSearch(''); setFilter('all'); }, [activeTab]);
  const nav = FARMER_NAV[lang] || FARMER_NAV.en;
  const district = typeof userProfile?.district === 'string' ? userProfile.district : userProfile?.district?.nameEn;
  const switchTab = (tab) => { setSearch(''); setFilter('all'); setActiveTab(tab); };
  const query = search.trim().toLowerCase();
  const matches = (...values) => values.some(value => String(value || '').toLowerCase().includes(query));
  const visibleListings = listings.filter(item => matches(cropName(item, lang), item.category, item.location) && (filter !== 'stock' || Number(item.stockQty) > 0));
  const visibleRequests = requests.filter(req => matches(req.cropName, req.targetDistrictName, req.targetDistrictEn, req.buyerName));
  const visibleOrders = orders.filter(order => matches(order.produceName, order.buyerName, order.id) &&
    (filter === 'all' || (filter === 'completed' ? order.status === 'DELIVERED' : !['DELIVERED', 'CANCELLED'].includes(order.status))));
  const activeOrders = orders.filter(order => !['DELIVERED', 'CANCELLED'].includes(order.status));
  const sales = orders.filter(order => order.status !== 'CANCELLED').reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const addButton = <FarmerButton label={nav.add} icon="add" onPress={onAdd} />;
  const resetFilters = () => { setSearch(''); setFilter('all'); };
  const noResults = <FarmerEmpty icon="search-outline" title={nav.empty} subtitle="Try a different name or adjust your filters." action={nav.reset} onAction={resetFilters} />;

  const renderListing = (item) => <View key={item.id} style={s.card}>
    <View style={s.listingTop}>
      {item.image ? <Image source={{ uri: item.image }} style={s.produceImage} /> : <View style={[s.produceImage, s.imageFallback]}><Ionicons name="leaf-outline" size={32} color={C.green} /></View>}
      <View style={s.flex}>
        <View style={s.badgeRow}><Text style={s.category}>{item.category || 'Produce'}</Text></View>
        <Text style={s.cardTitle}>{cropName(item, lang)}</Text>
        <View style={s.locationRow}><Ionicons name="location-outline" size={13} color={C.muted} /><Text style={s.smallText}>{item.location || district || 'Sri Lanka'}</Text></View>
        <Text style={s.price}>{t.currency} {money(item.price)} <Text style={s.unit}>/ {item.unitEn || 'kg'}</Text></Text>
      </View>
    </View>
    {Boolean(item.description) && <Text style={s.description} numberOfLines={2}>{item.description}</Text>}
    <View style={s.cardFooter}>
      <View style={s.stock}><View style={[s.dot, { backgroundColor: Number(item.stockQty) > 0 ? C.green : C.amber }]} /><Text style={s.stockText}>{item.stockQty || 0} {item.unitEn || 'kg'} available</Text></View>
      <View style={s.inlineActions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t.actions.edit} ${cropName(item, lang)}`} onPress={() => onEdit(item)} style={s.editAction}><Ionicons name="create-outline" size={17} color={C.greenDark} /><Text style={s.editText}>{t.actions.edit}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t.actions.delete} ${cropName(item, lang)}`} onPress={() => onDelete(item)} style={s.deleteAction}><Ionicons name="trash-outline" size={18} color={C.red} /></TouchableOpacity>
      </View>
    </View>
  </View>;

  const renderRequest = (req) => <View key={req.id} style={s.card}>
    <View style={s.cardHeading}><IconTile name="leaf-outline" /><View style={s.flex}><Text style={s.cardTitle}>{req.cropName}</Text><Text style={s.smallText}>{req.category || 'Produce'}</Text></View><View style={s.openBadge}><Text style={s.openBadgeText}>Open</Text></View></View>
    <View style={s.requestMetrics}><View style={s.flex}><Text style={s.metricCaption}>Requested quantity</Text><Text style={s.metricValue}>{req.quantity} <Text style={s.unit}>{req.unit || 'kg'}</Text></Text></View>
      {!!req.targetPricePerUnit && <View style={s.flex}><Text style={s.metricCaption}>Budget per {req.unit || 'kg'}</Text><Text style={s.metricValue}>{t.currency} {money(req.targetPricePerUnit)}</Text></View>}
    </View>
    <DetailRow icon="location-outline" label={cleanLabel(t.customRequests.targetDistrict)} value={`${req.targetDistrictName || req.targetDistrictEn || 'Island-wide'}${req.specificArea ? ` · ${req.specificArea}` : ''}`} />
    <DetailRow icon="calendar-outline" label={cleanLabel(t.customRequests.datePeriod)} value={req.datePeriodDescription || [req.requiredDateStart, req.requiredDateEnd].filter(Boolean).join(' – ') || 'Contact buyer for dates'} />
    <DetailRow icon="car-outline" label={cleanLabel(t.customRequests.delivery)} value={req.deliveryNeeded === false ? cleanLabel(t.customRequests.selfPickup) : req.deliveryAddress || 'Delivery requested'} />
    {!!req.qualityGrade && <DetailRow icon="ribbon-outline" label="Quality grade" value={req.qualityGrade} />}
    {!!req.notes && <View style={s.note}><Text style={s.noteText}>{req.notes}</Text></View>}
    <View style={s.buyerRow}><View style={s.avatarSmall}><Ionicons name="person-outline" size={17} color={C.green} /></View><View style={s.flex}><Text style={s.buyerName}>{req.buyerName || 'Buyer'}</Text>{!!req.buyerPhone && <Text style={s.smallText}>{req.buyerPhone}</Text>}</View></View>
    <FarmerButton label={cleanLabel(t.customRequests.provideBtn)} icon="checkmark-outline" loading={providingRequestId === req.id} onPress={() => onProvide(req)} />
  </View>;

  const renderOrder = (order) => {
    const status = order.status || 'PENDING';
    const [statusLabel, color, backgroundColor] = STATUS[status] || [status.replace(/_/g, ' '), C.muted, C.canvas];
    const complete = status === 'DELIVERED';
    const cancelled = status === 'CANCELLED';
    const steps = ['ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'];
    const stepIndex = steps.indexOf(status);
    const busy = updatingOrderId === order.id;
    return <View key={order.id} style={s.card}>
      <View style={s.orderTop}><View style={[s.statusBadge, { backgroundColor }]}><View style={[s.dot, { backgroundColor: color }]} /><Text style={[s.statusText, { color }]}>{statusLabel}</Text></View><Text style={s.orderId}>#{String(order.id || '').slice(-6).toUpperCase()}</Text></View>
      <Text style={s.cardTitle}>{order.produceName || 'Harvest order'}</Text>
      <View style={s.requestMetrics}><View style={s.flex}><Text style={s.metricCaption}>Quantity</Text><Text style={s.metricValue}>{order.qty} <Text style={s.unit}>{order.unit || 'kg'}</Text></Text></View><View style={s.flex}><Text style={s.metricCaption}>Order value</Text><Text style={s.metricValue}>{t.currency} {money(order.totalPrice)}</Text></View></View>
      {!cancelled && <View style={s.progressRow}>{['Accepted', 'Packed', 'On the way', 'Delivered'].map((label, index) => <View key={label} style={s.progressStep}><View style={[s.progressLine, index <= stepIndex && { backgroundColor: C.green }]} /><Text style={[s.progressText, index <= stepIndex && { color: C.greenDark }]}>{label}</Text></View>)}</View>}
      <DetailRow icon="person-outline" label="Buyer" value={[order.buyerName || 'Buyer', order.buyerPhone].filter(Boolean).join(' · ')} />
      <DetailRow icon={order.deliveryNeeded === false ? 'storefront-outline' : 'location-outline'} label="Delivery" value={order.deliveryNeeded === false ? 'Buyer pickup from farm' : order.deliveryAddress || 'Contact buyer for delivery location'} />
      {!!order.notes && <View style={s.note}><Text style={s.noteText}>{order.notes}</Text></View>}
      <View style={s.orderActions}>
        {!cancelled && <FarmerButton label="View delivery" icon="car-outline" secondary onPress={() => onTrack(order)} />}
        {status === 'PENDING' && <FarmerButton label={cleanLabel(t.actions.acceptOrder)} loading={busy} onPress={() => onUpdateStatus(order.id, 'ACCEPTED')} />}
        {status !== 'PENDING' && VALID_DELIVERY_TRANSITIONS[status]?.includes('READY_FOR_PICKUP') && <FarmerButton label="Ready for pickup" icon="cube-outline" loading={busy} onPress={() => onUpdateStatus(order.id, 'READY_FOR_PICKUP')} />}
        {!complete && !cancelled && VALID_DELIVERY_TRANSITIONS[status]?.includes('DELIVERED') && <FarmerButton label={cleanLabel(t.acceptedOrders.confirmDeliveryBtn)} loading={busy} onPress={() => onDelivered(order)} />}
      </View>
    </View>;
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
    <View style={s.header}><View style={s.brand}><View style={s.brandMark}><Ionicons name="leaf" size={22} color="#FFFFFF" /></View><View><Text style={s.brandName}>Govi<Text style={{ color: C.green }}>Link</Text></Text><Text style={s.brandCaption}>FARMER WORKSPACE</Text></View></View>
      <View style={s.headerActions}>{onChangeLanguage && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change language" onPress={() => onChangeLanguage(lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en')} style={s.language}><Text style={s.languageText}>{lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'தம'}</Text></TouchableOpacity>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={nav.profile} onPress={() => switchTab('profile')} style={s.avatarButton}>{userProfile?.photoURL ? <Image source={{ uri: userProfile.photoURL }} style={s.avatarImage} /> : <Text style={s.avatarInitial}>{(userProfile?.fullName || 'F').charAt(0).toUpperCase()}</Text>}</TouchableOpacity>
      </View>
    </View>

    {activeTab === 'profile' ? <UserProfileScreen embedded farmerDesign userProfile={userProfile} lang={lang} onBack={() => switchTab('home')} onLogout={onLogout} onChangeLanguage={onChangeLanguage} onProfileUpdated={onProfileUpdated} /> :
      <ScrollView key={activeTab} style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === 'home' ? <>
          <FarmerHeading eyebrow="YOUR FARM, AT A GLANCE" title={`Hello, ${userProfile?.fullName?.split(' ')[0] || 'farmer'}.`} subtitle="A fresh day to grow your business." />
          <View style={s.hero}><View style={s.heroTop}><View style={s.heroPill}><Ionicons name="location-outline" size={13} color="#D1E9D9" /><Text style={s.heroEyebrow}>{district || 'Sri Lanka'}</Text></View><Ionicons name="leaf-outline" size={42} color="#82AE92" /></View><Text style={s.heroTitle}>Good harvests deserve{ '\n' }great connections.</Text><Text style={s.heroSub}>Share your produce. Connect with buyers.{ '\n' }Keep every order moving.</Text><FarmerButton label={nav.add} icon="add" onPress={onAdd} style={s.heroButton} /></View>
          <View style={s.statsGrid}>{[
            [nav.listings, listings.length, 'leaf-outline', 'listings'],
            [nav.orders, requests.length, 'chatbubbles-outline', 'orders'],
            ['Active orders', activeOrders.length, 'cube-outline', 'accepted'],
            [cleanLabel(t.stats.totalRevenue), `${t.currency} ${money(sales)}`, 'wallet-outline', 'accepted'],
          ].map(([label, value, icon, tab]) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={() => switchTab(tab)} style={s.statCard}><Ionicons name={icon} size={20} color={C.green} /><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></TouchableOpacity>)}</View>
          <SectionLabel title="Your next steps" />
          <View style={s.quickCard}>{[
            ['chatbubbles-outline', 'Explore buyer requests', `${requests.length} open requests to explore`, 'orders'],
            ['cube-outline', 'Manage your orders', `${activeOrders.length} orders in progress`, 'accepted'],
            ['person-outline', 'Keep your profile up to date', 'Help buyers get to know your farm', 'profile'],
          ].map(([icon, title, subtitle, tab], index) => <TouchableOpacity key={tab} accessibilityRole="button" onPress={() => switchTab(tab)} style={[s.quickRow, index > 0 && s.quickBorder]}><IconTile name={icon} /><View style={s.flex}><Text style={s.quickTitle}>{title}</Text><Text style={s.smallText}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted} /></TouchableOpacity>)}</View>
        </> : <>
          <FarmerHeading eyebrow="FARMER WORKSPACE" title={activeTab === 'listings' ? cleanLabel(t.tabs.myListings) : activeTab === 'orders' ? cleanLabel(t.tabs.incomingOrders) : cleanLabel(t.tabs.acceptedOrders)} subtitle={activeTab === 'listings' ? 'Keep your harvest fresh, visible and ready to sell.' : activeTab === 'orders' ? t.customRequests.sectionSub : t.acceptedOrders.sectionSub} />
          {activeTab === 'listings' && <View style={s.addRow}>{addButton}</View>}
          <View style={s.searchBox}><Ionicons name="search-outline" size={20} color={C.muted} /><TextInput accessibilityLabel={`${nav.search} ${nav[activeTab]}`} value={search} onChangeText={setSearch} placeholder={`${nav.search} ${nav[activeTab].toLowerCase()}...`} placeholderTextColor={C.muted} style={s.searchInput} />{!!search && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={s.clearSearch}><Ionicons name="close-circle" size={20} color={C.muted} /></TouchableOpacity>}</View>
          {activeTab !== 'orders' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{(activeTab === 'listings' ? [['all', nav.all], ['stock', nav.available]] : [['all', nav.all], ['active', nav.active], ['completed', nav.completed]]).map(([key, label]) => <FilterChip key={key} label={label} selected={filter === key} onPress={() => setFilter(key)} />)}</ScrollView>}
          <Text style={s.resultCount}>{nav[activeTab]} · {(activeTab === 'listings' ? visibleListings : activeTab === 'orders' ? visibleRequests : visibleOrders).length}</Text>
          {activeTab === 'listings' && (visibleListings.length ? visibleListings.map(renderListing) : listings.length ? noResults : <FarmerEmpty title="No harvest listings yet" subtitle="Your available crops will appear here once you add a harvest." action={nav.add} onAction={onAdd} />)}
          {activeTab === 'orders' && (visibleRequests.length ? visibleRequests.map(renderRequest) : requests.length ? noResults : <FarmerEmpty icon="chatbubbles-outline" title="You're all caught up" subtitle={t.customRequests.noInquiries} />)}
          {activeTab === 'accepted' && (visibleOrders.length ? visibleOrders.map(renderOrder) : orders.length ? noResults : <FarmerEmpty icon="cube-outline" title={t.acceptedOrders.emptyTitle} subtitle={t.acceptedOrders.emptySub} action={nav.orders} onAction={() => switchTab('orders')} />)}
        </>}
      </ScrollView>}

    <SafeAreaView edges={['bottom']} style={s.navSafe}><View role="tablist" style={s.nav}>{Object.keys(NAV_ICONS).map(key => {
      const selected = key === activeTab;
      const count = key === 'orders' ? requests.length : 0;
      return <TouchableOpacity key={key} accessibilityRole="tab" accessibilityLabel={nav[key]} accessibilityState={{ selected }} aria-selected={selected} onPress={() => switchTab(key)} style={s.navItem}>
        <View style={[s.navIcon, selected && s.navIconActive]}><Ionicons name={NAV_ICONS[key]} size={22} color={selected ? C.greenDark : C.muted} />{count > 0 && <View style={s.navBadge}><Text style={s.navBadgeText}>{count > 9 ? '9+' : count}</Text></View>}</View><Text numberOfLines={2} style={[s.navLabel, selected && s.navLabelActive]}>{nav[key]}</Text>
      </TouchableOpacity>;
    })}</View></SafeAreaView>

    <Modal visible={!!produceToDelete} transparent animationType="fade" onRequestClose={() => !isDeletingProduce && onCancelDelete()}>
      <View style={s.modalOverlay}><View style={s.modalCard}><IconTile name="trash-outline" color={C.red} background={C.redBg} /><Text style={s.modalTitle}>Delete this harvest?</Text><Text style={s.modalText}>“{produceToDelete?.nameEn || 'This listing'}” will be removed from the marketplace.</Text><View style={s.modalActions}><FarmerButton label="Cancel" secondary disabled={isDeletingProduce} onPress={onCancelDelete} style={s.flex} /><FarmerButton label={t.actions.delete} danger loading={isDeletingProduce} onPress={onConfirmDelete} style={s.flex} /></View></View></View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas }, flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }, brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenDark, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.6 }, brandCaption: { fontSize: 8, fontWeight: '700', color: C.muted, letterSpacing: 1.3, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, language: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, languageText: { fontSize: 12, fontWeight: '700', color: C.muted },
  avatarButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E1EBDD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, avatarImage: { width: '100%', height: '100%' }, avatarInitial: { fontSize: 17, fontWeight: '700', color: C.greenDark },
  scroll: { flex: 1 }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 26, paddingBottom: 28 },
  hero: { backgroundColor: C.greenDark, borderRadius: 24, padding: 24, marginBottom: 20 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#487B65', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }, heroEyebrow: { fontSize: 11, color: '#D1E9D9' }, heroTitle: { fontSize: 27, lineHeight: 34, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.6 }, heroSub: { fontSize: 13, lineHeight: 21, color: '#C1D9CC', marginTop: 12, marginBottom: 20 }, heroButton: { backgroundColor: '#2A9068', alignSelf: 'flex-start', minWidth: 155 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 }, statCard: { flexBasis: '46%', flexGrow: 1, padding: 18, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border }, statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: C.ink, marginTop: 14 }, statLabel: { fontSize: 12, color: C.muted, marginTop: 5 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }, sectionTitle: { fontSize: 18, fontWeight: '700', color: C.ink, flexShrink: 1 }, textAction: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 }, textActionText: { fontSize: 12, fontWeight: '600', color: C.green },
  quickCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 16, marginBottom: 24 }, quickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, gap: 12 }, quickBorder: { borderTopWidth: 1, borderTopColor: C.border }, quickTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 4 },
  card: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, marginBottom: 16 }, listingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 }, produceImage: { width: 90, height: 106, borderRadius: 15, backgroundColor: C.mint }, imageFallback: { justifyContent: 'center', alignItems: 'center' }, badgeRow: { flexDirection: 'row', marginBottom: 8 }, category: { fontSize: 10, fontWeight: '700', color: C.green, backgroundColor: C.mint, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 }, cardTitle: { fontSize: 18, fontWeight: '700', color: C.ink, lineHeight: 24 }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }, smallText: { fontSize: 12, lineHeight: 18, color: C.muted, flexShrink: 1 }, price: { fontSize: 18, fontWeight: '800', color: C.greenDark, marginTop: 10 }, unit: { fontSize: 12, fontWeight: '500', color: C.muted }, description: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 12 }, cardFooter: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 16, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, stock: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 6, height: 6, borderRadius: 3 }, stockText: { fontSize: 11, color: C.muted }, inlineActions: { flexDirection: 'row', alignItems: 'center', gap: 6 }, editAction: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 10, backgroundColor: C.mint, borderRadius: 11 }, editText: { fontSize: 12, fontWeight: '700', color: C.greenDark }, deleteAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }, openBadge: { paddingHorizontal: 9, paddingVertical: 5, backgroundColor: C.amberBg, borderRadius: 7 }, openBadgeText: { fontSize: 10, fontWeight: '700', color: C.amber }, requestMetrics: { flexDirection: 'row', gap: 12, backgroundColor: C.canvas, padding: 14, borderRadius: 14, marginTop: 14, marginBottom: 12 }, metricCaption: { fontSize: 11, color: C.muted, marginBottom: 6 }, metricValue: { fontSize: 18, fontWeight: '700', color: C.ink }, note: { backgroundColor: C.canvas, borderLeftWidth: 3, borderLeftColor: C.border, padding: 12, borderRadius: 8, marginTop: 10 }, noteText: { fontSize: 12, lineHeight: 19, color: C.muted }, buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14, marginTop: 14, marginBottom: 16 }, avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }, buyerName: { fontSize: 13, fontWeight: '600', color: C.ink },
  orderTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 15 }, statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, statusText: { fontSize: 11, fontWeight: '600' }, orderId: { fontSize: 11, color: C.muted }, progressRow: { flexDirection: 'row', gap: 5, marginTop: 4, marginBottom: 13 }, progressStep: { flex: 1 }, progressLine: { height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 7 }, progressText: { fontSize: 9, color: C.muted }, orderActions: { gap: 8, marginTop: 16 },
  addRow: { marginBottom: 18 }, searchBox: { minHeight: 52, paddingLeft: 15, paddingRight: 5, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 15, backgroundColor: '#FFFFFF', marginBottom: 14 }, searchInput: { flex: 1, minWidth: 0, minHeight: 50, fontSize: 14, color: C.ink, paddingVertical: 10 }, clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, filters: { gap: 8, paddingBottom: 4 }, resultCount: { fontSize: 12, color: C.muted, marginTop: 14, marginBottom: 14 },
  navSafe: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: C.border }, nav: { flexDirection: 'row', width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 8, paddingTop: 9, paddingBottom: 7 }, navItem: { flex: 1, minHeight: 58, alignItems: 'center', gap: 4 }, navIcon: { width: 48, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, navIconActive: { backgroundColor: C.mint }, navLabel: { width: '100%', fontSize: 10, lineHeight: 14, color: C.muted, textAlign: 'center', paddingHorizontal: 2, flexShrink: 1 }, navLabelActive: { color: C.greenDark, fontWeight: '700' }, navBadge: { position: 'absolute', top: -3, right: 2, minWidth: 15, height: 15, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: C.green }, navBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(12,35,26,0.5)', padding: 24, alignItems: 'center', justifyContent: 'center' }, modalCard: { width: '100%', maxWidth: 380, padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center' }, modalTitle: { fontSize: 21, fontWeight: '700', color: C.ink, marginTop: 18 }, modalText: { fontSize: 14, lineHeight: 22, color: C.muted, textAlign: 'center', marginTop: 10, marginBottom: 24 }, modalActions: { flexDirection: 'row', gap: 10 },
});
