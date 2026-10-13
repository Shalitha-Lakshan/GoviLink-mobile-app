import { Platform, Alert } from 'react-native';

/**
 * Polyfill Alert.alert for React Native Web.
 * By default, react-native-web has an empty stub for Alert.alert.
 * This ensures alerts and confirmations function properly on web.
 */
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');

    if (buttons && buttons.length > 1) {
      const confirmed = typeof window !== 'undefined' && window.confirm ? window.confirm(text) : true;
      if (confirmed) {
        const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
        if (confirmBtn && typeof confirmBtn.onPress === 'function') {
          confirmBtn.onPress();
        }
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        if (cancelBtn && typeof cancelBtn.onPress === 'function') {
          cancelBtn.onPress();
        }
      }
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(text);
      }
      if (buttons && buttons[0] && typeof buttons[0].onPress === 'function') {
        buttons[0].onPress();
      }
    }
  };
}
