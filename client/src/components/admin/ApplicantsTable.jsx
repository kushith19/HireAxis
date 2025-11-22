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
import { useSelector } from "react-redux";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { MoreHorizontal, Check, X } from "lucide-react";
import {
  USER_API_END_POINT,
  APPLICATION_API_END_POINT,
} from "../../utils/constant";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const shortListingStatus = [
  { status: "Accepted", icon: <Check className="h-4 w-4 text-emerald-600" /> },
  { status: "Rejected", icon: <X className="h-4 w-4 text-red-600" /> },
];

const ApplicantsTable = () => {
  const { applicants } = useSelector((state) => state.application);
  const [statuses, setStatuses] = useState({});

  const statusHandler = async (status, id) => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.put(`${APPLICATION_API_END_POINT}/${id}/status`, {
        status,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setStatuses((prev) => ({ ...prev, [id]: status }));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const getButtonClass = (status) => {
    switch (status) {
      case "Accepted":
      
        return "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-50";
      case "Rejected":
        
        return "border-red-300 bg-red-50 text-red-800 hover:bg-red-50";
      default: 
 
        return "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-100";
    }
  };

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-800">Applicants List</h2>
        <span className="text-sm text-zinc-500">
          {applicants?.applications?.length || 0} total
        </span>
      </div>

      <Table>
        <TableCaption className="text-zinc-500 italic">
          A list of all applicants for this job post
        </TableCaption>

        <TableHeader className="bg-zinc-100/70">
          <TableRow>
            <TableHead className="text-zinc-700 font-medium">
              Full Name
            </TableHead>
            <TableHead className="text-zinc-700 font-medium">Email</TableHead>
            <TableHead className="text-zinc-700 font-medium">Contact</TableHead>
            <TableHead className="text-zinc-700 font-medium">Resume</TableHead>
            <TableHead className="text-zinc-700 font-medium">Score</TableHead>
            <TableHead className="text-zinc-700 font-medium">Date</TableHead>
            <TableHead className="text-right text-zinc-700 font-medium">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {applicants?.applications?.length > 0 ? (
            applicants.applications.map((item) => {
              const currentStatus = statuses[item._id] || item?.status;
              const displayStatus = currentStatus || "Pending";

              return (
                <TableRow
                  key={item?._id}
                  className="hover:bg-zinc-100/60 transition-colors"
                >
                  <TableCell className="font-medium text-zinc-800">
                    {item?.applicant?.fullname}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {item?.applicant?.email}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {item?.applicant?.phoneNumber}
                  </TableCell>
                  <TableCell>
                    {item?.applicant?.profile?.resume ? (
                      <a
                        href={`${USER_API_END_POINT}/user/${item?.applicant?._id}/download-resume`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-zinc-500 text-sm">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {item?.applicant?.profile?.testResults?.finalScore !== undefined ? (
                      <span className="font-medium text-zinc-800">
                        {item.applicant.profile.testResults.finalScore.toFixed(1)}/100
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-sm italic">Test not taken</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {item?.createdAt?.split("T")[0]}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                 
                      <Button
                        variant="outline"
                        className={`text-xs px-2.5 py-0.5 h-auto rounded-md font-medium pointer-events-none ${getButtonClass(
                          displayStatus
                        )}`}
                      >
                        {displayStatus}
                      </Button>
                  

                      {displayStatus !== "Accepted" &&
                        displayStatus !== "Rejected" && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-zinc-200 data-[state=open]:bg-zinc-200 rounded-full"
                              >
                                <MoreHorizontal className="h-4 w-4 text-zinc-700" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 bg-zinc-50 border border-zinc-200 rounded-xl shadow-lg p-1">
                              {shortListingStatus.map((action, index) => (
                                <div
                                  key={index}
                                  onClick={() =>
                                    statusHandler(action.status, item._id)
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-md text-sm text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  {action.icon}
                                  <span>{action.status}</span>
                                </div>
                              ))}
                            </PopoverContent>
                          </Popover>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-zinc-500 italic"
              >
                No applicants yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicantsTable;