# 🧠 CampusLink – Project Context

## 🎯 Overview
**CampusLink** is a role-based mentorship and career guidance platform built for **Indian colleges**.  
It connects **students, alumni, and aspirants** within a verified ecosystem, ensuring authentic networking, structured mentorship, and institutional engagement.

The system helps colleges build their own **trusted mentorship networks**, enabling real conversations, verified profiles, and guided career growth — all within a secure and modern web platform.

---

## 🚨 Problem Context
Students and aspirants from Tier-2 and Tier-3 institutions often:
- Lack access to verified mentors and career advisors.  
- Depend on generic, unverified platforms (LinkedIn, WhatsApp groups).  
- Miss direct communication channels with their alumni network.  
- Have no digital verification or tracking for mentorship activities.  

**CampusLink** solves this by creating a **college-centric, verified platform** where mentorship, job sharing, and networking are secure and structured.

---

## 💡 Core Idea
To design a **SaaS-based mentorship system** that enables:
- **Verified registration** for all user types (Student, Alumni, Aspirant).  
- **Admin-based approval** through ID card verification.  
- **Personalized onboarding** to collect user academic data and interests.  
- **Direct mentorship, chat, and referral sharing** within each college network.  

---

## 👥 Target Users
| Role | Description |
|------|--------------|
| **Admin** | Verifies student/alumni ID cards, manages access, and maintains institutional integrity. |
| **Student** | Requests mentorship, chats with alumni, and accesses verified job/referral listings. |
| **Alumni** | Provides mentorship, posts job/internship openings, and guides students. |
| **Aspirant** | Seeks pre-admission guidance from students and alumni. |

---

## 🧩 Core Modules
1. **Authentication & Role Management** – Firebase Auth with role-based access (Student, Alumni, Aspirant, Admin).  
2. **Onboarding System** – Fetches user details (department, skills, interests, goals) after registration.  
3. **Admin Verification** – ID card upload and approval system for verified user access.  
4. **Profile Management** – Editable profiles showcasing academic and career data.  
5. **Mentorship Requests** – Students or aspirants can connect with verified mentors.  
6. **Chat Interface** – Real-time communication via Firebase Firestore or WhatsApp API.  
7. **Job/Referral Posting** – Alumni can post internships, jobs, or referral links.  
8. **Notifications** – Email and WhatsApp updates via Resend & Twilio integrations.  

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js + Tailwind CSS + Shadcn/UI |
| **Backend** | Firebase (Firestore + Realtime Database) |
| **Auth** | Firebase Authentication (Role-Based) |
| **Notifications** | Twilio (WhatsApp API), Resend (Email) |
| **Hosting** | Vercel / Firebase Hosting |

---

## 🔐 Key Features
- Role-based access control (Admin / Student / Alumni / Aspirant)  
- Secure authentication & ID-based verification  
- Onboarding data collection for personalized recommendations  
- Real-time chat system  
- Automated notifications and reminders  
- Clean, modern UI with responsive layout (Shadcn + Tailwind)  

---

## 🚀 Outcome
**CampusLink** creates a verified digital bridge between students, alumni, and aspirants — transforming mentorship into a **trusted, data-driven, and community-powered experience**.

---