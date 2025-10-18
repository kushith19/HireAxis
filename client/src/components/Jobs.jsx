import React, { useMemo } from "react";
import NavBar from "./shared/NavBar";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { useSelector } from "react-redux";


const filterData = [
  {
    filterType: "Location",
    options: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad"],
  },

  {
    filterType: "Salary Range",
    options: [
      { label: "0-3 LPA", min: 0, max: 3 },
      { label: "3-6 LPA", min: 3, max: 6 },
      { label: "6-10 LPA", min: 6, max: 10 },
      { label: "10-15 LPA", min: 10, max: 15 },
      { label: "15+ LPA", min: 15, max: Infinity },
    ],
  },
];


const parseSalary = (salaryString) => {
  if (!salaryString) return null;

  const match = String(salaryString).match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const parsed = parseFloat(match[0]);
  return isNaN(parsed) ? null : parsed;
};

const Jobs = () => {
  const { allJobs, searchQuery } = useSelector((store) => store.job);

  const filteredJobs = useMemo(() => {
    if (!searchQuery || searchQuery.length === 0) {
      return allJobs;
    }

    const selectedCategories = {
      Location: [],
      "Salary Range": [],
    
    };

    
    const salaryOptions = filterData.find(
      (c) => c.filterType === "Salary Range"
    ).options;

    searchQuery.forEach((value) => {
    
      if (salaryOptions.some((opt) => opt.label === value)) {
        selectedCategories["Salary Range"].push(value);
      } else if (
        filterData
          .find((c) => c.filterType === "Location")
          .options.includes(value)
      ) {
        selectedCategories["Location"].push(value);
      }
    
    });

    const lowerCaseLocationFilters = selectedCategories["Location"].map((loc) =>
      loc.toLowerCase()
    );
    
    return allJobs.filter((job) => {
      if (lowerCaseLocationFilters.length > 0) {
        const jobLocation = job.location ? job.location.toLowerCase() : "";
        if (!lowerCaseLocationFilters.includes(jobLocation)) {
          return false;
        }
      }

      const salaryFilters = selectedCategories["Salary Range"]; 
      if (salaryFilters.length > 0) {
        const jobSalaryLPA = parseSalary(job.salary); 

        if (jobSalaryLPA === null) return false;

        const selectedRanges = salaryOptions.filter((opt) =>
          salaryFilters.includes(opt.label)
        );

        const isMatch = selectedRanges.some(
          (range) =>
            jobSalaryLPA >= range.min && jobSalaryLPA <= range.max
        );

        if (!isMatch) return false;
      }

      return true;
    });
  }, [allJobs, searchQuery]);

  return (
    <div>
      <NavBar />
      <div className=" bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 max-w-7xl mx-auto mt-8 px-4 pt-13">
        <div className="flex gap-6">
          <div className="w-[260px] shrink-0">
            <FilterCard />
          </div>

          {filteredJobs.length <= 0 ? (
            <div className="flex-1 text-center py-20">
              <h2 className="text-xl font-semibold text-zinc-700">
                No Jobs Found
              </h2>
              <p className="text-zinc-500 mt-2">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="flex-1 h-[85vh] overflow-y-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
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