import React from 'react';
import { Image } from 'react-native';

// The supplied artwork includes both the symbol and the GoviLink wordmark.
export default function AppLogo({ width = 84, style }) {
  return (
    <Image
      source={require('../assets/logo.png')}
      resizeMode="contain"
      accessibilityLabel="GoviLink logo"
      style={[{ width, height: width * (387 / 569), flexShrink: 0 }, style]}
    />
  );
}
