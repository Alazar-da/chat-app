"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import Loading from "@/components/Loading";
import { initGoogleAuth } from "@/google-auth";
import { registerPush } from "@/lib/pushNotifications";

function getFriendlyError(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-not-found":
      return "User not found.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "Email is already registered.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { user, login, register, loginWithGoogle, loading } = useAuth();

  // --- Google Auth INITIALIZATION (WEB ONLY) ---
  useEffect(() => {
    initGoogleAuth();
  }, []);
  // ------------------------------------------------
useEffect(() => {
  if (user) {
    registerPush();
  }
}, [user]);

  // Redirect to chat if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/chat");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        setSuccess("🎉 Login successful! Redirecting...");
      } else {
        await register(email, password);
        setSuccess("🎉 Account created successfully! Redirecting...");
      }

      setTimeout(() => router.push("/chat"), 1200);
    } 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      setError(getFriendlyError(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await loginWithGoogle();
      setSuccess("🎉 Google login successful! Redirecting...");
      setTimeout(() => router.push("/chat"), 1200);
    }
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err?.message || "Google login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <Loading text="Loading..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center md:py-8 py-15 px-4 text-slate-800">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl hidden md:flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">💬</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">ChatApp</h1>
          <p className="text-gray-600">Connect with friends and communities</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            {isLogin ? "Welcome Back" : "Join ChatApp"}
          </h2>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl flex items-center animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-center animate-fade-in">
              <span className="mr-3">⚠️</span>
              <span className="font-medium pt-1">{error}</span>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled={submitting || !!success}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  disabled={submitting || !!success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 pr-12 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  disabled={submitting || !!success}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !!success}
              className={`w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all ${
                submitting || success
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:from-indigo-600 hover:to-purple-700"
              } flex items-center justify-center`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isLogin ? "Signed In!" : "Account Created!"}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          {!success && (
            <>
              <div className="flex items-center my-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 text-sm font-medium">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={submitting || !!success}
                className={`w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl font-semibold text-gray-700 transition-all 
                ${
                  submitting || success
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 hover:border-gray-400 hover:scale-[1.02]"
                }`}
              >
                <FcGoogle className="text-2xl" />
                Continue with Google
              </button>
            </>
          )}

          {/* Toggle Login / Signup */}
          {!success && (
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                  }}
                  className="ml-2 text-indigo-600 hover:text-indigo-700 font-semibold"
                  disabled={submitting}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              By continuing, you agree to our Terms and Privacy Policy
            </p>
          </div>
        )}
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
