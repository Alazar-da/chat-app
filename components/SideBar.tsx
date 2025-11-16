// components/Sidebar.tsx
'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = ({chat=false}:{chat:boolean}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { 
      name: 'Home', 
      path: '/chat', 
      icon: '🏠',
      description: 'Chat Rooms'
    },
    { 
      name: 'Private Chat', 
      path: '/private-chat', 
      icon: '💬',
      description: 'Private Messages'
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: '👤',
      description: 'Your Profile'
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-2 left-4 z-50 py-2 px-3 rounded-lg bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors duration-200 ${chat?"hidden":""}   ${isOpen ? "hidden" : ""}`}
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gradient-to-b from-indigo-700 via-indigo-600 to-indigo-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/50">
          <h1 className="text-2xl font-bold text-white mb-2">ChatApp</h1>
         {user && (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-inner overflow-hidden">
      {user.photoURL ? (
        <img 
          src={user.photoURL} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium truncate text-sm">
        {user.displayName || user.email?.split('@')[0] || 'User'}
      </p>
      <p className="text-indigo-200 text-xs truncate">
        {user.email}
      </p>
      <div className="flex items-center mt-1">
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
        <span className="text-indigo-200 text-xs">Online</span>
      </div>
    </div>
  </div>
)}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center space-x-3 p-3 rounded-xl
                transition-all duration-200 group hover:cursor-pointer
                ${isActive(item.path)
                  ? 'bg-white text-indigo-700 shadow-lg transform scale-105 border-2 border-white'
                  : 'text-indigo-100 hover:bg-indigo-500/80 hover:text-white hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <span className={`text-xl transition-transform duration-200 group-hover:scale-110 ${
                isActive(item.path) ? 'scale-110' : ''
              }`}>
                {item.icon}
              </span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className={`text-xs ${
                  isActive(item.path) ? 'text-indigo-500 font-medium' : 'text-indigo-300'
                }`}>
                  {item.description}
                </div>
              </div>
              {isActive(item.path) && (
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-500/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-xl
                     text-indigo-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 
                     hover:text-white hover:shadow-md transition-all duration-200 group hover:cursor-pointer"
          >
            <span className="text-xl transition-transform group-hover:scale-110">🚪</span>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Logout</div>
              <div className="text-xs text-indigo-300 group-hover:text-red-100">
                Sign out of your account
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-indigo-500/50">
          <div className="text-center">
            <p className="text-indigo-300 text-xs mb-1">Built with ❤️ by Alazar</p>
            <p className="text-indigo-400 text-xs">ChatApp v1.0</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Sidebar;