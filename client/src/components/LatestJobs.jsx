import React from 'react'
import LatestJobCards from './LatestJobCards';

const randomJobs = [1, 2, 3, 4, 5, 6, 7, 8];

const LatestJobs = () => {
  return (
    <section className="bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 text-center">
          <span className="text-zinc-800">Latest & Top </span>
          Job Openings
        </h1>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {randomJobs.slice(0, 6).map((_, index) => (
            <LatestJobCards key={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestJobs;
