import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const CATEGORY_ICONS = {
  Vegetables: '🥦',
  Fruits: '🍎',
  'Rice & Grains': '🌾',
  Spices: '🌶️',
  'Other Produce': '📦',
};

/**
 * ProduceImage component
 * Renders an image safely from Firebase HTTPS URL, base64 data, or local file URI.
 * Falls back to a category-based icon placeholder on missing URI or image loading failure.
 */
export default function ProduceImage({
  uri,
  item,
  style,
  resizeMode = 'cover',
  iconSize = 32,
  placeholderText,
}) {
  const [hasError, setHasError] = useState(false);

  // Extract URI from prop 'uri' or 'item' properties
  const imageUri =
    uri ||
    item?.imageUrl ||
    item?.photoURL ||
    item?.image ||
    (Array.isArray(item?.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls[0] : null);

  const isValidUri =
    typeof imageUri === 'string' &&
    imageUri.trim().length > 0 &&
    (imageUri.startsWith('http://') ||
      imageUri.startsWith('https://') ||
      imageUri.startsWith('data:') ||
      imageUri.startsWith('file://'));

  if (isValidUri && !hasError) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={style}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
    );
  }

  const category = item?.category || 'Vegetables';
  const icon = CATEGORY_ICONS[category] || '🌱';

  return (
    <View style={[style, styles.placeholderContainer]}>
      <Text style={{ fontSize: iconSize }}>{icon}</Text>
      {placeholderText ? <Text style={styles.placeholderText}>{placeholderText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
});
