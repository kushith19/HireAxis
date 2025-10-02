import React from "react";
import { useState } from "react";
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

const Profile = () => {
  const [open, setOpen] = useState(false);
  
  const { user } = useSelector((store) => store.auth);

  return (
    <div>
      <NavBar />
      <div className="max-w-4xl mx-auto  bg-white border-gray-200 my-6 p-8 rounded-2xl shadow pt-18">
        <div className="flex justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border border-zinc-200">
              <AvatarImage
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGhlhf55WdtBvjfyTjNi8Yh_bfrMc9uGv_uQ&s"
                alt="profile"
              />
            </Avatar>
            <div>
              <h1 className="font-medium text-xl ">{user?.fullname}</h1>
              <p>{user?.profile?.bio}</p>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="text-right"
            variant="outline"
          >
            <Pen />
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-3 my-2">
            <Mail />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 my-2">
            <Contact />
            <span>{user?.phoneNumber}</span>
          </div>
        </div>

        <div>
          <h1>Skills</h1>
          <div className="flex items-center gap-1">
            {user?.profile?.skills?.length != 0 ? (
              user?.profile?.skills?.map((item, index) => (
                <Badge key={index} className="m-1">
                  {item}
                </Badge>
              ))
            ) : (
              <p>No skills added</p>
            )}
          </div>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
          <Label className="text-md font-bold">Resume</Label>
          {user?.profile?.resume ? (
            <a
              href={`${USER_API_END_POINT}/user/${user._id}/download-resume`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 w-full hover:underline cursor-pointer"
            >
              {user?.profile?.resumeOriginalName || "View Resume"}
            </a>
          ) : (
            <p>No resume uploaded</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white border-gray-200 my-6 p-8 rounded-2xl shadow">
        <h1 className="font-bold text-lg my-5">Applied Jobs</h1>
        {/* application table */}
        <AppliedJobTable />
      </div>
      <UpdateProfile open={open} setOpen={setOpen} />
    </div>
  );
};

export default Profile;
