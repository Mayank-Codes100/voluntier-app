# VolunTier ⚡
> A smart, unified local directory platform connecting NGOs with volunteers and resources intelligently.

**Team Name:** Console.loggers
**Team ID:** 859O6B
**Theme Track Code:** #EDTECH-SOCIAL-IMPACT
**PS REF:** #EDTECH-PS2 [BEGINNER]

---

## 🚨 Problem Statement and Solution Overview

**The Problem:**
Non-profit organizations (NGOs) constantly struggle to find reliable volunteers and necessary supplies to keep their operations running smoothly. Simultaneously, passionate individuals and potential volunteers struggle to find authentic, local NGOs where they can contribute their time and resources effectively. There is a massive communication and visibility gap in the community aid ecosystem.

**The Solution (Community Aid Bridge):**
VolunTier bridges this gap with a smart matching system. We provide a single directory platform with two powerful perspectives:
1. **For NGOs:** A streamlined dashboard to post real-time needs (both services and material assets).
2. **For Volunteers:** A gamified discovery portal to find local opportunities, contribute, and earn XP points. As volunteers help, they level up their dynamic tier rankings and earn official printable scroll certificates.

---

## 💻 Tech Stack
* **Frontend:** Next.js, React.js, Tailwind CSS
* **Backend & Database:** Firebase (Authentication & Firestore)
* **Deployment & Hosting:** Vercel
* **Version Control:** Git, GitHub

---

## ⚙️ Core Architecture: Scalable Allocation Logic
To ensure the platform is robust, modular, and ready for real-world scaling, we designed a dedicated backend allocation controller (`src/lib/allocation.js`) rather than handling logic directly inside UI components.

### Handling Real-World Scenarios & Edge Cases
When multiple volunteers attempt to claim the final open slot for an NGO requirement at the exact same time, a standard database write would result in over-booking. 

To solve this concurrency issue, our system utilizes **Firestore Transactions**:
1. **Atomic Reads/Writes:** The database locks the document, checks current capacity, and writes the new volunteer data in one single, unbreakable motion.
2. **Double-Booking Prevention:** If a user tries to apply twice, or if the requirement reaches maximum capacity exactly as they click 'Apply', the transaction safely aborts and alerts the user gracefully on the frontend.
3. **Separation of Concerns:** The UI layer (`Dashboard.js`) only handles state and user feedback, while the `allocation.js` module handles all database integrity and business rules.

### Key Assumptions
* **MVP Scope:** We assume all NGOs and volunteers operate within the same general timezone for this iteration.
* **Manual Verification:** Currently, NGOs manually mark a volunteer's application as "Accepted" or "Rejected" upon reviewing their profile. Automatic allocation based on proximity or skill-matching is scoped for V2.
* **Open Tiering:** All volunteers start at the Bronze tier and can immediately apply for any standard service gig without prerequisite screening.

---
live link of website->   https://voluntier-app-tawny.vercel.app/


​🤖 AI Tools Disclosure Table 
AI Tool UsedPurpose / Task Performed
Google Gemini Assisted with Next.js logic, Firebase integration, deployment debugging on Vercel, and terminal error resolution Link to Tool -> .gemini.google.com

👥 Team Members and Roles
​Mayank Saini - Lead Full Stack Developer (Next.js UI/UX implementation, Firebase Integration, and Vercel Deployment)
Kuldeep Morane - testing and helping in UI.
