"use client";
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import Link from 'next/link';

export default function Navbar() {
  //  STATE VARIABLES 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //  AUTHENTICATION HOOK 
  useEffect(() => {
    // Firebase listener jo live check karta hai ki user logged in hai ya nahi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    
    // Cleanup function taaki memory leak na ho
    return () => unsubscribe();
  }, []);

  //  UI HELPER FUNCTIONS HAI YEH

  
  // 1. Desktop ke beech wale Navigation Links
  const renderDesktopLinks = () => {
    // Agar user logged in nahi hai, toh yeh links mat dikhao
    if (!isLoggedIn) return null; 
    
    return (
      <>
        <Link href="/dashboard" className="hover:text-emerald-500 transition">Dashboard</Link>
        <Link href="/explore" className="hover:text-emerald-500 transition">Explore Gigs</Link>
        <Link href="/impact" className="hover:text-emerald-500 transition">My Impact</Link>
      </>
    );
  };

  // 2. Desktop ke right side wale Auth Buttons (Profile Icon ya Login/Register)
  const renderAuthButtons = () => {
    if (isLoggedIn) {
      // Logged in hai toh 'M' avatar dikhao
      return (
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 cursor-pointer hover:bg-emerald-200 transition">
          <span className="font-bold text-emerald-700">M</span>
        </Link>
      );
    }

    // Agar logged in nahi hai toh Login aur Register button dikhao
    return (
      <>
        <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-emerald-500 transition px-2">
          Sign In
        </Link>
        <Link href="/signup" className="bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 transition border border-emerald-200 shadow-sm">
          Register
        </Link>
      </>
    );
  };

  // 3. Mobile ke liye bottom tab bar (Sirf tab dikhega jab login ho)
  const renderMobileNav = () => {
    if (!isLoggedIn) return null;

    return (
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard" className="flex flex-col items-center text-emerald-500">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold mt-1">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center text-gray-400 hover:text-emerald-500 transition">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] font-bold mt-1">Explore</span>
        </Link>
        <Link href="/impact" className="flex flex-col items-center text-gray-400 hover:text-emerald-500 transition">
          <span className="text-xl">🏆</span>
          <span className="text-[10px] font-bold mt-1">Impact</span>
        </Link>
      </nav>
    );
  };

  // RENDER UI 
  return (
    <>
      {/*  DESKTOP NAVBAR */}
      {/* Tailwind ki 'hidden md:flex' class ise mobile par chupa degi aur laptop par dikhayegi */}
      <nav className="hidden md:flex fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 px-8 py-4 justify-between items-center max-w-7xl mx-auto">
        
        {/* Left: Logo */}
        <Link href="/" className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Volun<span className="text-emerald-500">Tier</span>
        </Link>
        
        {/* Center: Navigation Links */}
        <div className="flex gap-6 font-semibold text-gray-600">
          {renderDesktopLinks()}
        </div>

        {/* Right: Profile / Auth Buttons */}
        <div className="flex items-center gap-4">
          {renderAuthButtons()}
        </div>
      </nav>

      {/*  MOBILE BOTTOM NAVBAR  */}
      {/* Tailwind ki 'md:hidden' class ise laptop par chupa degi aur mobile par dikhayegi */}
      {renderMobileNav()}
    </>
  );
}