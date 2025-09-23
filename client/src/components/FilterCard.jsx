import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const filterData = [
  {
    filterType: "Location",
    options: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad"],
  },
  {
    filterType: "Field of Interest",
    options: ["IT", "Management", "Finance", "Marketing", "HR"],
  },
  {
    filterType: "Salary Range",
    options: ["0-3 LPA", "3-6 LPA", "6-10 LPA", "10-15 LPA", "15+ LPA"],
  },
];

const FilterCard = () => {
  return (
    <div className="w-[260px] p-5 rounded-lg border border-zinc-200 bg-white shadow-sm shrink-0 pt-5">
      {/* Header */}
      <h1 className="font-bold text-lg text-zinc-900">Filter Jobs</h1>
      <hr className="my-3 border-zinc-200" />

      {filterData.map((data, index) => (
        <div key={index} className="mb-5">
          <h2 className="text-sm font-semibold text-zinc-700 mb-2">
            {data.filterType}
          </h2>

          <div className="space-y-2">
            {data.options.map((option, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <Checkbox
                  id={`${data.filterType}-${idx}`}
                  className="focus:ring-zinc-500 text-zinc-700"
                />
                <Label
                  htmlFor={`${data.filterType}-${idx}`}
                  className="text-sm text-zinc-600"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterCard;
