import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Briefcase, FileText, Building2, LayoutDashboard, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Job Search Dashboard",
  description: "Automated job search and CV tailoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h1 className="font-bold text-lg text-gray-900">Job Search</h1>
              <p className="text-xs text-gray-500 mt-0.5">Cristina Arcoleo</p>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <NavLink href="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <NavLink href="/jobs" icon={<Briefcase size={16} />} label="Jobs" />
              <NavLink href="/cvs" icon={<FileText size={16} />} label="My CVs" />
              <NavLink href="/companies" icon={<Building2 size={16} />} label="Companies" />
              <NavLink href="/settings" icon={<Settings size={16} />} label="Search Criteria" />
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
