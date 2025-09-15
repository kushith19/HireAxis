import { Button } from "./ui/button";
import { Search } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 py-20">
      <div className="max-w-4xl mx-auto text-center px-6">
        {/* Tagline */}
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium">
          Get Juiced 
        </span>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 leading-tight">
          AI-Powered Job Search. <br />
          Quick Apply.<span className="text-zinc-700">Dream Job</span>
        </h1>

        {/* Subtext */}
        <p className="mt-4 text-zinc-600 max-w-2xl mx-auto">
          Your personalized AI job platform. Find the perfect roles, apply effortlessly, and track your progress to take the next confident step in your career.
        </p>

        {/* Search Bar */}
        <div className="mt-8 flex items-center w-full max-w-xl mx-auto rounded-full border border-zinc-300 bg-white shadow-md focus-within:ring-2 focus-within:ring-zinc-400">
          <input
            type="text"
            placeholder="Find your dream job..."
            className="flex-1 px-4 py-3 rounded-l-full outline-none text-zinc-700 placeholder-zinc-400"
          />
          <Button className="rounded-r-full bg-zinc-800 hover:bg-zinc-700 px-6 py-3">
            <Search className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
