"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/library" },
  { label: "About", href: "/about" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="side-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span
          className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div
        id="side-nav"
        ref={drawerRef}
        role="dialog"
        aria-label="Navigation menu"
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="bg-primary px-6 py-5">
          <p className="text-white font-semibold text-lg">Menu</p>
        </div>
        <nav className="flex-1 py-4">
          <ul>
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block px-6 py-3 text-gray-800 hover:bg-gray-100 transition-colors ${pathname === href ? "font-semibold border-l-4 border-primary pl-5" : ""}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
