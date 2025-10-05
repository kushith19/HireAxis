import React from "react";
import { Badge } from "@/components/ui/badge"; // use shadcn badge, not lucide

const LatestJobCards = ({ job }) => {
  return (
    <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
      {/* Company */}
      <div>
        <h1 className="font-semibold text-lg text-zinc-800">{job?.company?.name}</h1>
        <p className="text-sm text-zinc-500">India</p>
      </div>

      {/* Job Info */}
      <div className="mt-3">
        <h2 className="font-bold text-lg text-zinc-900">{job?.title}</h2>
        <p className="text-sm text-zinc-600">{job?.description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mt-5">
        <Badge
          variant="secondary"
          className="bg-zinc-100 text-zinc-700 border border-zinc-200"
        >
         {job?.positions} Positions
        </Badge>
        <Badge
          variant="secondary"
          className="bg-zinc-100 text-zinc-700 border border-zinc-200"
        >
            {job?.jobType}
        </Badge>
        <Badge
          variant="secondary"
          className="bg-zinc-100 text-zinc-700 border border-zinc-200"
        >
         {job?.salary}
        </Badge>
      </div>
    </div>
  );
};

export default LatestJobCards;
