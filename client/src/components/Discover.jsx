import React from "react";
import NavBar from "./shared/NavBar";
import Job from "./Job";

const randomJobs = [1, 2, 3, 4, 5, 6, 7, 8];
const Discover = () => {
  return (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto mt-8 px-4 pt-13">
        <h1 className="font-semibold text-xl">Search Results ({randomJobs.length}) jobs found</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {randomJobs.map((job, index) => {
            return <Job />;
          })}
        </div>
      </div>
    </div>
  );
};

export default Discover;
