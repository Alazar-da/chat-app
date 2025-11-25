import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed
} from "@capacitor/push-notifications";

export const registerPush = async () => {
  // Ask for permission
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === "prompt") {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== "granted") {
    console.warn("Push notification permission not granted");
    return;
  }

  // Register with FCM/APNS
  await PushNotifications.register();

  // Fired when registration succeeds
  PushNotifications.addListener("registration", (token: Token) => {
    console.log("Device token:", token.value);
    saveDeviceTokenToFirestore(token.value);
  });

  // Fired when registration fails
  PushNotifications.addListener("registrationError", (err) => {
    console.error("Registration error:", err);
  });

  // Receive notification when app is foreground
  PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      console.log("Push received:", notification);
    }
  );

  // When user taps notification
  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: ActionPerformed) => {
      console.log("Notification action:", action);
    }
  );
};

const saveDeviceTokenToFirestore = async (token: string) => {
  // Save to /users/{userId}/deviceTokens/{token}
  // You already have Firebase in your project
  // Adjust based on your user schema
};
