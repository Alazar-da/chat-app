'use client';
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { updatePassword, signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { compressAndUploadImage } from "@/utils/uploadImage";
import Sidebar from "@/components/SideBar";
import { Eye, EyeOff, Upload } from "lucide-react";
import Loading from "@/components/Loading";
import { FiUser, FiX } from "react-icons/fi";
import useAndroidBackButton from "@/utils/useAndroidBackButton";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);


  useAndroidBackButton(() => {
    router.back();
  });




  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUsername(userData.username || "");
        setDisplayName(userData.displayName || user.displayName || "");
        setPhoneNumber(userData.phoneNumber || "");
        setImageUrl(userData.photoURL || user.photoURL || null);
      }
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      showMessage("❌ Display name cannot be empty!", "error");
      return;
    }

    if (!username.trim()) {
      showMessage("❌ Username cannot be empty!", "error");
      return;
    }

    setUpdating(true);
    try {
      // Check if username already exists
      const q = query(collection(db, "users"), where("username", "==", username.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0].id !== user.uid) {
        showMessage("❌ Username already taken!", "error");
        return;
      }

      // Update profile information
      const updateData = {
        username: username.trim(),
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "users", user.uid), updateData);
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: imageUrl
      });

      // Update password if provided
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          showMessage("❌ Password must be at least 6 characters!", "error");
          return;
        }
        await updatePassword(user, newPassword);
        setNewPassword("");
        showMessage("✅ Profile and password updated successfully!");
      } else {
        showMessage("✅ Profile updated successfully!");
      }

    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      showMessage(`❌ Error: ${error.message}`, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      showMessage(`❌ Logout failed: ${error.message}`, "error");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const secureUrl = await compressAndUploadImage(file, "profile_images");
      await updateProfile(user, { photoURL: secureUrl });
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: secureUrl,
        updatedAt: new Date(),
      });
      setImageUrl(secureUrl);
      showMessage("✅ Profile image updated!");
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      showMessage(`❌ Failed to upload image: ${error.message}`, "error");
    } finally {
      setUploadingImage(false);
    }
  };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage("❌ Please select a valid image file!", "error");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("❌ Image size should be less than 5MB!", "error");
      return;
    }

    await handleImageUpload(file);
    
    // Reset the input
    e.target.value = '';
  };

  const removeProfileImage = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateProfile(user, { photoURL: null });
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: null,
        updatedAt: new Date(),
      });
      setImageUrl(null);
      showMessage("✅ Profile image removed!");
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      showMessage(`❌ Failed to remove image: ${error.message}`, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Loading text="Loading your profile..."/>
    );
  }

  return (
    <main className="flex h-screen bg-gray-50 text-slate-800">
      {/* Sidebar */}
      <Sidebar chat={false}/>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b p-4 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white pt-10 lg:pt-4 pb-6">

          <h2 className="text-lg font-semibold flex items-center space-x-2 justify-center w-full pt-1">
                        <FiUser className="text-2xl" />
                       <span>My Profile</span> 
          </h2>
          <div className="w-8"></div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                    <button
                      onClick={removeProfileImage}
                      disabled={updating || uploadingImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 hover:cursor-pointer"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white shadow-xl">
                    {user?.email?.charAt(0).toUpperCase() || '👤'}
                  </div>
                )}

                {/* Custom Upload Button */}
                <div className="absolute bottom-2 right-2">
                  <label className={`cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center ${(updating || uploadingImage) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}>
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={updating || uploadingImage}
                    />
                  </label>
                </div>

                {/* Uploading Overlay */}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
               <h1 className="text-4xl font-bold text-gray-800 lg:mb-2 hidden lg:block">My Profile</h1>
              <p className="text-gray-600 text-lg">{user?.email}</p>
              </div>


            {/* Message Alert */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl ${
                  messageType === "success"
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
                } flex items-center animate-fade-in shadow-sm`}
              >
                <span className="mr-3 text-lg">
                </span>
                <span className="font-medium">{message}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Information Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 text-xl">👤</span>
                  </div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      disabled={updating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      disabled={updating}
                    />
                  </div>
                </div>
              </div>

              {/* Username Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 text-xl">🔖</span>
                  </div>
                  <h2 className="text-xl font-semibold">Username</h2>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 text-xl">🔒</span>
                  </div>
                  <h2 className="text-xl font-semibold">Change Password</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (optional)"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 pr-12"
                      disabled={updating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
                      disabled={updating}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave empty to keep current password. Must be at least 6 characters if changing.
                  </p>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 text-xl">ℹ️</span>
                  </div>
                  <h2 className="text-xl font-semibold">Account Information</h2>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="font-semibold">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">User ID:</span>
                    <span className="font-mono text-xs">{user?.uid}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Display Name:</span>
                    <span className="text-indigo-600 font-semibold">
                      {displayName || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Username:</span>
                    <span className="text-indigo-600 font-semibold">
                      {username ? `@${username}` : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="font-semibold">
                      {phoneNumber || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="flex items-center text-green-600 font-semibold">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Update Button Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 text-xl">⚡</span>
                  </div>
                  <h2 className="text-xl font-semibold">Update Profile</h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Update all your profile information at once. Password change is optional.
                  </p>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updating || !displayName.trim() || !username.trim()}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center text-lg hover:cursor-pointer"
                  >
                    {updating ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Updating Profile...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </div>
              </div>

              {/* Logout Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600 text-xl">🚪</span>
                  </div>
                  <h2 className="text-xl font-semibold">Account Actions</h2>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    disabled={updating}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center hover:cursor-pointer"
                  >
                    <span className="mr-2">🚪</span>
                    Logout
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    You&apos;ll be signed out of all devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}