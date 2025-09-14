import React, { useState } from "react";
import NavBar from "../shared/NavBar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "",
    role: "",
  });

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(input);
  };

  return (
    <div>
      <NavBar />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 px-4">
        <form
          onSubmit={submitHandler}
          className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-md p-6"
        >
          {/* Title */}
          <h1 className="font-semibold text-xl mb-5 text-center text-zinc-800">
            Login
          </h1>

          {/* Email */}
          <div className="mb-4">
            <Label className="text-zinc-600">Email</Label>
            <Input
              type="email"
              value={input.email}
              name="email"
              onChange={changeEventHandler}
              placeholder="you@example.com"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <Label className="text-zinc-600">Password</Label>
            <Input
              type="password"
              value={input.password}
              name="password"
              onChange={changeEventHandler}
              placeholder="••••••••"
              className="mt-1 bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500 focus:ring-zinc-500"
            />
          </div>

          {/* Roles */}
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

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg py-2 transition-all"
          >
            Login
          </Button>

          {/* Footer */}
          <p className="text-sm text-center text-zinc-500 mt-5">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-zinc-700 hover:underline">
              Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
