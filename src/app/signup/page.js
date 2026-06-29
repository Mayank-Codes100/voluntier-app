"use client";
import { useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  //  STATE VARIABLES 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');   
  const [phone, setPhone] = useState(''); 
  const [role, setRole] = useState('volunteer');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  //  ACTION HANDLERS 
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsProcessing(true); 

    try {
      // Step 1: Firebase Auth mein naya user account bana 
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Firestore Database mein user ka sara data save kara ise
      await setDoc(doc(db, "users", user.uid), {
        name: name,          
        phone: phone,      
        email: email,
        role: role,
        createdAt: new Date()
      });

      // Step 3: Success message aur Login page par redirect
      alert("Account created successfully! Redirecting to login page.");
      router.push('/login'); 
      
    } catch (error) {
      alert("Error creating account: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  //  RENDER UI 
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
      
      <form onSubmit={handleSignup} className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Join VolunTier 🚀</h1>
          <p className="text-sm text-gray-500 font-medium">Create your account to start making an impact</p>
        </div>
        
        {/*  Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name / NGO Name</label>
          <input 
            type="text" 
            placeholder="e.g. Rahul or Helping Hands NGO" 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>

        {/*  Phone Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
          <input 
            type="tel" 
            placeholder="e.g. +91 9876543210" 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            onChange={(e) => setPhone(e.target.value)} 
            required 
          />
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
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
          <input 
            type="password" 
            placeholder="Create a strong password" 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        {/* Role Selection Dropdown */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Your Role</label>
          <select 
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-semibold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer" 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="volunteer">🙋‍♂️ I want to Volunteer</option>
            <option value="ngo">🏢 I represent an NGO</option>
          </select>
        </div>
        
        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isProcessing}
          className={`w-full p-3.5 rounded-xl font-bold text-white transition shadow-sm ${
            isProcessing ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isProcessing ? "Creating Account..." : "Create Account"}
        </button>

        {/* Redirect to Login */}
        <p className="mt-6 text-center text-sm font-medium text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">
            Sign In here
          </Link>
        </p>
      </form>
      
    </div>
  );
}