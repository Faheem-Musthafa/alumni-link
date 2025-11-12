import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { User, UserProfile } from "@/types";
import { MapPin, Briefcase, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: User;
  profile?: UserProfile | null;
  showViewButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const getRoleGradient = (role: string) => {
  switch (role) {
    case "alumni":
      return "from-emerald-500 to-teal-600";
    case "aspirant":
      return "from-violet-500 to-purple-600";
    default:
      return "from-blue-500 to-indigo-600";
  }
};

export function UserCard({ 
  user, 
  profile, 
  showViewButton = true,
  className,
  children 
}: UserCardProps) {
  const router = useRouter();

  const handleViewProfile = () => {
    router.push(`${ROUTES.PROFILE}/${user.id}`);
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer border-none shadow-md overflow-hidden group",
        className
      )}
      onClick={handleViewProfile}
    >
      {/* Header Gradient */}
      <div
        className={cn(
          "h-20 bg-linear-to-r relative",
          getRoleGradient(user.role)
        )}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
      </div>

      <CardContent className="relative pt-0 pb-6 px-6">
        {/* Avatar */}
        <div className="flex justify-center -mt-10 mb-4">
          <UserAvatar
            src={user.photoURL}
            name={user.displayName}
            size="lg"
            verified={user.verificationStatus === "approved"}
          />
        </div>

        {/* User Info */}
        <div className="text-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg truncate mb-1">
            {user.displayName}
          </h3>

          <Badge variant="outline" className="capitalize mb-3">
            {user.role}
          </Badge>

          {profile?.jobTitle && (
            <p className="text-sm text-gray-700 font-medium flex items-center gap-2 justify-center mb-2">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{profile.jobTitle}</span>
            </p>
          )}

          {profile?.currentCompany && (
            <p className="text-sm text-gray-600 truncate">
              {profile.currentCompany}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {profile?.college && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.college}</span>
            </div>
          )}

          {profile?.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profile.skills.slice(0, 3).map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-200"
                >
                  +{profile.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Custom Children */}
        {children}

        {/* View Profile Button */}
        {showViewButton && (
          <Button
            className="w-full group-hover:bg-blue-600 transition-colors"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile();
            }}
          >
            View Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
