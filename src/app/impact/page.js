"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function MyImpact() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const router = useRouter();

  // Modal aur Stats ke States
  const [activeCertificate, setActiveCertificate] = useState(null);

  const [volunteerStats, setVolunteerStats] = useState({
    totalHours: 0,
    totalDonations: 0,
    points: 0,
    badge: "Bronze Helper 🥉"
  });

  const [ngoStats, setNgoStats] = useState({
    totalReceived: 0,
    pendingCount: 0,
    acceptedServices: 0,
    acceptedResources: 0
  });

  //  DATABASE FETCHING LOGIC 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // 1. User ka role pata karo
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userRole = userDoc.data().role;
            setRole(userRole);

            // 2. Role ke hisab se database se data nikalna
            if (userRole === 'volunteer') {
              
              // Sirf is volunteer ki applications laao
              const q = query(collection(db, "applications"), where("volunteerEmail", "==", currentUser.email));
              const querySnapshot = await getDocs(q);
              const apps = querySnapshot.docs.map(doc => doc.data());
              setApplications(apps);

              // Counters calculate karo
              const serviceApps = apps.filter(app => (app.gigType || 'service') === 'service');
              const resourceApps = apps.filter(app => app.gigType === 'resource');
              
              const hoursCount = serviceApps.length * 4;
              const donationsCount = resourceApps.length;
              
              // Points calculate karo
              let calculatedPoints = 0;
              apps.forEach(app => {
                calculatedPoints += 15;
                if (app.status === 'accepted') {
                  calculatedPoints += 50; 
                }
              });
              
              // Badge system logic (Simple If-Else)
              let currentBadge = "Bronze Helper 🥉";
              if (calculatedPoints >= 200) {
                currentBadge = "Elite Philanthropist 👑";
              } else if (calculatedPoints >= 120) {
                currentBadge = "Gold Champion 🥇";
              } else if (calculatedPoints >= 50) {
                currentBadge = "Silver Hero 🥈";
              }

              setVolunteerStats({
                totalHours: hoursCount,
                totalDonations: donationsCount,
                points: calculatedPoints,
                badge: currentBadge
              });

            } else if (userRole === 'ngo') {
              
              // NGO ki sari received applications laao 
              const cleanEmail = currentUser.email.trim().toLowerCase();
              const q = query(collection(db, "applications"), where("ngoEmail", "==", cleanEmail));
              const querySnapshot = await getDocs(q);
              const apps = querySnapshot.docs.map(doc => doc.data());
              setApplications(apps);

              // NGO Metrics Count
              const pending = apps.filter(app => app.status === 'pending').length;
              const acceptedServices = apps.filter(app => app.status === 'accepted' && (app.gigType || 'service') === 'service').length;
              const acceptedResources = apps.filter(app => app.status === 'accepted' && app.gigType === 'resource').length;

              setNgoStats({
                totalReceived: apps.length,
                pendingCount: pending,
                acceptedServices: acceptedServices,
                acceptedResources: acceptedResources
              });
            }
          } else {
            setRole('no-role');
          }
        } catch (error) {
          console.error("Error processing impact screen data:", error);
        }

      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);


  //  UI HELPER FUNCTIONS 

  // 1. Gig type (Service ya Resource) ke colors aur text nikalna
  const getGigTypeUI = (type) => {
    if (type === 'resource') {
      return { css: "bg-purple-100 text-purple-700", text: "📦 Material" };
    }
    return { css: "bg-orange-100 text-orange-700", text: "⚡ Service" };
  };

  // 2. Application Status ke hisab se badge ka color dena
  const getStatusUI = (status) => {
    if (status === 'accepted') {
      return "bg-green-100 text-green-800";
    } else if (status === 'rejected') {
      return "bg-red-100 text-red-800";
    }
    return "bg-yellow-100 text-yellow-800"; // Default pending color
  };

  // 3. Leaderboard mein rank ke hisab se trophy color dena
  const getLeaderboardRankColor = (index) => {
    if (index === 0) return "text-yellow-500"; // Rank 1
    if (index === 1) return "text-gray-400";   // Rank 2
    return "text-gray-600";                    // Rank 3 and below
  };

  // 4. Leaderboard mein khud ka naam highlight karna
  const getLeaderboardRowStyle = (isCurrentUser) => {
    let baseStyle = "p-3 rounded-xl flex justify-between items-center text-sm border transition ";
    if (isCurrentUser) {
      return baseStyle + "bg-emerald-50 border-emerald-200 shadow-sm";
    }
    return baseStyle + "bg-gray-50 border-gray-100";
  };

  // 5. Certificate par sahi authorization text likhna
  const getCertificateTypeText = (type) => {
    if (type === 'resource') {
      return "📦 Material Supporter";
    }
    return "⚡ 4 Hours Contributed";
  };


  // Mock Leaderboard Data for Volunteers
  const mockLeaderboard = [
    { rank: 1, name: "ayush_sharma@gmail.com", points: 450, badge: "👑 Elite" },
    { rank: 2, name: "priya_v@gmail.com", points: 320, badge: "🥇 Gold" },
    { rank: 3, name: user?.email || "you@gmail.com", points: volunteerStats.points, badge: volunteerStats.badge.split(' ')[0], isCurrentUser: true },
    { rank: 4, name: "rohit_99@gmail.com", points: 45, badge: "🥉 Bronze" },
  ];
  
  // Sort leaderboard by points
  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => b.points - a.points);


  // RENDER UI 
  if (loading) return <div className="text-center mt-10 text-gray-500 font-medium">Loading Impact Analytics...</div>;
  if (!user) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto mt-6 font-sans relative">
      
      {/* Dynamic Style Injection for Single Page Certificate Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body { height: 100% !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
          @page { margin: 1.5cm !important; size: letter portrait !important; }
        }
      `}} />
       
      {/* 1. VOLUNTEER IMPACT VIEW                                                */}
      {role === 'volunteer' && (
        <div className="print:hidden">
          <div className="mb-8 mt-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">My Impact Board 🏆</h1>
            <p className="text-gray-500 font-medium">Track your hours, material contributions, and claim certificates in real-time.</p>
          </div>

          {/* Volunteer Metric Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider opacity-85">Total Score</p>
              <p className="text-3xl font-black mt-1">{volunteerStats.points} XP</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Badge</p>
              <p className="text-xl font-extrabold text-gray-800 mt-1">{volunteerStats.badge}</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Donated</p>
              <p className="text-3xl font-black text-orange-500 mt-1">{volunteerStats.totalHours} <span className="text-sm font-medium text-gray-400">hrs</span></p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items Pledged</p>
              <p className="text-3xl font-black text-purple-600 mt-1">{volunteerStats.totalDonations} <span className="text-sm font-medium text-gray-400">gigs</span></p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            
            {/* History Log */}
            <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Contribution Log 📋</h2>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">You haven't responded to any needs yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {applications.map((app, index) => {
                    // Call helpers to clean up the HTML
                    const typeUI = getGigTypeUI(app.gigType);
                    const statusCss = getStatusUI(app.status);
                    
                    return (
                      <div key={index} className="py-4 flex justify-between items-center gap-4 flex-wrap">
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{app.gigTitle}</h3>
                          <div className="flex gap-2 items-center mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeUI.css}`}>
                              {typeUI.text}
                            </span>
                            <p className="text-xs text-gray-400">NGO: {app.ngoEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusCss}`}>
                            {app.status.toUpperCase()}
                          </span>
                          
                          {app.status === 'accepted' && (
                            <button onClick={() => setActiveCertificate(app)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm transition">
                              Claim Cert 📜
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leaderboard Column */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Top VolunTiers 🔥</h2>
              <div className="flex flex-col gap-3">
                {sortedLeaderboard.map((leader, i) => {
                  // Clean up leaderboard row HTML
                  const rowStyle = getLeaderboardRowStyle(leader.isCurrentUser);
                  const rankColor = getLeaderboardRankColor(i);
                  const nameColor = leader.isCurrentUser ? 'text-emerald-900' : '';
                  const displayName = leader.name.split('@')[0] + (leader.isCurrentUser ? ' (You)' : '');

                  return (
                    <div key={i} className={rowStyle}>
                      <div className="flex items-center gap-3 truncate">
                        <span className={`font-black text-base w-5 ${rankColor}`}>
                          {i + 1}
                        </span>
                        <div className="truncate">
                          <p className={`font-bold text-gray-800 truncate ${nameColor}`}>{displayName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{leader.badge} Tier</p>
                        </div>
                      </div>
                      <div className="text-right font-black text-gray-700 text-xs shrink-0 pl-1">{leader.points} XP</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NGO IMPACT & ANALYTICS VIEW                                          */}
      {role === 'ngo' && (
        <div>
          <div className="mb-8 mt-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Organization Impact Dashboard 📈</h1>
            <p className="text-gray-500 font-medium">Analyze your social campaign reaches, mobilized volunteer counts, and resource collections.</p>
          </div>

          {/* NGO Statistics Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider opacity-85">Total Responses</p>
              <p className="text-3xl font-black mt-1">{ngoStats.totalReceived}</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Review</p>
              <p className="text-3xl font-black text-amber-500 mt-1">{ngoStats.pendingCount}</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Volunteers Secured</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{ngoStats.acceptedServices}</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Material Pledges</p>
              <p className="text-3xl font-black text-purple-600 mt-1">{ngoStats.acceptedResources}</p>
            </div>
          </div>

          {/* Campaign Table for NGOs */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Campaign Performance Log 📊</h2>
            {applications.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No outreach records found. Create standard post requirements on the dashboard to engage your crowd.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase">
                      <th className="py-3 px-2">Campaign Title</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Respondent User</th>
                      <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {applications.map((app, idx) => {
                      // Helpers calling for table UI
                      const typeUI = getGigTypeUI(app.gigType);
                      const statusCss = getStatusUI(app.status);

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5 px-2 font-bold text-gray-800">{app.gigTitle}</td>
                          <td className="py-3.5 px-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeUI.css}`}>
                              {typeUI.text}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-xs font-mono text-gray-500">{app.volunteerEmail}</td>
                          <td className="py-3.5 px-2 text-right">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusCss}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VOLUNTEER CERTIFICATE POPUP MODAL                                    */}
      {activeCertificate && role === 'volunteer' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white border-[12px] border-emerald-800 p-8 max-w-2xl w-full text-center shadow-2xl rounded-sm relative my-auto bg-[radial-gradient(#f0fdf4_1px,transparent_1px)] [background-size:16px_16px] print:border-0 print:shadow-none print:w-full print:mx-auto print:p-0 print:my-0">
            <button onClick={() => setActiveCertificate(null)} className="print:hidden absolute top-3 right-4 font-black text-xl text-gray-400 hover:text-gray-700 transition">✕</button>
            <div className="border-4 border-double border-emerald-700 p-6 flex flex-col items-center print:border-4 print:border-double print:border-emerald-700 print:p-8">
              
              <span className="text-3xl mb-1">🎖️</span>
              <h2 className="text-2xl font-black text-emerald-800 tracking-widest uppercase font-serif">Certificate of Appreciation</h2>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase font-bold mt-1">PROUDLY PRESENTED BY VOLUNTIER PLATFORM</p>
              
              <div className="w-24 h-[2px] bg-emerald-600 my-4"></div>
              
              <p className="text-sm text-gray-500 italic">This appreciation scroll is honorably presented to</p>
              <p className="text-2xl font-black text-gray-800 my-2 underline decoration-emerald-500 underline-offset-4 tracking-wide font-mono">{user.email.split('@')[0]}</p>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed mt-2">for outstanding humanitarian service and dedicated social contribution towards the initiative <span className="font-bold text-gray-900">"{activeCertificate.gigTitle}"</span> under the supervision of authorized organization <span className="font-semibold italic text-emerald-700">{activeCertificate.ngoEmail}</span>.</p>
              
              <div className="flex justify-between w-full mt-8 border-t pt-4 text-xs font-bold text-gray-500">
                <div>
                  <p className="text-emerald-700">Verified System Audit</p>
                  <p className="text-[10px] font-mono font-medium text-gray-400 mt-0.5">ID: {activeCertificate.gigId?.substring(0,8).toUpperCase() || "VTR-9981A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-700">Type Authorization</p>
                  {/* Clean text called from helper function */}
                  <p className="text-emerald-600 text-[10px] uppercase">
                    {getCertificateTypeText(activeCertificate.gigType)}
                  </p>
                </div>
              </div>

            </div>
            <button onClick={() => window.print()} className="print:hidden mt-5 bg-emerald-800 text-white font-bold text-xs px-5 py-2 rounded shadow hover:bg-emerald-900 transition mx-auto block">Print Certificate 🖨️</button>
          </div>
        </div>
      )}

      {/* Fallback Safety View hai yeh */}
      {role === 'no-role' && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-yellow-800">
          ⚠️ Your profile role configuration was not found. Please re-login.
        </div>
      )}
    </div>
  );
}