// app/private-chat/page.tsx
'use client'
import PrivateChat from '@/components/PrivateChat';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';

export default function PrivateChatPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text="Loading private chats..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-gray-700 text-lg">Please log in to access private chats.</p>
        </div>
      </div>
    );
  }

  return <PrivateChat user={user} />;
}