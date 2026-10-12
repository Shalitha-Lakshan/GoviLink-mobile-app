import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const FARMER_COLORS = {
  ink: '#16352D', green: '#167458', greenDark: '#0D503D', mint: '#E8F3EC',
  canvas: '#F5F7F2', white: '#FFFFFF', muted: '#718078', border: '#E0E7DF',
  amber: '#956016', amberBg: '#FFF4DC', blue: '#326A8D', blueBg: '#EAF3F9',
  red: '#B44343', redBg: '#FCEEEE',
};

export const FARMER_NAV = {
  en: { home: 'Overview', listings: 'Harvest', orders: 'Requests', accepted: 'Orders', profile: 'Profile', add: 'Add harvest', search: 'Search', all: 'All', active: 'Active', completed: 'Completed', available: 'In stock', empty: 'No results found', reset: 'Clear filters' },
  si: { home: 'සාරාංශය', listings: 'අස්වැන්න', orders: 'ඉල්ලීම්', accepted: 'ඇණවුම්', profile: 'ගිණුම', add: 'අස්වැන්න එක් කරන්න', search: 'සොයන්න', all: 'සියල්ල', active: 'සක්‍රිය', completed: 'සම්පූර්ණයි', available: 'තොග ඇත', empty: 'ප්‍රතිඵල නොමැත', reset: 'පෙරහන් ඉවත් කරන්න' },
  ta: { home: 'சுருக்கம்', listings: 'விளைச்சல்', orders: 'கோரிக்கைகள்', accepted: 'ஆர்டர்கள்', profile: 'சுயவிவரம்', add: 'விளைச்சல் சேர்', search: 'தேடுக', all: 'அனைத்தும்', active: 'செயலில்', completed: 'முடிந்தவை', available: 'இருப்பில்', empty: 'முடிவுகள் இல்லை', reset: 'வடிகட்டிகளை நீக்கு' },
};

export const cleanLabel = (text = '') => text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/^\+\s*/, '').trim();

export function FarmerButton({ label, icon, onPress, secondary, danger, loading, disabled, style }) {
  const inactive = disabled || loading;
  const color = danger ? FARMER_COLORS.red : secondary ? FARMER_COLORS.greenDark : '#FFFFFF';
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive} onPress={onPress} activeOpacity={0.75}
      style={[ui.button, secondary && ui.secondary, danger && ui.danger, inactive && { opacity: 0.55 }, style]}>
      {loading ? <ActivityIndicator color={color} size="small" /> : <>
        {icon && <Ionicons name={icon} size={18} color={color} />}
        <Text style={[ui.buttonText, { color }]}>{label}</Text>
      </>}
    </TouchableOpacity>
  );
}

export function IconTile({ name, color = FARMER_COLORS.green, background = FARMER_COLORS.mint }) {
  return <View style={[ui.iconTile, { backgroundColor: background }]}><Ionicons name={name} size={22} color={color} /></View>;
}

export function FarmerHeading({ eyebrow, title, subtitle }) {
  return <View style={ui.heading}>
    {eyebrow && <Text style={ui.eyebrow}>{eyebrow}</Text>}
    <Text accessibilityRole="header" style={ui.title}>{title}</Text>
    {subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}
  </View>;
}

export function FarmerEmpty({ icon = 'leaf-outline', title, subtitle, action, onAction }) {
  return <View style={ui.empty}>
    <IconTile name={icon} />
    <Text style={ui.emptyTitle}>{title}</Text>
    <Text style={ui.subtitle}>{subtitle}</Text>
    {action && <FarmerButton label={action} onPress={onAction} secondary style={{ marginTop: 10 }} />}
  </View>;
}

export function DetailRow({ icon, label, value }) {
  return <View style={ui.detail}>
    <Ionicons name={icon} size={17} color={FARMER_COLORS.muted} />
    <View style={{ flex: 1 }}><Text style={ui.detailLabel}>{label}</Text><Text style={ui.detailValue}>{value}</Text></View>
  </View>;
}

export function FilterChip({ label, selected, onPress }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} aria-pressed={selected} onPress={onPress}
    style={[ui.chip, selected && ui.chipActive]}>
    <Text style={[ui.chipText, selected && { color: FARMER_COLORS.white }]}>{label}</Text>
  </TouchableOpacity>;
}

const ui = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: FARMER_COLORS.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  secondary: { backgroundColor: FARMER_COLORS.mint }, danger: { backgroundColor: FARMER_COLORS.redBg },
  iconTile: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  heading: { marginBottom: 24 }, eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.8, color: FARMER_COLORS.green, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, color: FARMER_COLORS.ink },
  subtitle: { fontSize: 14, lineHeight: 21, color: FARMER_COLORS.muted, marginTop: 7 },
  empty: { alignItems: 'center', padding: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: FARMER_COLORS.border, borderRadius: 22, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: FARMER_COLORS.ink, textAlign: 'center', marginTop: 8 },
  detail: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 7 },
  detailLabel: { fontSize: 11, color: FARMER_COLORS.muted, marginBottom: 3 },
  detailValue: { fontSize: 13, lineHeight: 19, color: FARMER_COLORS.ink, fontWeight: '500' },
  chip: { paddingHorizontal: 16, minHeight: 42, paddingVertical: 11, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: FARMER_COLORS.border },
  chipActive: { backgroundColor: FARMER_COLORS.greenDark, borderColor: FARMER_COLORS.greenDark },
  chipText: { fontSize: 12, fontWeight: '600', color: FARMER_COLORS.muted },
});
