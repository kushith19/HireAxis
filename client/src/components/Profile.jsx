import React from "react";
import NavBar from "./shared/NavBar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Contact, Mail, Pen } from 'lucide-react'
import { Button } from "@/components/ui/button";

const Profile = () => {
  return (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto  bg-white border-gray-200 my-6 p-8 rounded-2xl shadow pt-18">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border border-zinc-200">
            <AvatarImage
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGhlhf55WdtBvjfyTjNi8Yh_bfrMc9uGv_uQ&s"
              alt="profile"
            />
          </Avatar>
          <div>
            <h1 className="font-medium text-xl ">Full Name</h1>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
          <Button className="text-right" variant="outline">
            <Pen />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
