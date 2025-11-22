import React from "react";
import NavBar from "./shared/NavBar";
import HeroSection from "./HeroSection";
import CategoryCarousel from "./CategoryCarousel";
import LatestJobs from "./LatestJobs";
import Footer from "./shared/Foter";
import useGetAllJobs from "../hooks/useGetAllJobs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
const Home = () => {
  useGetAllJobs();
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === "recruiter") {
      navigate("/admin/companies");
    }
  },[]);
  return (
    <div className="min-h-screen">
      <NavBar></NavBar>
      <HeroSection />
      <CategoryCarousel></CategoryCarousel>
      <LatestJobs />
      <Footer />
    </div>
  );
};

export default Home;
