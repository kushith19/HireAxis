import React, { useEffect, useState } from "react";
import NavBar from "../shared/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CompaniesTable from "./CompaniesTable";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useGetAllCompanies from "../../hooks/useGetAllCompanies";
import { setSearchCompany } from "../../redux/companySlice";

const Companies = () => {
  useGetAllCompanies();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setInput] = useState("");

  useEffect(() => {
    dispatch(setSearchCompany(input));
  }, [input]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-50 text-zinc-900">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 pt-28">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Input
            className="w-full sm:w-1/3 border-zinc-300 focus-visible:ring-zinc-400"
            placeholder="Filter by name"
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            onClick={() => navigate("/admin/companies/create")}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            New Company
          </Button>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-6 border border-zinc-200">
          <CompaniesTable />
        </div>
      </div>
    </div>
  );
};

export default Companies;
