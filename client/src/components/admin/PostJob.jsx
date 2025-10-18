import React, { useState } from "react";
import NavBar from "../shared/NavBar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import axios from "axios";
import { JOB_API_END_POINT } from "../../utils/constant";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PostJob = () => {
  const [input, setInput] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    location: "",
    jobType: "",
    experience: "",
    position: 0,
    companyId: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { companies } = useSelector((store) => store.company);

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (company) => company.name.toLowerCase() === value
    );
    setInput({ ...input, companyId: selectedCompany._id });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${JOB_API_END_POINT}/post`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      if (res?.data?.success) {
        toast.success(res.data.message);
        navigate("/admin/jobs");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-200">
      <NavBar />

      <div className="flex justify-center items-center pt-28 pb-10 px-4">
        <form
          onSubmit={submitHandler}
          className="w-full max-w-3xl bg-zinc-100/80 border border-zinc-300 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h1 className="text-2xl font-semibold text-zinc-900 mb-8 text-center">
            Post a <span className="text-zinc-500">New Job</span>
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm text-zinc-700">Title</Label>
              <Input
                type="text"
                name="title"
                value={input.title}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Description</Label>
              <Input
                type="text"
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Requirements</Label>
              <Input
                type="text"
                name="requirements"
                value={input.requirements}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Salary (LPA)</Label>
              <Input
                type="text"
                name="salary"
                value={input.salary}
                onChange={changeEventHandler}
                placeholder="Enter Salary in LPA"
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Location</Label>
              <Input
                type="text"
                name="location"
                value={input.location}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Job Type</Label>
              <Input
                type="text"
                name="jobType"
                value={input.jobType}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">Experience (yrs)</Label>
              <Input
                type="text"
                name="experience"
                value={input.experience}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-700">No. of Positions</Label>
              <Input
                type="number"
                name="position"
                value={input.position}
                onChange={changeEventHandler}
                className="mt-2 bg-zinc-50 border-zinc-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            {companies.length > 0 && (
              <div className="sm:col-span-2">
                <Label className="text-sm text-zinc-700 mb-2 block">
                  Select Company
                </Label>
                <Select onValueChange={selectChangeHandler}>
                  <SelectTrigger className="w-full bg-zinc-50 border-zinc-300 focus:ring-violet-500 focus:border-violet-500">
                    <SelectValue placeholder="Select a Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((company) => (
                        <SelectItem
                          key={company._id}
                          value={company?.name?.toLowerCase()}
                        >
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-8">
            {loading ? (
              <Button
                disabled
                className="w-full bg-zinc-700 text-white font-medium rounded-xl py-2"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting Job...
              </Button>
            ) : (
              <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl py-2 transition-all">
                Post New Job
              </Button>
            )}
          </div>

          {companies.length === 0 && (
            <p className="text-xs text-red-600 font-semibold text-center mt-4">
              Please register a company before posting a job.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default PostJob;
