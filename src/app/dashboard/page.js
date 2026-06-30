"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  //  STATE VARIABLES 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('service'); 

  const [gigs, setGigs] = useState([]);
  const [appliedGigs, setAppliedGigs] = useState([]); 
  const [ngoApplications, setNgoApplications] = useState([]);

  //  DATABASE FUNCTIONS 

  const fetchGigs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "gigs"));
      const gigsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGigs(gigsData);
    } catch (error) {
      console.error("Error fetching gigs: ", error);
    }
  };

  const fetchVolunteerApplications = async (volunteerEmail) => {
    try {
      const q = query(collection(db, "applications"), where("volunteerEmail", "==", volunteerEmail));
      const querySnapshot = await getDocs(q);
      const alreadyAppliedIds = querySnapshot.docs.map(doc => doc.data().gigId);
      setAppliedGigs(alreadyAppliedIds);
    } catch (error) {
      console.error("Error fetching volunteer applications: ", error);
    }
  };

  const fetchNGOApplications = async (ngoEmail) => {
    try {
      const cleanEmail = ngoEmail.trim().toLowerCase();
      const q = query(collection(db, "applications"), where("ngoEmail", "==", cleanEmail));
      const querySnapshot = await getDocs(q);
      
      const appsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNgoApplications(appsData);
    } catch (error) {
      console.error("Error fetching NGO applications: ", error);
    }
  };

  //  AUTHENTICATION HOOK 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Database se user ka document nikalo
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const dbData = userDoc.data(); //  Pura database record nikal liya isne
          
          setRole(dbData.role);
          setUserData(dbData); //  State mein Name, Phone, Email sab save hojayega
          
          if (dbData.role === 'volunteer') {
            await fetchGigs();
            await fetchVolunteerApplications(currentUser.email);
          } else if (dbData.role === 'ngo') {
            await fetchNGOApplications(currentUser.email);
          }
        } else {
          setRole('no-role');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  //  ACTION HANDLERS

  const handlePostGig = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "gigs"), {
        title: title,
        description: description,
        location: location,
        type: type, 
        ngoEmail: user.email.trim().toLowerCase(),
        createdAt: new Date()
      });
      
      let successMessage = "Volunteer Need Posted Successfully!";
      if (type === 'resource') {
        successMessage = "Resource Requirement Posted Successfully!";
      }
      alert(successMessage);
      
      setTitle('');
      setDescription('');
      setLocation('');
      setType('service'); 
      
      fetchNGOApplications(user.email);
    } catch (error) {
      alert("Error posting request: " + error.message);
    }
  };

const handleApply = async (gig) => {
    // 1. Check local state first to prevent unnecessary database calls (Efficiency)
    if (appliedGigs.includes(gig.id)) {
      alert("You have already responded to this request!");
      return;
    }

    try {
      // 2. Call the scalable, modular logic we built in allocation.js
      const response = await allocateVolunteerToTask(gig, user.email, userData);
      
      // 3. Handle the response gracefully without breaking the UI
      if (response.success) {
        alert(response.message);
        setAppliedGigs([...appliedGigs, gig.id]); // Update UI instantly
      } else {
        alert(`Could not complete request: ${response.message}`);
      }
    } catch (error) {
      alert("System Error: " + error.message);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, { status: newStatus });
      alert("Application marked as " + newStatus + "!");
      fetchNGOApplications(user.email); 
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  //  UI HELPER VARIABLES & FUNCTIONS 
  const totalHours = appliedGigs.length * 4; 
  const progressPercent = Math.min((totalHours / 40) * 100, 100);
  
  let hoursLeft = 40 - totalHours;
  if (hoursLeft < 0) hoursLeft = 0;

  let currentTier = "🥉 Bronze Tier";
  if (totalHours >= 24) {
    currentTier = "🥈 Silver Tier";
  }

  let titlePlaceholder = "Gig Title (e.g., Teach Math to Kids)";
  let descPlaceholder = "Describe what the volunteers will do...";
  let locPlaceholder = "Event Location Address";

  if (type === 'resource') {
    titlePlaceholder = "Supply Title (e.g., Requirement of 20 Storybooks)";
    descPlaceholder = "List the items, condition required (old/new), or quantity details...";
    locPlaceholder = "Drop-off Address / Collection Center";
  }

  const getStatusBadgeStyle = (status) => {
    if (status === 'accepted') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800'; 
  };

  const getGigButtonStyle = (gigId, gigType) => {
    if (appliedGigs.includes(gigId)) {
      return { css: "bg-gray-100 text-gray-400 cursor-not-allowed", text: "Applied / Pledged ✅" };
    }
    if (gigType === 'resource') {
      return { css: "bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white", text: "Provide Resources 📦" };
    }
    return { css: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white", text: "Sign Up Now ⚡" };
  };

  //  RENDER UI 

  if (loading) return <div className="text-center mt-10">Loading your profile...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen text-gray-800 font-sans p-6 md:p-10 max-w-5xl mx-auto">
      
      {/* Navbar / Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome back!</h1>
          {/* NAYA: Yahan ab User ka Name aayega (agar hoga toh), warna email */}
          <p className="text-sm text-gray-500 font-semibold">{userData?.name || user?.email} ({role?.toUpperCase()})</p>
        </div>
        <button 
          onClick={() => auth.signOut()} 
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-semibold hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>
      
      {/*  VOLUNTEER DASHBOARD */}
      {role === 'volunteer' && (
        <>
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-sm font-semibold uppercase text-gray-400 tracking-wider">Current Status</p>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {currentTier}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-emerald-500">{totalHours} <span className="text-lg text-gray-400 font-medium">hrs</span></p>
                <p className="text-xs text-gray-400">Total Contributed</p>
              </div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{hoursLeft} hours</span> away from next milestone tier.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended for You</h3>
            {gigs.length === 0 ? (
              <p className="text-gray-500 bg-white p-6 text-center border rounded-xl shadow-sm">No requests available right now. Check back later!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gigs.map((gig) => {
                  const buttonUI = getGigButtonStyle(gig.id, gig.type);
                  let badgeCss = "bg-orange-100 text-orange-600";
                  let badgeText = "⚡ Service Need";
                  
                  if (gig.type === 'resource') {
                    badgeCss = "bg-purple-100 text-purple-700";
                    badgeText = "📦 Material Supply";
                  }

                  let locationText = "Location: " + gig.location;
                  if (gig.type === 'resource') locationText = "Drop-off: " + gig.location;

                  return (
                    <div key={gig.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeCss}`}>{badgeText}</span>
                          <span className="text-sm font-semibold text-emerald-600">+4 hours</span>
                        </div>
                        <h4 className="font-bold text-lg text-gray-800 mb-1">{gig.title}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{gig.description}</p>
                        <p className="text-xs font-semibold text-gray-400 mb-4">📍 {locationText} | NGO: {gig.ngoEmail}</p>
                      </div>
                      <button 
                        onClick={() => handleApply(gig)}
                        disabled={appliedGigs.includes(gig.id)}
                        className={`w-full font-semibold py-2 rounded-lg transition ${buttonUI.css}`}
                      >
                        {buttonUI.text}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* NGO DASHBOARD  */}
      {role === 'ngo' && (
        <div className="grid gap-8 md:grid-cols-3">
          
          <div className="md:col-span-2 p-6 bg-green-50 border border-green-200 rounded-xl shadow-sm h-fit">
            <h2 className="text-xl font-bold text-green-800 mb-4">Create a Requirement Post</h2>
            <form onSubmit={handlePostGig} className="flex flex-col gap-4">
              <label className="text-xs font-bold text-gray-500 -mb-2">What kind of assistance do you need?</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="p-3 border rounded w-full bg-white font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="service">⚡ Physical Service (Teaching, Animal Care, Cleanup)</option>
                <option value="resource">📦 Material Supplies (Books, Clothes, Food Ration)</option>
              </select>
              <input type="text" placeholder={titlePlaceholder} className="p-3 border rounded w-full bg-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea placeholder={descPlaceholder} className="p-3 border rounded w-full h-24 bg-white" value={description} onChange={(e) => setDescription(e.target.value)} required ></textarea>
              <input type="text" placeholder={locPlaceholder} className="p-3 border rounded w-full bg-white" value={location} onChange={(e) => setLocation(e.target.value)} required />
              <button type="submit" className="bg-green-600 text-white font-bold p-3 rounded hover:bg-green-700 transition">Post Requirement to Board</button>
            </form>
          </div>

          <div className="p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Responses Received 📥</h2>
            {ngoApplications.length === 0 ? (
              <p className="text-sm text-gray-500">No responses received yet. Your posts are live!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ngoApplications.map((app) => {
                  let appTypeText = "⚡ Physical Help";
                  if (app.gigType === 'resource') appTypeText = "📦 Resource Donation";
                  const statusCss = getStatusBadgeStyle(app.status);

                  return (
                    <div key={app.id} className="p-4 bg-gray-50 border rounded-lg text-sm shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-gray-800 mb-0.5">Title: {app.gigTitle}</p>
                        <p className="text-[11px] font-bold text-purple-600 uppercase mb-2">Type: {appTypeText}</p>
                        
                        {/*  Yahan ab Volunteer ka Name, Email, aur Phone dikhega NGO ko */}
                        <div className="bg-white border rounded p-2 mb-3">
                          <p className="font-semibold text-gray-800 text-xs">👤 {app.volunteerName || "Unknown"}</p>
                          <p className="text-gray-500 text-[11px] mb-1">✉️ {app.volunteerEmail}</p>
                          <p className="text-gray-700 text-xs font-bold">📞 {app.volunteerPhone || "Not Provided"}</p>
                        </div>

                        <div className="mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${statusCss}`}>
                            Status: {app.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {app.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleStatusUpdate(app.id, 'accepted')} className="flex-1 bg-green-600 text-white text-xs font-bold py-1.5 px-2 rounded hover:bg-green-700 transition">Accept</button>
                          <button onClick={() => handleStatusUpdate(app.id, 'rejected')} className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 px-2 rounded hover:bg-red-600 transition">Reject</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/*  FALLBACK  */}
      {role === 'no-role' && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-yellow-800">
          ⚠️ Your profile role configuration was not found. Please re-login.
        </div>
      )}
    </div>
  );
}