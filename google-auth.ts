import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export function initGoogleAuth() {
  if (Capacitor.getPlatform() === "web") {
    // Do NOT initialize on web
    return;
  }

  GoogleAuth.initialize({
    clientId: "576182804983-8vdsir74pstcvd4leifn2s76b43b0sr9.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    grantOfflineAccess: true,
  });
}
