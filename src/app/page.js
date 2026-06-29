"use client";
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import Link from 'next/link';

export default function Home() {
  //  STATE VARIABLES 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  //  AUTHENTICATION HOOK 
  useEffect(() => {
    // Firebase listener jo background mein check karta hai ki user logged in hai ya nahi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setCheckingAuth(false);
    });
    
    // Cleanup function memory leak rokne ke liye
    return () => unsubscribe();
  }, []);

  //  UI HELPER FUNCTIONS 
  
  // Call-To-Action (CTA) button ko clean rakhne ke liye helper function
 
  const renderCTA = () => {
    if (checkingAuth) {
      return <p className="text-sm font-semibold text-gray-400 animate-pulse">Analyzing portal routing...</p>;
    }
    
    if (isLoggedIn) {
      return (
        <Link href="/dashboard" className="bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
          Go to Dashboard 🚀
        </Link>
      );
    }

    return (
      <Link href="/signup" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/10">
        Get Started Now (Free) ⚡
      </Link>
    );
  };

  // RENDER UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800 font-sans">
      
      {/* Hero Section (Top part of the landing page) */}
      <header className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
        
        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-200 mb-6 animate-pulse tracking-wide uppercase">
          🏆 Next-Gen Gamified Social Portal
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight max-w-3xl mb-6">
          Make an Impact, <br />
          Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">VolunTier</span> Status
        </h1>
        
        <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed mb-8">
          A unified system where NGOs post real-time needs (services & material assets) and volunteers earn XP points, dynamic tier rankings, and printable official scroll certificates.
        </p>

        {/* Dynamic CTA Button rendered smoothly via helper function */}
        <div className="flex gap-4 flex-wrap justify-center min-h-[56px] items-center">
          {renderCTA()}
        </div>
      </header>

      {/* Dual-Experience Features Section */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-10 tracking-tight">One Platform. Two Powerful Perspectives.</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Box 1: Volunteers */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-4">🥈</div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">For Change-Makers (Volunteers)</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Explore open needs nearby. Sign up to contribute physical hours or donate required material items (like books or clothes). Track your standing on global score boards and lock down certified badges.
            </p>
            <div className="flex gap-2 flex-wrap text-[11px] font-bold text-emerald-700">
              <span className="bg-emerald-50 px-2.5 py-1 rounded">Earn XP Logs</span>
              <span className="bg-emerald-50 px-2.5 py-1 rounded">Unlock Milestones</span>
              <span className="bg-emerald-50 px-2.5 py-1 rounded">1-Page Print Certs</span>
            </div>
          </div>

          {/* Box 2: NGOs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">For Registered Social Organizations</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Broadcast critical target alerts seamlessly. Monitor operational incoming applicant flows, process statuses instantly with one click, and overview deep automated performance metrics graphs.
            </p>
            <div className="flex gap-2 flex-wrap text-[11px] font-bold text-indigo-700">
              <span className="bg-indigo-50 px-2.5 py-1 rounded">Dynamic Creation Desks</span>
              <span className="bg-indigo-50 px-2.5 py-1 rounded">Supply Tracking</span>
              <span className="bg-indigo-50 px-2.5 py-1 rounded">Crowd Metrics Audit</span>
            </div>
          </div>

        </div>
      </section>

      {/* Footer Section */}
      <footer className="text-center py-10 text-xs font-semibold text-gray-400 tracking-wider uppercase border-t mt-12 bg-gray-50/50">
        🛡️ Secure Decentralized Architecture Managed via VolunTier Framework Engine
      </footer>
    </div>
  );
}