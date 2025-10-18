import React, { useEffect, useState } from "react";
import NavBar from "../shared/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminJobsTable from "./AdminJobsTable";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useGetAllAdminJobs from "../../hooks/useGetAllAdminJobs";
import { setSearchJobByText } from "../../redux/jobSlice";

const AdminJobs = () => {
  useGetAllAdminJobs();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setInput] = useState("");

  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100 pt-24 pb-16 px-4">
      <NavBar />

      <div className="max-w-6xl mx-auto">
        {/* Top section: Filter + New Job */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm p-4 sm:p-5">
          <Input
            className="w-full sm:w-1/2 bg-zinc-100 border-zinc-300 focus:border-zinc-500 focus:ring-0"
            placeholder="Filter by company or role"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            onClick={() => navigate("/admin/jobs/create")}
            className="bg-zinc-800 text-zinc-50 hover:bg-zinc-700 transition-colors"
          >
            + New Job
          </Button>
        </div>

        {/* Jobs Table Card */}
        <div className="bg-zinc-50 rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <AdminJobsTable />
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;
