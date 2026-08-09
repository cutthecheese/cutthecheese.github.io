import React from 'react';
import { Gamepad2 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-amber-900 text-amber-100">
      <nav className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-yellow-400" />
          <span className="text-2xl font-bold text-yellow-400">CutTheCheese</span>
        </a>
        <div className="flex items-center gap-6">
          <NavLink href="#games">Games</NavLink>
          <NavLink href="/sixseven/support">Support</NavLink>
          <NavLink href="/sixseven/privacy">Privacy</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </div>
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
