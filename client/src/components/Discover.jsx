import React from "react";
import NavBar from "./shared/NavBar";
import Job from "./Job";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSearchQuery } from "../redux/jobSlice";
import useGetAllJobs from "../hooks/useGetAllJobs";

const Discover = () => {
  useGetAllJobs();

  const { allJobs } = useSelector((store) => store.job);
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(setSearchQuery(""));
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 font-sans">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
   
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Search Results
          </h1>
          <p className="text-zinc-600 mt-1 text-sm">
            {allJobs.length > 0
              ? `${allJobs.length} job${allJobs.length > 1 ? "s" : ""} found`
              : "No jobs found"}
          </p>
        </div>

      
        {allJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allJobs.map((job, index) => (
              <Job key={index} job={job} small />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-48 text-zinc-500 text-base font-medium">
            No jobs available at the moment
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
