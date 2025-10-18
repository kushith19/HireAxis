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

  return (
    <section className="pb-16 bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50">
      <div className="max-w-5xl mx-auto text-center px-6">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-8">
          Browse by <span className="text-zinc-700">Categories</span>
        </h2>

        {/* Carousel */}
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
                  className="w-full py-6 border-zinc-300 text-zinc-700 font-medium rounded-xl bg-white hover:bg-zinc-100 transition-all"
                >
                  {cat}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons */}
          <CarouselPrevious className="left-2 bg-white/90 border border-zinc-300 shadow-sm hover:bg-zinc-100" />
          <CarouselNext className="right-2 bg-white/90 border border-zinc-300 shadow-sm hover:bg-zinc-100" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
