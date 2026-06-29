"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ExploreGigs() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  //  STATE VARIABLES 
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [appliedGigs, setAppliedGigs] = useState([]);
  
  const router = useRouter();

  //  DATABASE FUNCTIONS 

  // 1. Fetch All Live Gigs 
  const fetchAllGigs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "gigs"));
      const gigsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGigs(gigsData);
      setFilteredGigs(gigsData);
    } catch (error) {
      console.error("Error fetching all gigs: ", error);
    }
  };

  // 2. Fetch tracking for already applied buttons
  const fetchVolunteerApplications = async (volunteerEmail) => {
    try {
      const querySnapshot = await getDocs(collection(db, "applications"));
      
      // yahan ham Filter karke sirf un gigs ki ID nikal rahe hain jahan user apply kar chuka hai
      const alreadyAppliedIds = querySnapshot.docs
        .filter(doc => doc.data().volunteerEmail === volunteerEmail)
        .map(doc => doc.data().gigId);
        
      setAppliedGigs(alreadyAppliedIds);
    } catch (error) {
      console.error("Error fetching applications: ", error);
    }
  };

  // AUTHENTICATION HOOK 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }

        await fetchAllGigs();
        
        if (userDoc.data()?.role === 'volunteer') {
          await fetchVolunteerApplications(currentUser.email);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  //  SEARCH & FILTER LOGIC 
  useEffect(() => {
    let results = gigs;

    // Pehle Tab ke hisab se filter karo
    if (activeTab !== 'all') {
      results = results.filter(gig => {
        let gigType = gig.type;
        if (!gigType) gigType = 'service'; // agar type nahi hai toh default service pe rahega
        return gigType === activeTab;
      });
    }

    // Phir Search bar ke text ke hisab se filter karo
    if (searchTerm.trim() !== '') {
      let lowerSearch = searchTerm.toLowerCase();
      results = results.filter(gig =>
        gig.title.toLowerCase().includes(lowerSearch) ||
        gig.location.toLowerCase().includes(lowerSearch) ||
        gig.description.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredGigs(results);
  }, [searchTerm, activeTab, gigs]);

  //  ACTION HANDLERS 
  const handleApply = async (gig) => {
    if (role === 'ngo') {
      alert("NGOs cannot sign up for volunteer needs!");
      return;
    }
    
    if (appliedGigs.includes(gig.id)) {
      alert("Already responded to this request!");
      return;
    }

    try {
      let gigTypeToSave = 'service';
      if (gig.type) {
        gigTypeToSave = gig.type;
      }

      await addDoc(collection(db, "applications"), {
        gigId: gig.id,
        gigTitle: gig.title,
        gigType: gigTypeToSave,
        volunteerEmail: user.email,
        ngoEmail: gig.ngoEmail.trim().toLowerCase(),
        status: 'pending',
        appliedAt: new Date()
      });

      // Simple if-else for Alert message
      let successMessage = "Successfully signed up for: " + gig.title;
      if (gig.type === 'resource') {
        successMessage = "Thank you for pledging resources for: " + gig.title;
      }
      alert(successMessage);
      
      setAppliedGigs([...appliedGigs, gig.id]);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  //  UI HELPER FUNCTIONS 
  
  // Tab buttons ko color dene ka helper function
  const getTabStyle = (tabName) => {
    let baseStyle = "px-4 py-2 rounded-lg font-bold text-sm transition ";
    
    if (activeTab === tabName) {
      if (tabName === 'all') return baseStyle + "bg-gray-900 text-white";
      if (tabName === 'service') return baseStyle + "bg-orange-600 text-white";
      if (tabName === 'resource') return baseStyle + "bg-purple-600 text-white";
    }
    
    return baseStyle + "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50";
  };

  // Ek Gig Card ka design (colors, text) set karne ka helper function
  const getCardUI = (gig) => {
    let isApplied = appliedGigs.includes(gig.id);
    let isResource = gig.type === 'resource';

    // Default (Service) styling
    let badgeCss = "bg-orange-100 text-orange-600";
    let badgeText = "⚡ Service Need";
    let locationText = "Location: " + gig.location;
    let buttonCss = "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white shadow-sm";
    let buttonText = "Sign Up for Gig ⚡";

    // Agar Resource (Books/Supplies) ki requirement hai
    if (isResource) {
      badgeCss = "bg-purple-100 text-purple-700";
      badgeText = "📦 Material Supply";
      locationText = "Drop-off: " + gig.location;
      buttonCss = "bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white shadow-sm";
      buttonText = "Provide Resources 📦";
    }

    // Agar Volunteer apply kar chuka hai toh button disable design
    if (isApplied) {
      buttonCss = "bg-gray-100 text-gray-400 cursor-not-allowed";
      buttonText = "Applied / Pledged ✅";
    }

    return { badgeCss, badgeText, locationText, buttonCss, buttonText };
  };

  //  RENDER UI 
  if (loading) return <div className="text-center mt-10 font-medium text-gray-500">Loading Explore Board...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 max-w-5xl mx-auto">
      
      {/* Header & Search Area */}
      <div className="mb-8 mt-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Explore Opportunities 🔍</h1>
        <p className="text-gray-500 mb-6 font-medium">Find active social needs or donate material resources near you.</p>
        
        {/* Search Input */}
        <div className="relative max-w-xl shadow-sm rounded-xl mb-6">
          <input 
            type="text" 
            placeholder="Search by Title, Description, or Location..." 
            className="w-full p-4 pl-12 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-4 text-xl gray-400 select-none">🔍</span>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 border-b pb-3 border-gray-200">
          <button onClick={() => setActiveTab('all')} className={getTabStyle('all')}>
            All Needs ({gigs.length})
          </button>
          
          <button onClick={() => setActiveTab('service')} className={getTabStyle('service')}>
            ⚡ Physical Help ({gigs.filter(g => (g.type || 'service') === 'service').length})
          </button>
          
          <button onClick={() => setActiveTab('resource')} className={getTabStyle('resource')}>
            📦 Supplies/Books ({gigs.filter(g => g.type === 'resource').length})
          </button>
        </div>
      </div>

      {/* Gigs Cards Grid */}
      <section>
        {filteredGigs.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-700 mb-1">No matches found</p>
            <p className="text-gray-400 text-sm">Try switching your category tabs or clearing your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {filteredGigs.map((gig) => {
              // Har card ke liye design logic helper se mangwa rahe hain
              const ui = getCardUI(gig);

              return (
                <div key={gig.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${ui.badgeCss}`}>
                        {ui.badgeText}
                      </span>
                      <span className="text-sm font-bold text-emerald-500">+4 hrs</span>
                    </div>
                    
                    <h3 className="font-extrabold text-xl text-gray-800 mb-1 tracking-tight">{gig.title}</h3>
                    <p className="text-sm text-gray-500 font-semibold mb-3">📍 {ui.locationText}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{gig.description}</p>
                    <p className="text-[11px] text-gray-400 font-medium mb-4 border-t pt-3">Organized by: {gig.ngoEmail}</p>
                  </div>

                  {/* Conditional Rendering using simple && operator */}
                  {role === 'ngo' && (
                    <div className="w-full text-center bg-gray-50 text-gray-400 text-xs font-bold py-2 rounded-lg border border-dashed border-gray-200">
                      Viewing as NGO
                    </div>
                  )}

                  {role !== 'ngo' && (
                    <button 
                      onClick={() => handleApply(gig)}
                      disabled={appliedGigs.includes(gig.id)}
                      className={`w-full font-bold py-2.5 rounded-xl transition ${ui.buttonCss}`}
                    >
                      {ui.buttonText}
                    </button>
                  )}
                </div>
              );
            })}

          </div>
        )}
      </section>

    </div>
  );
}