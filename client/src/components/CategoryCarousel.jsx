import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";
import { useDispatch } from "react-redux";
import { setSearchQuery } from "../redux/jobSlice";
import { useNavigate } from "react-router-dom";


const categories = [
  "Front End Developer",
  "Back End Developer",
  "Data Scientist",
  "Designer",
  "Full Stack Developer",
];

const CategoryCarousel = () => {
 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchJobHandler = (query) => {
    dispatch(setSearchQuery(query));
    navigate("discover");
  };

  const categoryColors = [
    "border-blue-200 text-blue-700 hover:border-blue-300",
    "border-indigo-200 text-indigo-700 hover:border-indigo-300",
    "border-purple-200 text-purple-700 hover:border-purple-300",
    "border-teal-200 text-teal-700 hover:border-teal-300",
    "border-emerald-200 text-emerald-700 hover:border-emerald-300",
  ];

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto text-center px-6">
      
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
          Browse by <span className="text-indigo-600">Categories</span>
        </h2>

       
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {categories.map((cat, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Button
                  variant="outline"
                  onClick={() => searchJobHandler(cat)}
                  className={`w-full py-6 font-medium rounded-xl transition-all shadow-sm bg-white ${categoryColors[index % categoryColors.length]}`}
                >
                  {cat}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>

      
          <CarouselPrevious className="left-2 bg-white/90 border border-blue-200 shadow-sm hover:border-blue-300" />
          <CarouselNext className="right-2 bg-white/90 border border-blue-200 shadow-sm hover:border-blue-300" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
