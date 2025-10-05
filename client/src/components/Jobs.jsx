import React from "react";
import NavBar from "./shared/NavBar";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { useSelector } from "react-redux";


const Jobs = () => {
  const {allJobs}=useSelector((store)=>store.job)
  return (
    <div>
      <NavBar />
      <div className=" bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 max-w-7xl mx-auto mt-8 px-4 pt-13">
        <div className="flex gap-6">
          {/* Filter section */}
          <div className="w-[260px] shrink-0">
            <FilterCard />
          </div>

          {/* Jobs grid */}
          {allJobs.length <= 0 ? (
            <span className="text-zinc-600">Job not found</span>
          ) : (
            <div className="flex-1 h-[85vh] overflow-y-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allJobs.map((job) => (
                <div key={job._id}>
                   <Job job={job} />
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
