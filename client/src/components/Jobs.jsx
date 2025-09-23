import React from "react";
import NavBar from "./shared/NavBar";
import FilterCard from "./FilterCard";
import Job from "./Job";

const jobsArray = [1, 2, 3, 4, 5, 6, 7, 8];

const Jobs = () => {
  return (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto mt-8 px-4 pt-13">
        <div className="flex gap-6">
          {/* Filter section */}
          <div className="w-[260px] shrink-0">
            <FilterCard />
          </div>

          {/* Jobs grid */}
          {jobsArray.length <= 0 ? (
            <span className="text-zinc-600">Job not found</span>
          ) : (
            <div className="flex-1 h-[85vh] overflow-y-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobsArray.map((_, index) => (
                  <Job key={index} />
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
