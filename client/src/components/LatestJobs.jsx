import React, { useMemo } from 'react'
import LatestJobCards from './LatestJobCards';
import { useSelector } from 'react-redux';


const LatestJobs = () => {
  const {allJobs}=useSelector((store)=>store.job);
  
  // Prepare jobs for seamless infinite scrolling
  // Each row needs enough jobs duplicated for smooth animation
  const firstRowJobs = useMemo(() => {
    if (allJobs.length === 0) return [];
    // Get at least 6 jobs for first row
    const jobsForRow = allJobs.length >= 6 ? allJobs.slice(0, 6) : [...allJobs, ...allJobs, ...allJobs].slice(0, 6);
    // Duplicate for seamless loop (scrolls 50% then loops)
    return [...jobsForRow, ...jobsForRow];
  }, [allJobs]);

  const secondRowJobs = useMemo(() => {
    if (allJobs.length === 0) return [];
    // Get at least 6 jobs for second row (use different jobs if available)
    const startIndex = Math.min(6, allJobs.length);
    const jobsForRow = allJobs.length >= 12 
      ? allJobs.slice(startIndex, startIndex + 6) 
      : allJobs.length >= 6 
        ? [...allJobs.slice(startIndex), ...allJobs].slice(0, 6)
        : [...allJobs, ...allJobs, ...allJobs].slice(0, 6);
    // Duplicate for seamless loop (scrolls 50% then loops)
    return [...jobsForRow, ...jobsForRow];
  }, [allJobs]);

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
    
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-10">
          <span className="text-slate-800">Latest & Top </span>
          <span className="text-indigo-600">Job Openings</span>
        </h1>

        {allJobs.length > 0 ? (
          <>
            {/* First Row - Right to Left */}
            <div className="overflow-hidden mb-6">
              <div className="flex animate-scroll-right">
                {firstRowJobs.map((job, index) => (
                  <div key={`row1-${job._id}-${index}`} className="flex-shrink-0 w-[300px] sm:w-[350px] mr-4 sm:mr-6">
                    <LatestJobCards job={job} />
                  </div>
                ))}
              </div>
            </div>

            {/* Second Row - Left to Right */}
            <div className="overflow-hidden">
              <div className="flex animate-scroll-left">
                {secondRowJobs.map((job, index) => (
                  <div key={`row2-${job._id}-${index}`} className="flex-shrink-0 w-[300px] sm:w-[350px] mr-4 sm:mr-6">
                    <LatestJobCards job={job} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-slate-600 text-center">No jobs available</p>
        )}
      </div>
    </section>
  );
};

export default LatestJobs;
