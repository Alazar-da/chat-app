import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export function initGoogleAuth() {
  if (Capacitor.getPlatform() === "web") {
    // Do NOT initialize on web
    return;
  }

  GoogleAuth.initialize({
    clientId: "576182804983-g2ei66pm1qjdmppjlbq2i2gut6bddn1l.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    grantOfflineAccess: true,
  });
}
