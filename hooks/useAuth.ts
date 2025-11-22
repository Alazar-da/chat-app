'use client';
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  User,
   signInWithCredential, 
  GoogleAuthProvider
} from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Convert name to username-safe format
  const formatUsername = (base: string) => {
    return base
      .toLowerCase()
      .replace(/\s+/g, "_") // replace spaces with underscore
      .replace(/[^a-z0-9_]/g, "") // remove invalid chars
      .slice(0, 20); // max 20 chars
  };

  // ✅ Generate unique username based on displayName or email
 const generateUniqueUsername = async (firebaseUser: User) => {
    let base =
      firebaseUser.displayName ||
      firebaseUser.email?.split("@")[0] ||
      "user";

    let username = formatUsername(base);
    let exists = true;
    let attempt = 0;

    while (exists && attempt < 10) {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      exists = !querySnapshot.empty;

      if (exists) {
        // append random 2-digit number
        username = `${formatUsername(base)}_${Math.floor(Math.random() * 100)}`;
      }
      attempt++;
    }

    return username;
  };

  // 🔄 Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const username = await generateUniqueUsername(firebaseUser);
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username,
            displayName: firebaseUser.displayName || null,
            createdAt: new Date(),
          });
        } else {
          const data = userSnap.data();
          if (!data.username) {
            const username = await generateUniqueUsername(firebaseUser);
            await setDoc(userRef, { ...data, username }, { merge: true });
          }
        }
      }
    });

    return unsubscribe;
  }, []);

  // 📨 Register (email/password)
  const register = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const username = await generateUniqueUsername(user);


    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      username,
      displayName: username || null,
      createdAt: new Date(),
    });
  };

  // 🔑 Login (email/password)
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // 🔄 Google Login
 const loginWithGoogle = async () => {
  let user;

  if (Capacitor.getPlatform() !== "web") {
    // 📱 Native mobile Google login (Capacitor)
    const googleUser = await GoogleAuth.signIn();

    const idToken = googleUser.authentication.idToken;
    const credential = GoogleAuthProvider.credential(idToken);

    const result = await signInWithCredential(auth, credential);
    user = result.user;
  } else {
    // 🌐 Web login (browser)
    const result = await signInWithPopup(auth, googleProvider);
    user = result.user;
  }

  // --- Firestore user creation logic ---
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const username = await generateUniqueUsername(user);

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      username,
      displayName: user.displayName || null,
      createdAt: new Date(),
    });
  } else {
    const data = userSnap.data();
    if (!data.username) {
      const username = await generateUniqueUsername(user);
      await setDoc(userRef, { ...data, username }, { merge: true });
    }
  }
};


  // 🚪 Logout
  const logout = async () => await signOut(auth);

  return { user, loading, login, register, loginWithGoogle, logout };
}
