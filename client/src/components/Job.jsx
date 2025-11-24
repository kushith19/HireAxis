import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setSavedJobs } from "@/redux/jobSlice";
import { toast } from "sonner";

const Job = ({ job, isSuggested, relevanceScore, matchedSkills }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((store) => store.auth);
    const { savedJobs } = useSelector((store) => store.job);
    const [isUpdatingSave, setIsUpdatingSave] = useState(false);

    const isJobSaved = savedJobs?.some((savedJob) => savedJob?._id === job?._id);
    
    // Function to calculate days ago (kept for existing logic)
    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDiff = currentTime - createdAt;
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }

    // Function to determine badge color based on relevance
    const getRelevanceColor = (score) => {
        if (score >= 80) return "bg-green-100 text-green-800 border-green-500";
        if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-500";
        return "bg-red-100 text-red-800 border-red-500";
    }

    const handleSaveToggle = async () => {
        if (!user) {
            toast.error("Please log in to save jobs");
            return;
        }

        setIsUpdatingSave(true);
        try {
            const endpoint = `${USER_API_END_POINT}/saved-jobs/${job?._id}`;
            const config = { withCredentials: true };
            const response = isJobSaved
                ? await axios.delete(endpoint, config)
                : await axios.post(endpoint, {}, config);

            if (response.data.success) {
                dispatch(setSavedJobs(response.data.savedJobs || []));
                toast.success(
                    isJobSaved ? "Removed from saved jobs" : "Saved to your jobs"
                );
            }
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to update saved jobs";
            toast.error(message);
        } finally {
            setIsUpdatingSave(false);
        }
    };

    return (
        <div className="p-4 rounded-lg border border-zinc-200 bg-white hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">

            {/* AI SUGGESTION BANNER */}
            {isSuggested && relevanceScore !== undefined && (
                <div className={`mb-3 p-2 rounded-lg border ${getRelevanceColor(relevanceScore)} flex-shrink-0`}>
                    <p className="text-xs font-semibold">
                        AI Match Score: <span className="font-bold">{relevanceScore}%</span>
                    </p>
                    <p className="text-[11px] mt-0.5 opacity-80">
                        Matched skills: {matchedSkills && matchedSkills.length > 0 ? matchedSkills.join(', ') : 'None'}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-[11px] text-zinc-500">{daysAgoFunction(job?.createdAt ) === 0 ? "Today" : daysAgoFunction(job?.createdAt) + " " +"days ago"} </p>
                <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full h-7 w-7 transition-colors ${isJobSaved ? "border-blue-500 text-blue-600" : "hover:border-zinc-600 hover:text-zinc-600"}`}
                    onClick={handleSaveToggle}
                    disabled={isUpdatingSave}
                >
                    <Bookmark className={`h-3.5 w-3.5 ${isJobSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                </Button>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-shrink-0">
                <Avatar className="h-9 w-9 border border-zinc-200">
                    <AvatarImage src={job?.company?.logo} />
                </Avatar>
                <div>
                    <h2 className="font-semibold text-base text-zinc-900">{job?.company?.name}</h2>
                    <p className="text-xs text-zinc-600">{job?.company?.location}</p>
                </div>
            </div>

            
            <div className="mt-4 flex-1 flex flex-col">
                <h3 className="font-bold text-base text-zinc-900 mb-1">{job?.title}</h3>
                <p className="text-xs text-zinc-600 leading-snug line-clamp-3 flex-grow">
                {job?.description}
                </p>
            </div>

            
            <div className="flex flex-wrap items-center gap-1.5 mt-4 flex-shrink-0">
                <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
                    {job?.positions} Positions
                </Badge>
                <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
                    {job?.jobType}
                </Badge>
                <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-0.5">
                    {job?.salary} LPA
                </Badge>
            </div>

            <div className="flex items-center gap-2 mt-5 flex-shrink-0">
                <Button onClick={() => navigate(`/description/${job?._id}`)} className="h-8 text-xs bg-zinc-700 text-white hover:bg-zinc-600">
                    View
                </Button>
                <Button
                    variant={isJobSaved ? "default" : "outline"}
                    className={`h-8 text-xs transition-colors ${isJobSaved ? "bg-blue-600 hover:bg-blue-500 text-white" : "hover:border-zinc-600 hover:text-zinc-600"}`}
                    onClick={handleSaveToggle}
                    disabled={isUpdatingSave}
                >
                    {isUpdatingSave ? "Saving..." : isJobSaved ? "Saved" : "Save"}
                </Button>
            </div>
        </div>
    );
};

export default Job;