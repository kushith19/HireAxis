import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import axios from "axios";
import { JOB_API_END_POINT, APPLICATION_API_END_POINT } from "@/utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { setSingleJob } from "../redux/jobSlice";
import { toast } from "sonner";
import NavBar from "./shared/NavBar";

const JobDescription = () => {
  const { user } = useSelector((store) => store.auth);
  const { singleJob } = useSelector((store) => store.job);

  const isInitiallyApplied =
    singleJob?.applications?.some(
      (application) =>
        application?.applicant?._id?.toString() === user?._id?.toString()
    ) || false;

  const [isApplied, setIsApplied] = useState(isInitiallyApplied);
  const params = useParams();
  const jobId = params.id;
  const dispatch = useDispatch();

  const applyJobHandler = async () => {
    try {
      const res = await axios.get(`${APPLICATION_API_END_POINT}/${jobId}/apply`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setIsApplied(true);
        const updateSingleJob = {
          ...singleJob,
          applications: [...singleJob.applications, { applicant: user?._id }],
        };
        dispatch(setSingleJob(updateSingleJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    const fetchSingleJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
          withCredentials: true,
        });

        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          setIsApplied(
            res.data.job.applications.some(
              (application) => application.applicant?._id === user?._id
            )
          );
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchSingleJob();
  }, [jobId, dispatch, user?._id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-200 py-12 px-4 pt-24">
      <NavBar />
      <div className="max-w-5xl mx-auto">
      
        <div className="bg-zinc-100/80 border border-zinc-300 rounded-2xl shadow-sm p-8 mb-10 transition-all hover:shadow-md hover:border-zinc-400">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="font-semibold text-2xl text-zinc-900 tracking-tight">
                {singleJob?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge className="bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs px-3 py-1">
                  {singleJob?.positions} Positions
                </Badge>
                <Badge className="bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs px-3 py-1">
                  {singleJob?.jobType}
                </Badge>
                <Badge className="bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs px-3 py-1">
                  ₹ {singleJob?.salary} LPA
                </Badge>
              </div>
            </div>
            <Button
              onClick={isApplied ? null : applyJobHandler}
              disabled={isApplied}
              className={`rounded-xl px-6 py-2 text-sm font-medium transition-all ${
                isApplied
                  ? "bg-zinc-700 text-white cursor-not-allowed"
                  : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              {isApplied ? "Already Applied" : "Apply Now"}
            </Button>
          </div>
        </div>

      
        <div className="bg-zinc-100 border border-zinc-300 rounded-2xl shadow-sm p-8 space-y-4 hover:shadow-md transition-all">
          <h2 className="text-lg font-semibold text-zinc-900 border-b pb-3 border-zinc-300">
            Job Details
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-3 text-zinc-800">
            <p>
              <span className="font-medium text-zinc-900">Role:</span>{" "}
              <span className="text-zinc-700">{singleJob?.title}</span>
            </p>
            <p>
              <span className="font-medium text-zinc-900">Location:</span>{" "}
              <span className="text-zinc-700">{singleJob?.location}</span>
            </p>
           
            <p className="sm:col-span-2">
              <span className="font-medium text-zinc-900">Description:</span>{" "}
              <span className="text-zinc-700 leading-relaxed">
                {singleJob?.description}
              </span>
            </p>
             <p>
              <span className="font-medium text-zinc-900">Requirements:</span>{" "}
              <span className="text-zinc-700">{singleJob?.requirements}</span>
            </p>
           
            <p>
              <span className="font-medium text-zinc-900">Salary:</span>{" "}
              <span className="text-zinc-700">₹ {singleJob?.salary} LPA</span>
            </p>
            <p>
              <span className="font-medium text-zinc-900">Total Applicants:</span>{" "}
              <span className="text-zinc-700">
                {singleJob?.applications?.length}
              </span>
            </p>
            <p>
              <span className="font-medium text-zinc-900">Posted On:</span>{" "}
              <span className="text-zinc-700">
                {singleJob?.createdAt?.split("T")[0]}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDescription;