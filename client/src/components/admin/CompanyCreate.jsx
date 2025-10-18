import React, { useState } from "react";
import NavBar from "../shared/NavBar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { COMPANY_API_END_POINT } from "../../utils/constant";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setSingleCompany } from "../../redux/companySlice";

const CompanyCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [companyName, setCompanyName] = useState("");

  const registerNewCompany = async () => {
    try {
      const res = await axios.post(
        `${COMPANY_API_END_POINT}/register`,
        { companyName },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res?.data?.success) {
        dispatch(setSingleCompany(res?.data?.company));
        toast.success(res.data.message);
        navigate(`/admin/companies/${res?.data?.company?._id}`);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-50">
      <NavBar />
      <div className="max-w-4xl mx-auto pt-28">
        <div className="mb-8">
          <h1 className="font-bold text-2xl text-zinc-900">
            Your Company Name
          </h1>
          <p className="text-zinc-500">
            Enter your company name. You can change it later.
          </p>
        </div>

        <Label className="text-zinc-700">Company Name</Label>
        <Input
          type="text"
          className="my-2 border-zinc-300 focus-visible:ring-zinc-400"
          placeholder="Google, Microsoft, etc."
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <div className="flex items-center gap-3 mt-10">
          <Button
            onClick={() => navigate("/admin/companies")}
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={registerNewCompany}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyCreate;
