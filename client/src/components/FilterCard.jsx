import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDispatch } from "react-redux";
import { setSearchQuery } from "@/redux/jobSlice"; 

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

const FilterCard = () => {
  const [selectedValues, setSelectedValues] = useState([]);
  const dispatch = useDispatch();

  const handleChange = (checked, value) => {
    if (checked) {
      setSelectedValues((prev) => [...prev, value]);
    } else {
      setSelectedValues((prev) => prev.filter((item) => item !== value));
    }
  };

  useEffect(() => {
    dispatch(setSearchQuery(selectedValues));
  }, [selectedValues, dispatch]);

  return (
    <div className="w-[260px] p-5 rounded-lg border border-zinc-200 bg-white shadow-sm shrink-0 pt-5">
      <h1 className="font-bold text-lg text-zinc-900">Filter Jobs</h1>
      <hr className="my-3 border-zinc-200" />

      {filterData.map((data, index) => (
        <div key={index} className="mb-5">
          <h2 className="text-sm font-semibold text-zinc-700 mb-2">
            {data.filterType}
          </h2>

          <div className="space-y-2">
            {data.options.map((option, idx) => {
          
              const optionValue =
                typeof option === "object" ? option.label : option;
              const id = `${data.filterType}-${idx}`;

              return (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    className="focus:ring-zinc-500 text-zinc-700"
                    checked={selectedValues.includes(optionValue)}
                    onCheckedChange={(checked) => {
                      handleChange(checked, optionValue);
                    }}
                  />
                  <Label
                    htmlFor={id}
                    className="text-sm text-zinc-600 w-full cursor-pointer hover:text-zinc-900"
                  >
                    {optionValue}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterCard;