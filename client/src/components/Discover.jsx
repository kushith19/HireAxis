import React, { useEffect, useState } from "react";
import NavBar from "./shared/NavBar";
import Job from "./Job"; 
import { useSelector, useDispatch } from "react-redux";
import { setSearchQuery } from "../redux/jobSlice";
// import useGetAllJobs from "../hooks/useGetAllJobs";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { X } from 'lucide-react'; // Added X icon for dismissible alert
import { Button } from "@/components/ui/button";


import { USER_API_END_POINT } from "../utils/constant";

const Discover = () => {
    // Redux state
    const { allJobs: allJobsFromRedux } = useSelector((store) => store.job);
    const dispatch = useDispatch();
    
    // Local State for filtered results
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageMessage, setPageMessage] = useState("");
    const [isAISuggestedMode, setIsAISuggestedMode] = useState(false); // CRITICAL NEW STATE

    const fetchFilteredJobs = async () => {
        const params = new URLSearchParams(window.location.search);
        const skillsParam = params.get('skills');
        
        // Determine mode based on URL parameter
        const isSuggestionActive = !!skillsParam;
        setIsAISuggestedMode(isSuggestionActive);
        setLoading(true);

        try {
            if (isSuggestionActive) {
                // 1. AI Suggestion Mode
                setPageMessage(`Filtered by your profile skills.`);
                
                const response = await axios.get(`${USER_API_END_POINT}/suggest/jobs`, {
                    withCredentials: true,
                });
                
                setJobs(response.data.suggestedJobs || []);

                // Clean the URL bar after fetching
                window.history.replaceState(null, '', window.location.pathname);
            } else {
                // 2. Standard Search Mode
                setPageMessage("Search results across all available job postings.");
                // In standard mode, we show the list fetched by the hook/global state
                setJobs(allJobsFromRedux); 
            }
        } catch (error) {
            console.error("Job Fetch Error:", error);
            setPageMessage("Error loading jobs.");
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    // Handler to dismiss the suggested mode and return to the standard job list
    const handleClearSuggestions = () => {
        setIsAISuggestedMode(false);
        setJobs(allJobsFromRedux);
        setPageMessage("Search results across all available job postings.");
    };

    useEffect(() => {
        // We call fetchFilteredJobs() only on mount
        fetchFilteredJobs();
        
        return () => {
            dispatch(setSearchQuery(""));
        };
    }, [allJobsFromRedux]); // Re-run if global jobs change

    // Determine the list to render based on the current mode
    // If AI is active, use 'jobs'. If not, use the Redux global list.
    const jobList = isAISuggestedMode ? jobs : allJobsFromRedux;

    return (
        <div className="min-h-screen bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 font-sans">
            <NavBar />

            <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
                
                {isAISuggestedMode && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-900 p-4 mb-6 flex justify-between items-center rounded-lg shadow-sm">
                        <div className="font-medium">
                            <span className="font-bold">AI Suggestion Mode Active: </span> 
                            Showing {jobList.length} highly relevant job{jobList.length !== 1 ? 's' : ''} based on your profile.
                        </div>
                        <Button 
                            onClick={handleClearSuggestions} 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-700 hover:bg-blue-200"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-zinc-900">
                         {isAISuggestedMode ? "AI Suggested Opportunities" : "Search Results"}
                    </h1>
                    <p className="text-zinc-600 mt-1 text-sm">
                        {jobList.length > 0
                            ? `${jobList.length} job${jobList.length !== 1 ? "s" : ""} found. ${pageMessage}`
                            : pageMessage || "No jobs found"}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-zinc-600" />
                        <span className="text-zinc-600">Calculating best matches...</span>
                    </div>
                ) : jobList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobList.map((job, index) => (
                            <Job 
                                key={index} 
                                job={job} 
                                isSuggested={isAISuggestedMode}
                                relevanceScore={job.relevanceScore} 
                                matchedSkills={job.matchedSkills} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-48 text-zinc-500 text-base font-medium">
                        No jobs found meeting the strict relevance requirement.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discover;
