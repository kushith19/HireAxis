import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit2, Eye, MoreHorizontal } from "lucide-react";

const AdminJobsTable = () => {
  const navigate = useNavigate();
  const { allAdminJobs, searchJobByText } = useSelector((store) => store.job);
  const [filterJobs, setFilterJobs] = useState([]);

  useEffect(() => {
    const filteredJobs =
      allAdminJobs.length > 0 &&
      allAdminJobs.filter((job) => {
        if (!searchJobByText) return true;
        return (
          job?.title.toLowerCase().includes(searchJobByText.toLowerCase()) ||
          job?.company?.name.toLowerCase().includes(searchJobByText.toLowerCase())
        );
      });
    setFilterJobs(filteredJobs);
  }, [searchJobByText, allAdminJobs]);

  return (
    <div>
      <div className="px-6 py-5 border-b border-zinc-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-800">Your Posted Jobs</h2>
        <span className="text-sm text-zinc-500">{filterJobs?.length || 0} total</span>
      </div>

      <Table>
        <TableCaption className="text-zinc-500 italic">
          A list of your recent posted jobs
        </TableCaption>

        <TableHeader className="bg-zinc-100/70">
          <TableRow>
            <TableHead className="text-zinc-700 font-medium">Company Name</TableHead>
            <TableHead className="text-zinc-700 font-medium">Role</TableHead>
            <TableHead className="text-zinc-700 font-medium">Date</TableHead>
            <TableHead className="text-right text-zinc-700 font-medium">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {!filterJobs || filterJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-zinc-500 italic">
                No Jobs posted
              </TableCell>
            </TableRow>
          ) : (
            filterJobs.map((job) => (
              <TableRow
                key={job._id}
                className="hover:bg-zinc-100/60 transition-colors"
              >
                <TableCell className="text-zinc-800 font-medium">{job?.company?.name}</TableCell>
                <TableCell className="text-zinc-700">{job.title}</TableCell>
                <TableCell className="text-zinc-600">
                  {new Date(job.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-zinc-200 rounded-full"
                      >
                        <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 bg-zinc-50 border border-zinc-200 shadow-sm rounded-lg">
                      <div
                        onClick={() => navigate(`/admin/jobs/create/${job._id}`)}
                        className="flex items-center gap-2 w-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 p-2 rounded-md cursor-pointer transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </div>
                      <div onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} className="flex items-center w-fit gap-2 cursor-pointer mt-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 p-2 rounded-md transition-colors">
                        <Eye className="w-4"/>
                        <span>Applicants</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminJobsTable;
