import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'chat-app',
  webDir: 'public',
    server: {
    url: "https://chat-app-blond-pi.vercel.app/", // 👈 Android emulator loads from your Next.js dev server
    cleartext: true
  }
};

export default config;
