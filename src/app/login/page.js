"use client";
import { useState } from 'react';
import { auth } from '../../lib/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Next.js optimized routing karega yeh

export default function Login() {
  // STATE VARIABLES 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading state taaki user baar-baar click na kare
  const [isProcessing, setIsProcessing] = useState(false); 
  
  const router = useRouter();

  // ACTION HANDLERS 
  
  // Jab form submit hoga toh yeh function chalega
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true); // Button ko disable aur loading mode mein daalo

    try {
      // Firebase ka in-built function jo email aur password check karta hai
      await signInWithEmailAndPassword(auth, email, password);
      
      alert("Welcome back!");
      router.push('/dashboard'); // Login successful hone par dashboard par bhejo
      
    } catch (error) {
      // Agar password galat hai ya user nahi hai
      alert("Login failed: " + error.message);
    } finally {
      // Try ya Catch dono ke baad loading band kar do
      setIsProcessing(false); 
    }
  };

  // RENDER UI 
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
      
      <form onSubmit={handleLogin} className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Welcome Back 👋</h1>
          <p className="text-sm text-gray-500 font-medium">Log in to continue making an impact</p>
        </div>
        
        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
          <input 
            type="email" 
            placeholder="e.g. user@gmail.com" 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        {/* Submit Button with Dynamic Text */}
        <button 
          type="submit" 
          disabled={isProcessing}
          className={`w-full p-3.5 rounded-xl font-bold text-white transition shadow-sm ${
            isProcessing ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isProcessing ? "Verifying Credentials..." : "Sign In Securely"}
        </button>

        {/* Redirect to Sign Up */}
        <p className="mt-6 text-center text-sm font-medium text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">
            Create one here
          </Link>
        </p>
      </form>
      
    </div>
  );
}