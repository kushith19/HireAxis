import React, { useState } from "react";
import NavBar from "./shared/NavBar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Contact, Mail, Pen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import AppliedJobTable from "./AppliedJobTable";
import UpdateProfile from "./UpdateProfile";
import TakeTestModal from "./TakeTestModal";
import { useSelector } from "react-redux";
import useGetAppliedJobs from "../hooks/useGetAppliedJobs";
import { toast } from "sonner";

// --- RESTORED ORIGINAL IMPORT ---
// This ensures your resume download link uses the correct API base URL
import { USER_API_END_POINT } from "../utils/constant";

const Profile = () => {
  useGetAppliedJobs();

  const [open, setOpen] = useState(false);
  // Use a placeholder if user is not available in props
  const { user } = useSelector((store) => store.auth) || {};

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const suggestJobsHandler = () => {
    if (!user?.profile?.skills || user.profile.skills.length === 0) {
      toast.error(
        "Please upload a resume or add skills to your profile first."
      );
      return;
    }

    setIsSuggesting(true);

    try {
      // 1. Get the current skills from the user object
      const currentSkills = user.profile.skills;

      // 2. Format them into a comma-separated string
      const skillsString = currentSkills.join(",");

      // 3. Encode the string and redirect to the Discover page
      const encodedSkills = encodeURIComponent(skillsString);

      // Navigate the user to the Discover page, passing skills as a query parameter
      window.location.href = `/discover?skills=${encodedSkills}`;
    } catch (error) {
      console.error("Redirection Error:", error);
      toast.error("Failed to generate suggestion link.");
      setIsSuggesting(false);
    }
  };

  return (
    <div className="bg-zinc-200 min-h-screen font-sans">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 pt-20">
        <div className="bg-zinc-50 border border-zinc-300 p-6 rounded-2xl shadow-sm ">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border border-zinc-300 shadow-sm">
                <AvatarImage
                  src={
                    user?.profile?.profilePhoto
                      ? user.profile.profilePhoto
                      : "./uploads/user.png"
                  }
                  alt="Profile Photo"
                />
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 leading-tight">
                  {user?.fullname}
                </h1>
                <p className="text-sm text-zinc-600 mt-1">
                  {user?.profile?.bio || "No bio added"}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setOpen(true)}
              size="icon"
              variant="outline"
              className="rounded-full border-zinc-300 hover:bg-zinc-100 transition"
            >
              <Pen className="h-4 w-4 text-zinc-700" />
            </Button>
          </div>

          <div className="mt-4 space-y-1 text-zinc-700">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Contact className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">
                {user?.phoneNumber || "No phone added"}
              </span>
            </div>
          </div>

          {/* Test Results */}
          {user?.profile?.testResults?.finalScore !== undefined && (
            <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h2 className="text-base font-semibold text-zinc-800 mb-3">
                Interview Test Results
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700">Final Score:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {user.profile.testResults.finalScore.toFixed(1)}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700">Facial Confidence:</span>
                  <span className="text-sm font-medium text-zinc-800">
                    {user.profile.testResults.facialConfidenceScore?.toFixed(1) || "N/A"}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700">Answer Correctness:</span>
                  <span className="text-sm font-medium text-zinc-800">
                    {user.profile.testResults.correctnessScore?.toFixed(1) || "N/A"}/100
                  </span>
                </div>
                {user.profile.testResults.testDate && (
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                    <span className="text-xs text-zinc-600">Test Date:</span>
                    <span className="text-xs text-zinc-600">
                      {new Date(user.profile.testResults.testDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-5">
            <h2 className="text-base font-semibold text-zinc-800 mb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {user?.profile?.skills?.length > 0 ? (
                user?.profile?.skills?.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-2 py-0.5 rounded-full border-zinc-300 text-zinc-700 text-xs bg-zinc-100 hover:bg-zinc-200"
                  >
                    {item}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No skills added</p>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="mt-5 space-y-2">
            <Label className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              Resume
            </Label>
            {user?.profile?.resume ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="px-3 py-1 border-zinc-300 text-zinc-700 text-xs font-medium hover:bg-zinc-100 md:flex-none"
                >
                  <a
                    href={`${USER_API_END_POINT}/user/${user._id}/download-resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {user?.profile?.resumeOriginalName || "Download Resume"}
                  </a>
                </Button>

                <div className="flex gap-2 md:ml-auto md:flex-none">
                  <Button
                    onClick={() => {
                      if (
                        !navigator.mediaDevices ||
                        !navigator.mediaDevices.getUserMedia
                      ) {
                        toast.error(
                          "Camera API not supported in this browser."
                        );
                        return;
                      }
                      setIsTestModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    Take Test
                  </Button>
                  <Button
                    onClick={suggestJobsHandler}
                    disabled={isSuggesting}
                    className="px-4 py-2 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
                  >
                    {isSuggesting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Suggesting...
                      </>
                    ) : (
                      "Suggest Jobs"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No resume uploaded. Upload one to enable job suggestions.
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-300 mt-8 rounded-2xl shadow-sm overflow-hidden">
          <h1 className="text-lg font-semibold text-zinc-900 mb-3 px-6 pt-6">
            Applied Jobs
          </h1>

          <AppliedJobTable />
        </div>

        <UpdateProfile open={open} setOpen={setOpen} />
        <TakeTestModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setIsSuggesting(false);
          }}
          skills={user?.profile?.skills || []}
        />
      </div>
    </div>
  );
};

export default Profile;
