"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { createJobPosting } from "@/lib/firebase/jobs";
import { handleError } from "@/lib/utils/error-handling";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Send, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Sparkles,
  FileText,
  Tag,
  Gift,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Job title & company details", icon: Briefcase },
  { id: 2, title: "Location & Type", description: "Work arrangement details", icon: MapPin },
  { id: 3, title: "Requirements", description: "Skills & qualifications", icon: Target },
  { id: 4, title: "Compensation", description: "Salary & benefits", icon: DollarSign },
  { id: 5, title: "Review", description: "Final review & post", icon: CheckCircle },
];

const JOB_TYPES = [
  { value: "full-time", label: "Full-time", icon: Clock, description: "Permanent position with full hours" },
  { value: "part-time", label: "Part-time", icon: Clock, description: "Reduced hours or flexible schedule" },
  { value: "contract", label: "Contract", icon: FileText, description: "Fixed-term engagement" },
  { value: "internship", label: "Internship", icon: Users, description: "Training opportunity for students" },
];

export default function CreateJobPage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    workMode: "onsite" as "onsite" | "remote" | "hybrid",
    type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    salaryMin: "",
    salaryMax: "",
    currency: "INR",
    description: "",
    requirements: [] as string[],
    skills: [] as string[],
    deadline: "",
    isReferral: false,
    referralDetails: "",
  });

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Parse salary range if provided
      let salaryObj = undefined;
      if (formData.salaryMin || formData.salaryMax) {
        salaryObj = {
          min: parseInt(formData.salaryMin) || 0,
          max: parseInt(formData.salaryMax) || 0,
          currency: formData.currency,
        };
      }

      // Parse deadline to timestamp
      const deadlineDate = new Date(formData.deadline);
      const deadlineTimestamp = {
        seconds: Math.floor(deadlineDate.getTime() / 1000),
        nanoseconds: 0,
      };

      await createJobPosting(user.uid, {
        title: formData.title,
        company: formData.company,
        location: `${formData.location} (${formData.workMode === "remote" ? "Remote" : formData.workMode === "hybrid" ? "Hybrid" : "On-site"})`,
        type: formData.type,
        salary: salaryObj,
        description: formData.description,
        requirements: formData.requirements,
        skills: formData.skills,
        deadline: deadlineTimestamp,
        isReferral: formData.isReferral,
        referralDetails: formData.referralDetails,
        status: "active",
      } as any);

      router.push("/jobs/my-posts?success=true");
    } catch (error) {
      handleError(error, "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      handleChange("skills", [...formData.skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    handleChange("skills", formData.skills.filter((s) => s !== skill));
  };

  const addRequirement = () => {
    handleChange("requirements", [...formData.requirements, ""]);
  };

  const updateRequirement = (index: number, value: string) => {
    const newReqs = [...formData.requirements];
    newReqs[index] = value;
    handleChange("requirements", newReqs);
  };

  const removeRequirement = (index: number) => {
    handleChange("requirements", formData.requirements.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.company.trim();
      case 2:
        return formData.location.trim() && formData.type;
      case 3:
        return formData.description.trim();
      case 4:
        return formData.deadline;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-3 sm:mb-4">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Post a New Opportunity</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2">Create Job Posting</h1>
            <p className="text-emerald-100 max-w-lg text-sm sm:text-base">
              Share exciting opportunities with talented students and alumni in your network
            </p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 sm:top-6 left-0 right-0 h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    disabled={step.id > currentStep}
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1 sm:gap-2 transition-all",
                      step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                      isCompleted
                        ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                        : isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 sm:ring-4 ring-blue-200"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    )}>
                      {isCompleted ? (
                        <Check className="h-3 w-3 sm:h-5 sm:w-5" />
                      ) : (
                        <StepIcon className="h-3 w-3 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className={cn(
                        "text-sm font-semibold",
                        isCurrent ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-gray-400"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form Steps */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
              )}>
                {(() => {
                  const CurrentIcon = STEPS[currentStep - 1].icon;
                  return <CurrentIcon className="h-5 w-5 sm:h-6 sm:w-6" />;
                })()}
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Step {currentStep}: {STEPS[currentStep - 1].title}
                </CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    Job Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer, Product Manager"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="h-12 text-lg"
                  />
                  <p className="text-xs text-gray-500">
                    Use a clear, specific title that candidates will search for
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    Company Name *
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google, Microsoft, Your Startup Name"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Pro Tip</p>
                      <p className="text-sm text-blue-700">
                        Jobs with specific titles get 40% more qualified applications than generic ones.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Type */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bangalore, Mumbai, New York"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Work Mode</Label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: "onsite", label: "On-site", icon: Building2 },
                      { value: "remote", label: "Remote", icon: MapPin },
                      { value: "hybrid", label: "Hybrid", icon: Users },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => handleChange("workMode", mode.value)}
                        className={cn(
                          "p-2 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-2",
                          formData.workMode === mode.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <mode.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="font-medium text-xs sm:text-base">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Job Type *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {JOB_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleChange("type", type.value)}
                        className={cn(
                          "p-3 sm:p-4 rounded-xl border-2 transition-all text-left",
                          formData.type === type.value
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                          <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                            formData.type === type.value
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            <type.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Job Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      Requirements
                    </Label>
                    <ActionButton size="sm" variant="outline" onClick={addRequirement}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </ActionButton>
                  </div>
                  <div className="space-y-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={`Requirement ${index + 1}...`}
                          value={req}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                        />
                        <button
                          onClick={() => removeRequirement(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.requirements.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                        Click &quot;Add&quot; to add requirements
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    Required Skills
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a skill and press Enter..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <ActionButton onClick={addSkill} variant="outline">
                      Add
                    </ActionButton>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer px-3 py-1.5"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <X className="h-3 w-3 ml-1.5" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Compensation */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin" className="font-semibold">Min Salary</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="e.g., 10"
                      value={formData.salaryMin}
                      onChange={(e) => handleChange("salaryMin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="font-semibold">Max Salary</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.salaryMax}
                      onChange={(e) => handleChange("salaryMax", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="font-semibold">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleChange("currency", value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (LPA)</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    Application Deadline *
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange("deadline", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-12"
                  />
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl sm:rounded-2xl border border-amber-100">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-lg shrink-0">
                      <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-amber-900">Can you provide a referral?</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isReferral}
                            onChange={(e) => handleChange("isReferral", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                      <p className="text-sm text-amber-700 mb-3">
                        Candidates love referral opportunities! Jobs with referrals get 3x more applications.
                      </p>
                      {formData.isReferral && (
                        <Textarea
                          placeholder="Any additional details about the referral (optional)..."
                          value={formData.referralDetails}
                          onChange={(e) => handleChange("referralDetails", e.target.value)}
                          className="bg-white"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-100">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-900 text-base sm:text-lg">Ready to Post!</h3>
                      <p className="text-xs sm:text-sm text-green-700">Review your job posting details below</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">JOB TITLE</h4>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{formData.title}</p>
                    <p className="text-gray-600 text-sm">{formData.company}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-500 text-sm mb-2">LOCATION</h4>
                      <p className="font-medium">{formData.location}</p>
                      <Badge className="mt-2 capitalize">{formData.workMode}</Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-500 text-sm mb-2">JOB TYPE</h4>
                      <Badge className="capitalize bg-emerald-100 text-emerald-700">{formData.type}</Badge>
                    </div>
                  </div>

                  {(formData.salaryMin || formData.salaryMax) && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-500 text-sm mb-2">SALARY</h4>
                      <p className="font-medium">
                        {formData.currency === "INR" ? "₹" : formData.currency === "USD" ? "$" : formData.currency === "EUR" ? "€" : "£"}
                        {formData.salaryMin} - {formData.salaryMax} {formData.currency === "INR" ? "LPA" : "per year"}
                      </p>
                    </div>
                  )}

                  {formData.skills.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-500 text-sm mb-2">SKILLS</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} className="bg-purple-100 text-purple-700">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.isReferral && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-900">Referral Available</h4>
                      </div>
                      {formData.referralDetails && (
                        <p className="text-sm text-amber-700 mt-2">{formData.referralDetails}</p>
                      )}
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-500 text-sm mb-2">DEADLINE</h4>
                    <p className="font-medium">{new Date(formData.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-gray-50 gap-3">
            <ActionButton
              variant="outline"
              onClick={currentStep === 1 ? () => router.push("/jobs") : prevStep}
              icon={currentStep === 1 ? <X /> : <ArrowLeft />}
            >
              {currentStep === 1 ? "Cancel" : "Previous"}
            </ActionButton>

            {currentStep < 5 ? (
              <ActionButton
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                icon={<ArrowRight />}
                iconPosition="right"
              >
                Continue
              </ActionButton>
            ) : (
              <ActionButton
                onClick={handleSubmit}
                loading={submitting}
                loadingText="Posting..."
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg"
                icon={<Send />}
              >
                Post Job
              </ActionButton>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
