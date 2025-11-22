import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export function initGoogleAuth() {
  // Web only – do not run on Android/iOS
  if (Capacitor.isNativePlatform()) return;

  GoogleAuth.initialize({
    clientId: 'CLIENT_ID.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}
