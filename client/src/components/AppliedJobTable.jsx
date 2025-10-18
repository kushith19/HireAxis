import React from "react";
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
import { Badge } from "@/components/ui/badge";


const getBadgeClass = (status) => {

  switch (status ? status.toLowerCase() : "pending") {
    case "accepted":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200";
    default: 
      return "bg-zinc-100 text-zinc-800 border border-zinc-200";
  }
};


const capitalizeStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const AppliedJobTable = () => {
  const { allAppliedJobs } = useSelector((store) => store.job);

  return (
    <div>
      <Table>
        <TableCaption className="text-zinc-500 italic">
          {allAppliedJobs?.length > 0
            ? "A list of all jobs you have applied for"
            : ""}
        </TableCaption>

        <TableHeader className="bg-zinc-100/70">
          <TableRow>
            <TableHead className="text-zinc-700 font-medium">Date</TableHead>
            <TableHead className="text-zinc-700 font-medium">Job Role</TableHead>
            <TableHead className="text-zinc-700 font-medium">Company</TableHead>
            <TableHead className="text-right text-zinc-700 font-medium">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {allAppliedJobs?.length > 0 ? (
            allAppliedJobs.map((appliedJob) => (
              <TableRow
                key={appliedJob._id}
                className="hover:bg-zinc-100/60 transition-colors"
              >
                <TableCell className="font-medium text-zinc-800">
                  {appliedJob.createdAt.split("T")[0]}
                </TableCell>
                <TableCell className="text-zinc-700">
                  {appliedJob?.job?.title}
                </TableCell>
                <TableCell className="text-zinc-700">
                  {appliedJob?.job?.company?.name}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getBadgeClass(
                      appliedJob.status
                    )}`}
                  >
                  
                    {capitalizeStatus(appliedJob.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-zinc-500 italic"
              >
                You haven't applied for any jobs yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppliedJobTable;