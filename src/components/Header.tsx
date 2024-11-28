import React from 'react';
import { Gamepad2, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-amber-900 text-amber-100">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-yellow-400" />
          <span className="text-2xl font-bold text-yellow-400">CutTheCheese</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="#games">Games</NavLink>
          <NavLink href="#about">About</NavLink>
          <NavLink href="#careers">Careers</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </div>
        <button className="md:hidden">
          <Menu className="w-6 h-6 text-yellow-400" />
        </button>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="hover:text-yellow-400 transition-colors duration-200"
    >
      {children}
    </a>
  );
}