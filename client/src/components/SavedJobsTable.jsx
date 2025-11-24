import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "../utils/constant";
import { setSavedJobs } from "../redux/jobSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SavedJobsTable = () => {
  const { savedJobs } = useSelector((store) => store.job);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (jobId) => {
    setRemovingId(jobId);
    try {
      const res = await axios.delete(`${USER_API_END_POINT}/saved-jobs/${jobId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setSavedJobs(res.data.savedJobs || []));
        toast.success("Removed from saved jobs");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update saved jobs";
      toast.error(message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <Table>
        <TableCaption className="text-zinc-500 italic">
          {savedJobs?.length > 0
            ? "Jobs you've saved for later"
            : "You haven't saved any jobs yet"}
        </TableCaption>

        <TableHeader className="bg-zinc-100/70">
          <TableRow>
            <TableHead className="text-zinc-700 font-medium">
              Job Role
            </TableHead>
            <TableHead className="text-zinc-700 font-medium">
              Company
            </TableHead>
            <TableHead className="text-zinc-700 font-medium">
              Location
            </TableHead>
            <TableHead className="text-right text-zinc-700 font-medium">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {savedJobs?.length > 0 ? (
            savedJobs.map((savedJob) => (
              <TableRow
                key={savedJob._id}
                className="hover:bg-zinc-100/60 transition-colors"
              >
                <TableCell className="font-medium text-zinc-800">
                  {savedJob.title}
                </TableCell>
                <TableCell className="text-zinc-700">
                  {savedJob?.company?.name || "N/A"}
                </TableCell>
                <TableCell className="text-zinc-700">
                  {savedJob?.company?.location || savedJob?.location || "N/A"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => navigate(`/description/${savedJob._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 text-xs text-zinc-600 hover:text-red-600"
                    onClick={() => handleRemove(savedJob._id)}
                    disabled={removingId === savedJob._id}
                  >
                    {removingId === savedJob._id ? "Removing..." : "Remove"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-zinc-500 italic"
              >
                No saved jobs yet. Tap the save button on a job to add it here.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SavedJobsTable;

