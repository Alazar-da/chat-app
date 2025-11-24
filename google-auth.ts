import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export function initGoogleAuth() {
  if (Capacitor.getPlatform() === "web") {
    // Do NOT initialize on web
    return;
  }

  GoogleAuth.initialize({
    clientId: "576182804983-tn4sariou6g144584e79aaglbk6lbabp.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    grantOfflineAccess: true,
  });
}
