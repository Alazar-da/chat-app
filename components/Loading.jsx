// components/Loading.jsx
import React from 'react';

const Loading = ({ text = "Loading..." }) => {
  return (
    <section className="flex flex-col items-center justify-center p-8 min-h-screen w-full bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Spinner with bounce animation */}
      <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4 relative">
      </div>
      
      {/* Text with subtle bounce animation */}
      <p className="text-indigo-600 font-medium animate-bounce">
        {text}
      </p>
      
      {/* Optional: Dots animation */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </section>
  );
};

export default Loading;