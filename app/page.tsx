"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Briefcase, MessageSquare, ArrowRight, CheckCircle2, Sparkles, Star, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 bg-black rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CampusLink</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Features
              </Link>
              {user && (
                <>
                  <Link href="/mentorship" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Find Mentors
                  </Link>
                  <Link href="/jobs" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Jobs
                  </Link>
                </>
              )}
              <Link href="#community" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Community
              </Link>
              <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                About
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              {!loading && (
                <>
                  {user ? (
                    <Button asChild size="sm" className="bg-black text-white hover:bg-gray-800 rounded-lg shadow-sm">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="ghost" size="sm" className="text-sm font-medium hover:bg-gray-100">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild size="sm" className="bg-black text-white hover:bg-gray-800 rounded-lg shadow-sm">
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm shadow-sm">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-gray-900 font-medium">4.7 ⭐ on TrustPilot</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-gray-900 tracking-tight">
              Connect with
              <br />
              Alumni &amp;
              <br />
              <span className="text-gray-600">Build Your Career</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
              The first alumni platform that connects you with verified mentors in real-time, 
              giving you accurate career guidance you can count on.
            </p>
            
            <div className="flex gap-4 flex-wrap pt-4">
              <Button size="lg" className="text-base px-8 py-6 bg-black text-white hover:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all">
                Try CampusLink for free
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-full border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <Link href="#contact">
                  Book a demo
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-500 text-white text-sm font-semibold">RS</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">AK</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-linear-to-br from-green-500 to-emerald-500 text-white text-sm font-semibold">MP</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">10,000+</span> students already connected
              </p>
            </div>
          </div>

          {/* Right Content - Chat Interface */}
          <div className="relative lg:h-[650px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-linear-to-br from-lime-200 via-yellow-100 to-orange-100 p-8">
              <div className="relative w-full h-full flex flex-col justify-center gap-6">
                {/* Chat Box */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 space-y-4 max-w-md shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-sm">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">CampusLink AI</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 shadow-sm">
                    Hi! I can help you find verified alumni mentors. What field are you interested in?
                  </div>
                  
                  <div className="bg-gray-900 text-white rounded-2xl p-4 text-sm shadow-md ml-8">
                    Find me software engineers from Google or Microsoft
                  </div>
                  
                  <div className="bg-lime-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 inline-flex items-center gap-2 shadow-sm">
                    <Sparkles className="h-4 w-4 text-lime-600" />
                    <span className="font-medium">Searching alumni...</span>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 max-w-md shadow-2xl border border-white/50">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-16 w-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl overflow-hidden shrink-0 shadow-lg flex items-center justify-center text-2xl">
                      👩‍💼
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Priya Sharma</h3>
                      <p className="text-sm text-gray-600 mb-2">Senior Software Engineer</p>
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified Alumni
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </button>
                    <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                    <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                  </div>
                  
                  <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 flex items-center justify-between border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        <div className="h-8 w-8 bg-purple-500 rounded-full border-2 border-white shadow-sm" />
                        <div className="h-8 w-8 bg-pink-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">+15 more alumni found</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>

                {/* Bottom Badge */}
                <div className="absolute bottom-6 left-6">
                  <div className="bg-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-2.5 border border-gray-100">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-900">AI-Powered Matching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Section */}
      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-500 mb-10 uppercase tracking-wide">
            Trusted by students from leading institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
            <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors">IIT Delhi</div>
            <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors">BITS Pilani</div>
            <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors">NIT Trichy</div>
            <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors">VIT</div>
            <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors">IIIT</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-24" id="features">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Feature 1 - Verified Network */}
          <Card className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl p-8 lg:p-12 rounded-3xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Verified college network</h3>
                <p className="text-lg text-gray-600">Connect only with verified students and alumni from your institution through ID-based authentication.</p>
              </div>
              
              {/* Verification Visualization */}
              <div className="relative h-64 flex items-center justify-center pt-8">
                <div className="relative">
                  {/* Center verified badge */}
                  <div className="relative z-10 w-32 h-32 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <CheckCircle2 className="h-16 w-16 text-white" />
                  </div>
                  
                  {/* Surrounding profile circles */}
                  <div className="absolute -top-8 -left-8 w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    👨‍🎓
                  </div>
                  <div className="absolute -top-8 -right-8 w-16 h-16 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    👩‍💼
                  </div>
                  <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    🎓
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-linear-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    👨‍💻
                  </div>
                  
                  {/* Connection lines */}
                  <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-200 rounded-full opacity-50"></div>
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-100 rounded-full opacity-30"></div>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800 font-medium">✓ Admin-verified ID cards • Secure authentication • Trusted community</p>
              </div>
            </div>
          </Card>

          {/* Feature 2 - Career Growth */}
          <Card className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl p-8 lg:p-12 rounded-3xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Accelerate your career</h3>
                <p className="text-lg text-gray-600">Access exclusive job postings, internships, and referrals from your alumni network.</p>
              </div>
              
              {/* Job Growth Visualization */}
              <div className="relative h-64 flex items-end justify-center gap-3 pt-12">
                {[
                  { height: '45%', label: 'Jan' },
                  { height: '52%', label: 'Feb' },
                  { height: '58%', label: 'Mar' },
                  { height: '70%', label: 'Apr' },
                  { height: '75%', label: 'May' },
                  { height: '88%', label: 'Jun' },
                  { height: '100%', label: 'Jul' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end" style={{ height: '200px' }}>
                      <div className="w-full rounded-t-xl overflow-hidden shadow-lg relative" style={{ height: bar.height }}>
                        <div className="absolute inset-0 bg-linear-to-t from-indigo-600 to-indigo-400"></div>
                        <div className="absolute inset-0 bg-linear-to-t from-indigo-300 to-indigo-100 opacity-40"></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{bar.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-xs text-gray-600">Job Posts</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-900">1.2k+</div>
                  <div className="text-xs text-gray-600">Referrals</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-900">85%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature 3 - Real-time Mentorship */}
          <Card className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl p-8 lg:p-12 rounded-3xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Connect with mentors instantly</h3>
                <p className="text-lg text-gray-600">Real-time chat and mentorship requests with verified alumni who can guide your career path.</p>
              </div>
              
              {/* Chat Interface Mockup */}
              <div className="relative h-64 bg-white rounded-2xl border-2 border-gray-200 p-6 overflow-hidden">
                <div className="space-y-4">
                  {/* Mentor Profile Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                      AS
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Ankit Sharma</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Senior SDE @ Google
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-gray-800">Hi! I'd love guidance on breaking into product roles</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <div className="bg-indigo-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-white">Happy to help! Let's discuss your background first.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-gray-800">I'm in 3rd year CS, interned at a startup...</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notification Badge */}
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  3 new
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <span className="text-gray-600 font-medium">Instant messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 font-medium">1-on-1 sessions</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature 4 - Role-Based Platform */}
          <Card className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl p-8 lg:p-12 rounded-3xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Built for every role</h3>
                <p className="text-lg text-gray-600">Tailored experiences for students, alumni, aspirants, and college administrators.</p>
              </div>
              
              {/* Role Cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎓', label: 'Students', color: 'from-blue-500 to-indigo-500', desc: 'Find mentors & jobs' },
                  { icon: '�‍💼', label: 'Alumni', color: 'from-purple-500 to-pink-500', desc: 'Guide & refer' },
                  { icon: '🌟', label: 'Aspirants', color: 'from-indigo-500 to-purple-500', desc: 'Pre-admission help' },
                  { icon: '�️', label: 'Admins', color: 'from-gray-700 to-gray-900', desc: 'Verify & manage' },
                ].map((role, idx) => (
                  <div
                    key={idx}
                    className="relative p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
                  >
                    <div className={`w-12 h-12 bg-linear-to-br ${role.color} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                      {role.icon}
                    </div>
                    <div className="font-bold text-gray-900 mb-1">{role.label}</div>
                    <div className="text-sm text-gray-600">{role.desc}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-indigo-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Personalized dashboards • Custom workflows • Admin verification system
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>


      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24" id="community">
        <div className="bg-linear-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-12 md:p-20 text-center text-white shadow-2xl border border-gray-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">Ready to Get Started?</h2>
            <p className="text-xl md:text-2xl mb-12 text-gray-300 leading-relaxed">
              Join thousands of students, alumni, and aspirants building meaningful connections and advancing their careers
            </p>
            <Button asChild size="lg" className="text-lg px-10 py-7 bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-xl hover:shadow-2xl transition-all font-semibold">
              <Link href="/signup">
                Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg font-bold text-white">CampusLink</span>
            </Link>

            {/* Copyright */}
            <p className="text-sm text-gray-500">
              Copyright 2025© CampusLink
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}