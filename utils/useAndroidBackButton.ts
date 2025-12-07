import { useEffect } from "react";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";

export default function useAndroidBackButton(onBack: () => void) {
  useEffect(() => {
    let handler: PluginListenerHandle | null = null;

    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        // User can go back inside a webview
        onBack();
      } else {
        // Exit app if you're on the home page
        App.exitApp();
      }
    }).then((h) => {
      handler = h;
    });

    return () => {
      handler?.remove();
    };
  }, [onBack]);
}
