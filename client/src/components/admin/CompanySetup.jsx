import React, { useEffect, useState } from "react";
import NavBar from "../shared/NavBar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "sonner";
import axios from "axios";
import { COMPANY_API_END_POINT } from "../../utils/constant";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import useGetCompanyById from "../../hooks/useGetCompanyById";

const CompanySetup = () => {
  const params = useParams();
  useGetCompanyById(params.id);
  const navigate = useNavigate();
  const { singleCompany } = useSelector((store) => store.company);

  const [input, setInput] = useState({
    name: "",
    description: "",
    website: "",
    location: "",
    file: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput({
      name: singleCompany?.name || "",
      description: singleCompany?.description || "",
      website: singleCompany?.website || "",
      location: singleCompany?.location || "",
      file: null,
    });
  }, [singleCompany]);

  const changeHandler = (e) =>
    setInput({ ...input, [e.target.name]: e.target.value });
  const fileHandler = (e) => setInput({ ...input, file: e.target.files[0] });

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      setLoading(true);
      const res = await axios.put(
        `${COMPANY_API_END_POINT}/update/${params.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      if (res?.data?.success) {
        toast.success(res.data.message);
        navigate(`/admin/companies`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-50">
      <NavBar />
      <div className="max-w-xl mx-auto pt-28 px-4">
        <form
          onSubmit={submitHandler}
          className="bg-white shadow-md rounded-2xl p-8 border border-zinc-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              onClick={() => navigate("/admin/companies")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-semibold text-xl text-zinc-900">
              Company Setup
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {["name", "description", "website", "location"].map((field) => (
              <div key={field}>
                <Label className="capitalize text-zinc-700">{field}</Label>
                <Input
                  type="text"
                  name={field}
                  value={input[field]}
                  onChange={changeHandler}
                  className="border-zinc-300 focus-visible:ring-zinc-400"
                />
              </div>
            ))}
            <div className="col-span-2">
              <Label className="text-zinc-700">Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={fileHandler}
                className="border-zinc-300 focus-visible:ring-zinc-400"
              />
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <Button
                disabled
                className="w-full bg-zinc-700 text-white font-medium rounded-lg py-2"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg py-2"
              >
                Update
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySetup;
