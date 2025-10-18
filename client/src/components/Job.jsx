import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { useNavigate } from "react-router-dom";

const Job = ({job}) => {
  const navigate=useNavigate();
  const daysAgoFunction=(mongodbTime)=>{
    const createdAt=new Date(mongodbTime);
    const currentTime=new Date();
    const timeDiff=currentTime-createdAt;
    return Math.floor(timeDiff/(1000*60*60*24));
  }
  return (
    <div className="p-4 rounded-lg border border-zinc-200 bg-white hover:shadow-md transition-shadow cursor-pointer">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">{daysAgoFunction(job?.createdAt ) === 0? "Today" :daysAgoFunction(job?.createdAt) + " " +"days ago"} </p>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-7 w-7 hover:border-zinc-600 hover:text-zinc-600 transition-colors"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Company info */}
      <div className="flex items-center gap-2 mt-3">
        <Avatar className="h-9 w-9 border border-zinc-200">
          <AvatarImage src={job?.company?.logo} />
        </Avatar>
        <div>
          <h2 className="font-semibold text-base text-zinc-900">{job?.company?.name}</h2>
          <p className="text-xs text-zinc-600">{job?.company?.location}</p>
        </div>
      </div>

      {/* Job info */}
      <div className="mt-4">
        <h3 className="font-bold text-base text-zinc-900">{job?.title}</h3>
        <p className="text-xs text-zinc-600 mt-1 leading-snug">
      {job?.description}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
          {job?.positions} Positions
        </Badge>
        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
           {job?.jobType}
        </Badge>
        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
          {job?.salary} LPA
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5">
        <Button onClick={() => navigate(`/description/${job?._id}`)} className="h-8 text-xs bg-zinc-700 text-white hover:bg-zinc-600">
          View
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs hover:border-zinc-600 hover:text-zinc-600 transition-colors"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default Job;
