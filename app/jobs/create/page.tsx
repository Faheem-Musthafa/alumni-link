"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { createJobPosting } from "@/lib/firebase/jobs";
import { handleError } from "@/lib/utils/error-handling";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, MapPin, DollarSign, Calendar, Users, Send, X } from "lucide-react";

export default function CreateJobPage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    salary: "",
    description: "",
    requirements: "",
    skills: "",
    deadline: "",
    isReferral: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Parse skills from comma-separated string
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Parse requirements from line-separated string
      const requirementsArray = formData.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      // Parse salary range if provided
      let salaryObj = undefined;
      if (formData.salary.trim()) {
        // Try to extract numbers from salary string (e.g., "15-20 LPA" -> {min: 15, max: 20})
        const numbers = formData.salary.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          salaryObj = {
            min: parseInt(numbers[0]),
            max: parseInt(numbers[1]),
            currency: formData.salary.includes("$") ? "USD" : "INR",
          };
        }
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
        location: formData.location,
        type: formData.type,
        salary: salaryObj,
        description: formData.description,
        requirements: requirementsArray,
        skills: skillsArray,
        deadline: deadlineTimestamp,
        isReferral: formData.isReferral,
        status: "active",
      } as any);

      alert("Job posted successfully!");
      router.push("/jobs");
    } catch (error) {
      handleError(error, "Failed to post job");
      alert("Failed to post job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <div className="max-w-4xl space-y-6">
        <PageHeader
          title="Post a Job"
          description="Share exciting job opportunities with fellow alumni and aspiring students"
          breadcrumbs={[
            { label: "Jobs", href: "/jobs" },
            { label: "Create" }
          ]}
        />

        {/* Job Posting Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Fill in the details about the job opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company *
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Tech Corp Inc."
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bangalore, India (Remote)"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Job Type *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salary" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary Range
                  </Label>
                  <Input
                    id="salary"
                    placeholder="e.g., ₹15-20 LPA or $80k-100k"
                    value={formData.salary}
                    onChange={(e) => handleChange("salary", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Application Deadline *
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange("deadline", e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and what the company is looking for..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                  rows={6}
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements *</Label>
                <Textarea
                  id="requirements"
                  placeholder="List the required qualifications, experience, and education..."
                  value={formData.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills *</Label>
                <Input
                  id="skills"
                  placeholder="Enter skills separated by commas (e.g., React, Node.js, MongoDB)"
                  value={formData.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple skills with commas
                </p>
              </div>

              {/* Referral Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isReferral"
                  checked={formData.isReferral}
                  onChange={(e) => handleChange("isReferral", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="isReferral"
                  className="text-sm font-normal cursor-pointer"
                >
                  I can provide a referral for this position
                </Label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <ActionButton
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  loadingText="Posting..."
                  icon={<Send />}
                >
                  Post Job
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/jobs")}
                  disabled={submitting}
                  icon={<X />}
                >
                  Cancel
                </ActionButton>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
