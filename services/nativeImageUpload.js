import { fetch as expoFetch } from 'expo/fetch';
import { ref, getDownloadURL } from 'firebase/storage';

// Firebase's JS multipart builder uses new Blob([Uint8Array]), which React
// Native's Blob does not support. Expo fetch can send those bytes directly.
export const uploadNativeImage = async (storage, auth, dataUrl, storagePath) => {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error('Could not read the selected photo as image data.');
  const [, contentType, base64] = match;
  const binary = atob(base64);
  const imageBytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const storageRef = ref(storage, storagePath);
  const boundary = `govilink_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encoder = new TextEncoder();
  const prefix = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n` +
    JSON.stringify({ name: storagePath, contentType }) +
    `\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const suffix = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(prefix.length + imageBytes.length + suffix.length);
  body.set(prefix);
  body.set(imageBytes, prefix.length);
  body.set(suffix, prefix.length + imageBytes.length);
  const headers = {
    'Content-Type': `multipart/related; boundary=${boundary}`,
    'X-Goog-Upload-Protocol': 'multipart',
  };
  if (auth.currentUser) {
    headers.Authorization = `Firebase ${await auth.currentUser.getIdToken()}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await expoFetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(storageRef.bucket)}/o?name=${encodeURIComponent(storagePath)}`,
      { method: 'POST', headers, body, signal: controller.signal }
    );
    if (!response.ok) {
      const details = await response.json().catch(() => null);
      throw new Error(`Photo hosting failed (${response.status}): ${details?.error?.message || 'Please check Firebase Storage access and configuration.'}`);
    }
    return await getDownloadURL(storageRef);
  } finally {
    clearTimeout(timeout);
  }
};
