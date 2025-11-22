import React from "react";
import { Badge } from "@/components/ui/badge"; // use shadcn badge, not lucide
import { useNavigate } from "react-router-dom";
const LatestJobCards = ({ job }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/description/${job?._id}`);
  };
  return (
    <div onClick={handleClick} className="p-6 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer h-full flex flex-col">
   
      <div className="flex-shrink-0">
        <h1 className="font-semibold text-lg text-slate-800">{job?.company?.name}</h1>
        <p className="text-sm text-slate-500">India</p>
      </div>

  
      <div className="mt-3 flex-1 flex flex-col">
        <h2 className="font-bold text-lg text-slate-900 mb-2">{job?.title}</h2>
        <p className="text-sm text-slate-600 line-clamp-3 flex-grow">{job?.description}</p>
      </div>

 
      <div className="flex flex-wrap items-center gap-2 mt-5 flex-shrink-0">
        <Badge
          variant="secondary"
          className="bg-white text-blue-700 border border-blue-200"
        >
         {job?.positions} Positions
        </Badge>
        <Badge
          variant="secondary"
          className="bg-white text-indigo-700 border border-indigo-200"
        >
            {job?.jobType}
        </Badge>
        <Badge
          variant="secondary"
          className="bg-white text-purple-700 border border-purple-200"
        >
         {job?.salary} LPA
        </Badge>
      </div>
    </div>
  );
};

export default LatestJobCards;
