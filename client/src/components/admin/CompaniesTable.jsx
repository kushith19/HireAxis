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
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit2, MoreHorizontal } from "lucide-react";

const CompaniesTable = () => {
  const navigate = useNavigate();
  const { companies, searchCompany } = useSelector((state) => state.company);
  const [filterCompany, setFilterCompany] = useState([]);

  useEffect(() => {
    const filteredCompany =
      companies.length > 0 &&
      companies.filter((company) => {
        if (!searchCompany) return true;
        return company?.name
          .toLowerCase()
          .includes(searchCompany.toLowerCase());
      });
    setFilterCompany(filteredCompany);
  }, [searchCompany, companies]);

  return (
    <div className="overflow-hidden rounded-l border border-zinc-200 pb-4">
      <Table>
        <TableCaption className="text-zinc-500 font-medium">
          A list of your recently registered companies
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-zinc-100">
            <TableHead className="font-semibold text-zinc-700">Logo</TableHead>
            <TableHead className="font-semibold text-zinc-700">Name</TableHead>
            <TableHead className="font-semibold text-zinc-700">Date</TableHead>
            <TableHead className="text-right font-semibold text-zinc-700">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {!filterCompany || filterCompany.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-zinc-500 py-6">
                No companies registered
              </TableCell>
            </TableRow>
          ) : (
            filterCompany.map((company) => (
              <TableRow
                key={company._id}
                className="hover:bg-zinc-50 transition-all"
              >
                <TableCell>
                  <Avatar className="border border-zinc-200">
                    <AvatarImage src={company.logo} alt="logo" />
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-zinc-800">
                  {company.name}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {new Date(company.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right cursor-pointer">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-zinc-100"
                      >
                        <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 bg-white shadow-md border border-zinc-200 rounded-md">
                      <div
                        onClick={() =>
                          navigate(`/admin/companies/${company._id}`)
                        }
                        className="flex items-center gap-2 w-fit cursor-pointer hover:text-zinc-800"
                      >
                        <Edit2 className="h-4 w-4 text-zinc-600" />
                        <span>Edit</span>
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

export default CompaniesTable;
