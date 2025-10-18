import React, { useState } from "react";
import NavBar from "./shared/NavBar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Contact, Mail, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import AppliedJobTable from "./AppliedJobTable";
import UpdateProfile from "./UpdateProfile";
import { USER_API_END_POINT } from "../utils/constant";
import { useSelector } from "react-redux";
import useGetAppliedJobs from "../hooks/useGetAppliedJobs";

const Profile = () => {
  // This hook call is important!
  useGetAppliedJobs();

  const [open, setOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);

  return (
    // UPDATED: Darker background
    <div className="bg-zinc-200 min-h-screen font-sans">
      <NavBar />

      {/* UPDATED: Added padding to this container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 pt-20">
        
        {/* Profile Card */}
        {/* UPDATED: Lighter card, darker border, no top margin */}
        <div className="bg-zinc-50 border border-zinc-300 p-6 rounded-2xl shadow-sm ">
          <div className="flex justify-between items-start">
            {/* Avatar + Info */}
            <div className="flex items-center gap-5">
              {/* UPDATED: Darker border */}
              <Avatar className="h-20 w-20 border border-zinc-300 shadow-sm">
                <AvatarImage
                  src={user?.profile?.profilePhoto ? user.profile.profilePhoto : "./uploads/user.png"}
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

            {/* Edit Button */}
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              variant="outline"
              className="rounded-full border-zinc-300 hover:bg-zinc-100 transition"
            >
              <Pen className="h-4 w-4 text-zinc-700" />
            </Button>
          </div>

          {/* Contact Info */}
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

          {/* Skills */}
          <div className="mt-5">
            <h2 className="text-base font-semibold text-zinc-800 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user?.profile?.skills?.length > 0 ? (
                user?.profile?.skills?.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    // UPDATED: Badge colors changed to stand out on bg-zinc-50
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
          <div className="grid w-full max-w-sm items-center gap-1.5 mt-5">
            <Label className="text-sm font-semibold text-zinc-800">Resume</Label>
            {user?.profile?.resume ? (
              <Button
                asChild
                variant="outline"
                className="w-fit px-3 py-1 border-zinc-300 text-zinc-700 text-xs font-medium hover:bg-zinc-100"
              >
                <a
                  href={`${USER_API_END_POINT}/user/${user._id}/download-resume`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user?.profile?.resumeOriginalName || "Download Resume"}
                </a>
              </Button>
            ) : (
              <p className="text-sm text-zinc-500">No resume uploaded</p>
            )}
          </div>
        </div>

        {/* Applied Jobs Section */}
        {/* UPDATED: Lighter card, darker border */}
        <div className="bg-zinc-50 border border-zinc-300 mt-8 rounded-2xl shadow-sm overflow-hidden">
          <h1 className="text-lg font-semibold text-zinc-900 mb-3 px-6 pt-6">
            Applied Jobs
          </h1>
          {/* Table is now part of this card, without its own padding */}
          <AppliedJobTable />
        </div>

        {/* Update Profile Dialog */}
        <UpdateProfile open={open} setOpen={setOpen} />
      </div>
    </div>
  );
};

export default Profile;