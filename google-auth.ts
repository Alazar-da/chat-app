import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export function initGoogleAuth() {
  if (Capacitor.getPlatform() === "web") {
    // Do NOT initialize on web
    return;
  }

  GoogleAuth.initialize({
    clientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    grantOfflineAccess: true,
  });
}
