// app/page.tsx (Home page with chat rooms)
'use client';
import ChatRoom from '@/components/ChatRoom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { useRouter } from "next/navigation";
import useAndroidBackButton from "@/utils/useAndroidBackButton";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
    useAndroidBackButton(() => {
      router.back();
    });

  if (loading) {
    return <Loading text="Loading chat..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-gray-700 text-lg">Please log in to access chat rooms.</p>

        </div>
      </div>
    );
  }

  return <ChatRoom user={user} />;
}