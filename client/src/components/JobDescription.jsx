import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const JobDescription = () => {
  const isApplied = false;
  return (
    <div className="max-w-7xl mx-auto my-10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl">FrontEnd Developer</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
              12 Positions
            </Badge>
            <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
              Part Time
            </Badge>
            <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
              Remote
            </Badge>
          </div>
        </div>
        <Button
          disabled={isApplied}
          className={`rounded-lg ${
            isApplied
              ? "bg-gray-700 cursor-not-allowed text-white"
              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
          } `}
        >
          {isApplied ? " Already Applied" : "Apply Now"}
        </Button>
      </div>
      <h1 className="border-b-2 border-b-gray-300 font-medium py-4">Job Description</h1>
      <div className="my-4">
      <h1 className='font-bold my-1'>Role: <span className='pl-4 font-normal text-gray-800'></span></h1>
                <h1 className='font-bold my-1'>Location: <span className='pl-4 font-normal text-gray-800'></span></h1>
                <h1 className='font-bold my-1'>Description: <span className='pl-4 font-normal text-gray-800'></span></h1>
                <h1 className='font-bold my-1'>Experience: <span className='pl-4 font-normal text-gray-800'> yrs</span></h1>
                <h1 className='font-bold my-1'>Salary: <span className='pl-4 font-normal text-gray-800'>LPA</span></h1>
                <h1 className='font-bold my-1'>Total Applicants: <span className='pl-4 font-normal text-gray-800'></span></h1>
                <h1 className='font-bold my-1'>Posted Date: <span className='pl-4 font-normal text-gray-800'></span></h1>
      </div>
    </div>
  );
};

export default JobDescription;
