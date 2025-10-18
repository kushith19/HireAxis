import React from "react";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + About */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-zinc-900">
              Hire<span className="text-zinc-600">Axis</span>
            </h2>
            <p className="mt-3 text-sm text-zinc-600 max-w-xs">
              Your trusted platform to connect talent with opportunities.
              Discover jobs, apply easily, and grow your career.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                <a href="/" className="hover:text-zinc-900 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/jobs"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Jobs
                </a>
              </li>
              <li>
                <a
                  href="/discover"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Discover
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              Follow Us
            </h3>
            <div className="flex space-x-5">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              Stay Updated
            </h3>
            <p className="text-sm text-zinc-600 mb-3">
              Subscribe to get the latest job updates and career tips.
            </p>
            <form className="flex w-full max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-l-md bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-zinc-900 text-zinc-100 hover:bg-zinc-800  rounded-r-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} HireAxis. All rights reserved.</p>
          <div className="flex space-x-6 mt-3 md:mt-0">
            <a
              href="/privacy"
              className="hover:text-zinc-800 transition-colors"
            >
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-zinc-800 transition-colors">
              Terms of Service
            </a>
            <a href="/about" className="hover:text-zinc-800 transition-colors">
              About Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
