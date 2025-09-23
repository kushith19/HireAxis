import React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

const NavBar = () => {
  const { user } = useSelector((store) => store.auth);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-300 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-zinc-900">
          Job<span className="text-zinc-600">Juice</span>
        </h1>

        <div className="flex items-center gap-6">
          {/* Navigation */}
          <ul className="flex items-center gap-6 font-medium text-zinc-700">
            <li className="transition-colors cursor-pointer hover:text-zinc-900">
              <Link to="/">Home</Link>
            </li>
            <Link to="/jobs">
              {" "}
              <li className="transition-colors cursor-pointer hover:text-zinc-900">
                Jobs
              </li>
            </Link>
            <Link to="/discover">
              <li className="transition-colors cursor-pointer hover:text-zinc-900">
                Discover
              </li>
            </Link>
          </ul>

          {!user ? (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="px-4 py-2 border-zinc-400 text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-900 transition-colors"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                {" "}
                <Button className="px-4 py-2 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors">
                  Sign Up
                </Button>
              </Link>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                </Avatar>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 border border-zinc-300 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 backdrop-blur-md"
                align="end"
              >
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                      />
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="font-medium text-zinc-900">
                        Kushith Gowda
                      </h4>
                    </div>
                  </div>

                  <hr className="border-zinc-300" />

                  <div className="flex flex-col gap-1">
                    <Link to="/profile">
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 p-2 text-left hover:bg-zinc-200/70"
                      >
                        <User className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm font-medium text-zinc-700">
                          View Profile
                        </span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="justify-start w-full gap-2 p-2 text-left hover:bg-zinc-200/70"
                    >
                      <LogOut className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm font-medium text-zinc-700">
                        Log Out
                      </span>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
