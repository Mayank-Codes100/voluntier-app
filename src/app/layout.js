import { Inter } from "next/font/google";
import Navbar from "../components/Navbar"; 
import "./globals.css";

// 1. Google Font Setup (Website ki default font)
const inter = Inter({ subsets: ["latin"] });

// 2. SEO & Browser Tab Metadata (Yeh har page ke tab par dikhega)
export const metadata = {
  title: "VolunTier - Make an Impact",
  description: "Gamified volunteering platform for NGOs and Volunteers",
};

// 3. RootLayout - Yeh hamari app ka Master Wrapper hai
export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning lagaya hai taaki Chrome extensions UI ko crash na karein
    <html lang="en" suppressHydrationWarning>
      
      {/*  Body ko flexbox banaya taaki footer hamesha bottom par rahe */}
      <body className={`${inter.className} bg-gray-50 pb-20 md:pb-0 md:pt-16 flex flex-col min-h-screen`}>
        
        {/* GLOBAL NAVBAR: Yeh automatic har page par chalega */}
        <Navbar />

        {/* MAIN CONTENT: Baaki saare pages (Login, Dashboard) yahan render honge */}
        {/* flex-grow lagane se yeh main content bachi hui saari space le lega */}
        <main className="max-w-4xl mx-auto flex-grow w-full">
          {children}
        </main>

        {/* NAYA: GLOBAL FOOTER (Yeh har page ke end mein dikhega) */}
        <footer className="w-full bg-white border-t border-gray-200 mt-auto py-8 text-center text-gray-500 text-sm hidden md:block">
          <div className="max-w-4xl mx-auto flex justify-between items-center px-6">
            <p className="font-bold text-gray-700">Volun<span className="text-emerald-500">Tier</span> &copy; {new Date().getFullYear()}</p>
            <p className="font-medium">Built with ❤️ for a Better World</p>
          </div>
        </footer>
      </body>
    </html>
  );
}