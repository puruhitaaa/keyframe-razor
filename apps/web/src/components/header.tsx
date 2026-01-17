"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className="flex gap-4 text-lg"
        >
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                aria-current={to === "/" ? "page" : undefined}
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:rounded-md px-2 py-1"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
      <hr aria-hidden="true" />
    </header>
  );
}
