import React, { useState } from "react";
import NavBar from "../shared/NavBar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

const Signup = () => {
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    file: "",
  });

  const changeEventHandler = (e) => {
    const { name, value, files } = e.target;
    setInput({ ...input, [name]: files ? files[0] : value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(input);
  };

  return (
    <div>
      <NavBar />
      {/* Add padding-top = navbar height (h-16 ≈ 64px) */}
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 px-4 pt-20">
        <form
          onSubmit={submitHandler}
          className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-md p-6"
        >
          {/* Title */}
          <h1 className="font-semibold text-xl mb-5 text-center text-zinc-800">
            Sign Up
          </h1>

          {/* Fullname */}
          <div className="mb-4">
            <Label className="text-zinc-600">Full Name</Label>
            <Input
              type="text"
              name="fullname"
              value={input.fullname}
              onChange={changeEventHandler}
              placeholder="kushith Gowda"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <Label className="text-zinc-600">Email</Label>
            <Input
              type="email"
              name="email"
              value={input.email}
              onChange={changeEventHandler}
              placeholder="kg@example.com"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
            <Label className="text-zinc-600">Phone Number</Label>
            <Input
              type="tel"
              name="phoneNumber"
              value={input.phoneNumber}
              onChange={changeEventHandler}
              placeholder="+91 9876543210"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <Label className="text-zinc-600">Password</Label>
            <Input
              type="password"
              name="password"
              value={input.password}
              onChange={changeEventHandler}
              placeholder="••••••••"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Role Selection */}
          <div className="flex items-center gap-6 mb-5">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="student"
                checked={input.role === "student"}
                onChange={changeEventHandler}
                className="cursor-pointer text-zinc-600 focus:ring-zinc-500"
              />
              <span className="text-zinc-600">Student</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="recruiter"
                checked={input.role === "recruiter"}
                onChange={changeEventHandler}
                className="cursor-pointer text-zinc-600 focus:ring-zinc-500"
              />
              <span className="text-zinc-600">Recruiter</span>
            </label>
          </div>

          {/* File Upload */}
          <div className="mb-5">
            <Label className="text-zinc-600">Profile</Label>
            <Input
              type="file"
              name="file"
              onChange={changeEventHandler}
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300 cursor-pointer"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg py-2 transition-all"
          >
            Create Account
          </Button>

          {/* Footer */}
          <p className="text-sm text-center text-zinc-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-zinc-700 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
