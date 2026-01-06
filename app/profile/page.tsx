"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { getUserProfile, updateUserProfile } from "@/lib/firebase/profiles";
import { getUserData } from "@/lib/firebase/auth";
import { handleError } from "@/lib/utils/error-handling";
import { useEffect, useState } from "react";
import { User, UserProfile } from "@/types";
import { 
  Camera, Upload as UploadIcon, Key, Edit2, MapPin, Briefcase, 
  GraduationCap, Mail, Phone, Calendar, Link2, Github, Linkedin, 
  Instagram, Globe, CheckCircle2, Award, Target, TrendingUp, User as UserIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { uploadToImgBB } from "@/lib/upload/imgbb";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function ProfilePage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const { toast } = useToast();
  const [userData, setUserData] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    college: "",
    graduationYear: "",
    course: "",
    specialization: "",
    currentCompany: "",
    jobTitle: "",
    experience: "",
    location: "",
    bio: "",
    skills: "",
    linkedIn: "",
    github: "",
    instagram: "",
    portfolio: "",
  });

  useEffect(() => {
    if (user) {
      Promise.all([getUserData(user.uid), getUserProfile(user.uid)]).then(([userDataResult, profileData]) => {
        setUserData(userDataResult);
        setProfile(profileData);
        
        const photoURL = userDataResult?.photoURL || profileData?.photoURL || "";
        setProfilePhotoPreview(photoURL);
        
        if (profileData) {
          setFormData({
            college: profileData.college || "",
            graduationYear: profileData.graduationYear?.toString() || "",
            course: profileData.course || "",
            specialization: profileData.specialization || "",
            currentCompany: profileData.currentCompany || "",
            jobTitle: profileData.jobTitle || "",
            experience: profileData.experience?.toString() || "",
            location: profileData.location || "",
            bio: profileData.bio || "",
            skills: profileData.skills?.join(", ") || "",
            linkedIn: profileData.linkedIn || "",
            github: profileData.github || "",
            instagram: profileData.instagram || "",
            portfolio: profileData.portfolio || "",
          });
        }
        setLoading(false);
      });
    }
  }, [user]);

  const calculateProfileStrength = () => {
    if (!profile || !userData) return { percentage: 0, completed: 0, total: 0, sections: [] };

    const role = userData.role || 'student';
    
    // Helper function to check if a value is filled
    const isFilled = (value: unknown): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value > 0;
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    };

    type FieldItem = { value: unknown; label: string };
    type Section = { name: string; fields: FieldItem[]; weight: number };
    
    // Define sections based on user role
    const baseSections: Section[] = [
      { 
        name: "Basic Info", 
        fields: [
          { value: userData.displayName, label: "Name" },
          { value: userData.email, label: "Email" },
          { value: profile.location, label: "Location" },
          { value: userData.photoURL || profile.photoURL, label: "Photo" }
        ], 
        weight: 20 
      },
      { 
        name: "About", 
        fields: [
          { value: profile.bio, label: "Bio" }
        ], 
        weight: 15 
      },
      { 
        name: "Skills", 
        fields: [
          { value: profile.skills, label: "Skills" }
        ], 
        weight: 15 
      },
      { 
        name: "Social Links", 
        fields: [
          { value: profile.linkedIn, label: "LinkedIn" },
          { value: profile.github, label: "GitHub" },
          { value: profile.portfolio || profile.instagram, label: "Portfolio/Instagram" }
        ], 
        weight: 10 
      },
    ];

    // Add role-specific sections
    const sections: Section[] = [...baseSections];

    if (role === 'student' || role === 'alumni') {
      sections.push({ 
        name: "Academic", 
        fields: [
          { value: profile.college, label: "College" },
          { value: profile.course, label: "Degree/Course" },
          { value: profile.graduationYear, label: "Graduation Year" },
          { value: profile.specialization, label: "Specialization" }
        ], 
        weight: 25 
      });
    }

    if (role === 'alumni' || role === 'mentor') {
      sections.push({ 
        name: "Professional", 
        fields: [
          { value: profile.currentCompany, label: "Company" },
          { value: profile.jobTitle, label: "Job Title" },
          { value: profile.experience, label: "Experience" }
        ], 
        weight: 15 
      });
    }

    if (role === 'aspirant') {
      // Aspirants have lighter requirements - college info optional
      sections.push({ 
        name: "Interests", 
        fields: [
          { value: profile.interests, label: "Interests" },
          { value: profile.college, label: "Target College (Optional)" }
        ], 
        weight: 15 
      });
    }

    // Calculate weights dynamically to ensure they sum to 100
    const totalConfiguredWeight = sections.reduce((sum, s) => sum + s.weight, 0);
    const weightMultiplier = 100 / totalConfiguredWeight;

    let completedWeight = 0;
    let completedCount = 0;
    let totalCount = 0;

    const sectionDetails = sections.map(section => {
      const filledFields = section.fields.filter(f => isFilled(f.value)).length;
      const totalFields = section.fields.length;
      const adjustedWeight = section.weight * weightMultiplier;
      
      totalCount += totalFields;
      completedCount += filledFields;
      
      // Calculate weighted completion for this section
      const sectionCompletion = totalFields > 0 ? (filledFields / totalFields) : 0;
      completedWeight += sectionCompletion * adjustedWeight;

      return {
        name: section.name,
        completed: filledFields,
        total: totalFields,
        percentage: Math.round(sectionCompletion * 100),
        weight: Math.round(adjustedWeight),
        isComplete: filledFields === totalFields
      };
    });

    return {
      percentage: Math.round(completedWeight),
      completed: completedCount,
      total: totalCount,
      sections: sectionDetails
    };
  };

  const getStrengthColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-blue-600";
    if (percentage >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  // Helper function to ensure URLs have https:// prefix
  const formatUrl = (url: string, defaultDomain?: string): string => {
    if (!url) return "";
    // If it's just a username (no dots or slashes), construct full URL
    if (defaultDomain && !url.includes('.') && !url.includes('/')) {
      return `https://${defaultDomain}/${url}`;
    }
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const getStrengthBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100";
    if (percentage >= 50) return "bg-blue-100";
    if (percentage >= 30) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getStrengthLabel = (percentage: number) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 75) return "Strong";
    if (percentage >= 50) return "Good";
    if (percentage >= 25) return "Fair";
    return "Weak";
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 5MB", variant: "destructive" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const imageUrl = await uploadToImgBB(file);
      
      // Update profile collection
      await updateUserProfile(user!.uid, { photoURL: imageUrl });
      
      // Also update the users collection
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      const { updateProfile } = await import("firebase/auth");
      
      if (db) {
        await updateDoc(doc(db, "users", user!.uid), {
          photoURL: imageUrl,
          updatedAt: serverTimestamp(),
        });
      }
      
      // Update Firebase Auth profile
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: imageUrl });
      }
      
      setProfilePhotoPreview(imageUrl);
      
      // Refresh user data from both collections
      const [updatedUser, updatedProfile] = await Promise.all([
        getUserData(user!.uid),
        getUserProfile(user!.uid)
      ]);
      setUserData(updatedUser);
      setProfile(updatedProfile);
      
      toast({ title: "Success!", description: "Profile photo updated successfully" });
    } catch (error) {
      handleError(error, "Failed to upload photo");
      toast({ title: "Error", description: "Failed to upload photo. Please try again.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth?.currentUser;
    if (!user || !currentUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordData.newPassword);
      
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Success!", description: "Password changed successfully" });
    } catch (error: any) {
      let errorMessage = "Failed to change password. ";
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage += "Current password is incorrect.";
      } else if (error.code === "auth/weak-password") {
        errorMessage += "New password is too weak.";
      } else {
        errorMessage += "Please try again.";
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        college: formData.college || undefined,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        course: formData.course || undefined,
        specialization: formData.specialization || undefined,
        currentCompany: formData.currentCompany || undefined,
        jobTitle: formData.jobTitle || undefined,
        experience: formData.experience ? parseFloat(formData.experience) : undefined,
        location: formData.location || undefined,
        bio: formData.bio || undefined,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(s => s) : undefined,
        linkedIn: formData.linkedIn || undefined,
        github: formData.github || undefined,
        instagram: formData.instagram || undefined,
        portfolio: formData.portfolio || undefined,
      });
      const updatedProfile = await getUserProfile(user.uid);
      setProfile(updatedProfile);
      toast({ title: "Success!", description: "Profile updated successfully" });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Loading profile..." />
        </div>
      </MainLayout>
    );
  }

  const profileStrength = calculateProfileStrength();

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="outline" icon={<Key className="h-4 w-4" />} className="rounded-xl border-2 hover:bg-gray-50">
                  Change Password
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">Change Password</DialogTitle>
                      <DialogDescription>Update your account password</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="font-semibold">Current Password</Label>
                    <Input 
                      id="currentPassword"
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="font-semibold">New Password</Label>
                    <Input 
                      id="newPassword"
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-semibold">Confirm Password</Label>
                    <Input 
                      id="confirmPassword"
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <ActionButton 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg" 
                    loading={changingPassword}
                  >
                    Update Password
                  </ActionButton>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="primary" icon={<Edit2 className="h-4 w-4" />} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                  Edit Profile
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Edit2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
                      <DialogDescription>Update your information</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="relative group">
                      {userData?.photoURL || profilePhotoPreview ? (
                        <img 
                          src={userData?.photoURL || profilePhotoPreview} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-xl object-cover ring-4 ring-white shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="profile-photo-dialog" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 w-fit transition-all shadow-lg">
                          <UploadIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Upload Photo</span>
                        </div>
                      </Label>
                      <input
                        id="profile-photo-dialog"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB</p>
                    </div>
                  </div>


                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                          value={formData.location} 
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                          placeholder="City, Country" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea 
                          value={formData.bio} 
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                          placeholder="Tell us about yourself"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Info */}
                  {(userData?.role === "student" || userData?.role === "alumni") && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Academic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>College/University</Label>
                          <Input 
                            value={formData.college} 
                            onChange={(e) => setFormData({ ...formData, college: e.target.value })} 
                            placeholder="Your institution"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Degree/Course</Label>
                          <Input 
                            value={formData.course} 
                            onChange={(e) => setFormData({ ...formData, course: e.target.value })} 
                            placeholder="B.Tech, MBA, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Specialization</Label>
                          <Input 
                            value={formData.specialization} 
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} 
                            placeholder="Computer Science, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Graduation Year</Label>
                          <Input 
                            value={formData.graduationYear} 
                            onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })} 
                            placeholder="2025"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Info */}
                  {userData?.role === "alumni" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Professional Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input 
                            value={formData.currentCompany} 
                            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })} 
                            placeholder="Current company"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input 
                            value={formData.jobTitle} 
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} 
                            placeholder="Your position"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Experience (years)</Label>
                          <Input 
                            type="number"
                            value={formData.experience} 
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <Input 
                      value={formData.skills} 
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })} 
                      placeholder="JavaScript, React, Node.js (comma separated)"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Social Links</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input 
                          value={formData.linkedIn} 
                          onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })} 
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GitHub</Label>
                        <Input 
                          value={formData.github} 
                          onChange={(e) => setFormData({ ...formData, github: e.target.value })} 
                          placeholder="github.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Portfolio</Label>
                        <Input 
                          value={formData.portfolio} 
                          onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })} 
                          placeholder="yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input 
                          value={formData.instagram} 
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} 
                          placeholder="instagram.com/username"
                        />
                      </div>
                    </div>
                  </div>

                  <ActionButton type="submit" className="w-full" loading={saving}>
                    Save Changes
                  </ActionButton>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Profile Strength Card - Google Material Design Style */}
        <Card className="border-none shadow-xl hover:shadow-2xl transition-shadow rounded-2xl overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Profile Strength</h2>
                <p className="text-sm text-gray-600">Complete your profile to improve visibility</p>
              </div>
              <div className={`px-5 py-2.5 rounded-full ${getStrengthBgColor(profileStrength.percentage)} shadow-sm`}>
                <span className={`text-lg font-bold ${getStrengthColor(profileStrength.percentage)}`}>
                  {getStrengthLabel(profileStrength.percentage)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-gray-900">{profileStrength.percentage}%</span>
                <span className="text-sm text-gray-600">
                  {profileStrength.completed} of {profileStrength.total} fields completed
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${profileStrength.percentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profileStrength.sections.map((section, index) => (
                <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition-all border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{section.name}</span>
                    {section.isComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all" 
                        style={{ width: `${section.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{section.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {section.completed}/{section.total} filled
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group mb-5">
                    {userData?.photoURL || profilePhotoPreview ? (
                      <img 
                        src={userData?.photoURL || profilePhotoPreview} 
                        alt="Profile" 
                        className="w-36 h-36 rounded-2xl object-cover ring-4 ring-gray-100 shadow-xl"
                      />
                    ) : (
                      <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                        {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <label 
                      htmlFor="profile-photo-upload" 
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                    >
                      <Camera className="h-10 w-10 text-white" />
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                        <LoadingSpinner size="md" />
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {userData?.displayName || "User"}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "Student"}
                  </p>
                  
                  <Badge 
                    variant={
                      userData?.verificationStatus === "approved" ? "default" : 
                      userData?.verificationStatus === "pending" ? "secondary" : 
                      "destructive"
                    }
                    className={`mb-5 px-4 py-1.5 rounded-full ${
                      userData?.verificationStatus === "approved" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none" :
                      userData?.verificationStatus === "pending" ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none" :
                      ""
                    }`}
                  >
                    {userData?.verificationStatus === "approved" ? "✓ Verified" : 
                     userData?.verificationStatus === "pending" ? "⏳ Pending" : 
                     "✗ Unverified"}
                  </Badge>
                </div>

                <div className="space-y-4 mt-6">
                  {user?.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 break-all">{user.email}</span>
                    </div>
                  )}
                  {userData?.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{userData.phoneNumber}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{profile.location}</span>
                    </div>
                  )}
                  {userData?.createdAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        Joined {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(profile?.linkedIn || profile?.github || profile?.portfolio || profile?.instagram) && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Connect</h3>
                    <div className="flex gap-3 flex-wrap">
                      {profile.linkedIn && (
                        <a href={formatUrl(profile.linkedIn, 'linkedin.com/in')} target="_blank" rel="noopener noreferrer" 
                           className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md">
                          <Linkedin className="h-5 w-5 text-blue-600" />
                        </a>
                      )}
                      {profile.github && (
                        <a href={formatUrl(profile.github, 'github.com')} target="_blank" rel="noopener noreferrer"
                           className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md">
                          <Github className="h-5 w-5 text-gray-700" />
                        </a>
                      )}
                      {profile.portfolio && (
                        <a href={formatUrl(profile.portfolio)} target="_blank" rel="noopener noreferrer"
                           className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all shadow-sm hover:shadow-md">
                          <Globe className="h-5 w-5 text-purple-600" />
                        </a>
                      )}
                      {profile.instagram && (
                        <a href={formatUrl(profile.instagram, 'instagram.com')} target="_blank" rel="noopener noreferrer"
                           className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 transition-all shadow-sm hover:shadow-md">
                          <Instagram className="h-5 w-5 text-pink-600" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile?.bio && (
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">About</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Academic Info */}
            {(userData?.role === "student" || userData?.role === "alumni") && (
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Academic Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {profile?.college && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">College</p>
                        <p className="font-medium text-gray-900">{profile.college}</p>
                      </div>
                    )}
                    {profile?.course && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Degree</p>
                        <p className="font-medium text-gray-900">{profile.course}</p>
                      </div>
                    )}
                    {profile?.specialization && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Specialization</p>
                        <p className="font-medium text-gray-900">{profile.specialization}</p>
                      </div>
                    )}
                    {profile?.graduationYear && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Graduation Year</p>
                        <p className="font-medium text-gray-900">{profile.graduationYear}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Info */}
            {userData?.role === "alumni" && (
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Professional Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {profile?.currentCompany && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Company</p>
                        <p className="font-medium text-gray-900">{profile.currentCompany}</p>
                      </div>
                    )}
                    {profile?.jobTitle && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Job Title</p>
                        <p className="font-medium text-gray-900">{profile.jobTitle}</p>
                      </div>
                    )}
                    {profile?.experience && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Experience</p>
                        <p className="font-medium text-gray-900">{profile.experience} years</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-medium border-none hover:shadow-md transition-shadow">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
