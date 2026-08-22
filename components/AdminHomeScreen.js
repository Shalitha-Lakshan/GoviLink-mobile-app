import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
  navy: '#0B2545',
  emerald: '#16A34A',
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

export default function AdminHomeScreen({
  userProfile,
  lang = 'en',
  onLogout,
  produceListings = [],
  ordersList = [],
  onChangeLanguage,
}) {
  const pendingOrders = ordersList.filter((o) => o.status === 'PENDING' || !o.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.navy} />

      {/* TOP HEADER */}
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
                <Text style={styles.roleTagText}>🏢 Cooperative Admin</Text>
              </View>
            </View>
            <Text style={styles.adminWelcome}>
              {userProfile?.fullName || 'Co-op Dispatch Center'} • Sri Lanka Agro Federation
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
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

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* KPI STATS */}
        <View style={styles.statsGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: THEME.warning }]}>
            <Text style={styles.kpiIcon}>⏳</Text>
            <Text style={styles.kpiValue}>{pendingOrders.length}</Text>
            <Text style={styles.kpiLabel}>Pending Transports</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.emerald }]}>
            <Text style={styles.kpiIcon}>🚛</Text>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Active Co-op Lorries</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.navy }]}>
            <Text style={styles.kpiIcon}>🌾</Text>
            <Text style={styles.kpiValue}>{produceListings.length}</Text>
            <Text style={styles.kpiLabel}>Produce Catalogs</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: THEME.info }]}>
            <Text style={styles.kpiIcon}>📦</Text>
            <Text style={styles.kpiValue}>{ordersList.length}</Text>
            <Text style={styles.kpiLabel}>Total Orders Synced</Text>
          </View>
        </View>

        {/* LOGISTICS DISPATCH CARD */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>🚚 Logistics Fleet Dispatch</Text>
          <Text style={styles.actionSub}>
            Coordinate harvest pickups from rural farming clusters (Nuwara Eliya, Dambulla, Polonnaruwa) and assign available drivers to national distribution hubs.
          </Text>

          <TouchableOpacity
            style={styles.dispatchBtn}
            onPress={() => Alert.alert('Fleet Dispatch', 'Automated routing algorithm has balanced available co-op transport vehicles.')}
          >
            <Text style={styles.dispatchBtnText}>Auto-Assign Nearest Available Lorries</Text>
          </TouchableOpacity>
        </View>

        {/* REAL-TIME AUDIT LOG */}
        <Text style={styles.sectionTitle}>Real-time Agricultural Marketplace Flow</Text>
        {ordersList.slice(0, 5).map((order) => (
          <View key={order.id} style={styles.auditCard}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditCrop}>{order.produceName || 'Produce Order'}</Text>
              <Text style={styles.auditStatus}>Status: {order.status || 'PENDING'}</Text>
            </View>
            <Text style={styles.auditSub}>
              Buyer: {order.buyerName || 'Buyer'} ➔ Farmer: {order.farmerName || 'Farmer'}
            </Text>
            <Text style={styles.auditPrice}>
              Order Value: Rs. {Number(order.totalPrice || 0).toFixed(2)} ({order.qty} {order.unit || 'kg'})
            </Text>
          </View>
        ))}
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
    backgroundColor: THEME.warning,
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
  adminWelcome: {
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

  actionCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
    color: THEME.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  dispatchBtn: {
    backgroundColor: THEME.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 10,
  },
  auditCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditCrop: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  auditStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.info,
  },
  auditSub: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  auditPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.emerald,
  },
});
