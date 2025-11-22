import {  useState } from "react";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { useDispatch } from "react-redux";
import { setSearchQuery } from "../redux/jobSlice";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchJobHandler = () => {
    dispatch(setSearchQuery(query));
    navigate("discover")
  };
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto text-center px-6">
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-blue-700 text-sm font-medium">
          Get Juiced
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
          AI-Powered Job Search. <br />
          Quick Apply.<span className="text-indigo-600">Dream Job</span>
        </h1>

        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Your personalized AI job platform. Find the perfect roles, apply
          effortlessly, and track your progress to take the next confident step
          in your career.
        </p>

        <div className="mt-8 flex items-center w-full max-w-xl mx-auto rounded-full border border-blue-200 bg-white shadow-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
          <input
            type="text"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your dream job..."
            className="flex-1 px-4 py-3 rounded-l-full outline-none text-slate-700 placeholder-slate-400"
          />
          <Button
            onClick={searchJobHandler}
            className="rounded-r-full bg-blue-600 hover:bg-blue-700 px-6 py-3 shadow-md"
          >
            <Search className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
