import React from 'react';
import { Gamepad2, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-amber-900 text-amber-100">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Gamepad2 className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">CutTheCheese</span>
          </div>
          <div className="flex gap-6">
            <SocialLink icon={Twitter} href="#" />
            <SocialLink icon={Github} href="#" />
            <SocialLink icon={Linkedin} href="#" />
          </div>
        </div>
        <div className="border-t border-amber-800 pt-8">
          <p className="text-center text-amber-400">
            © {new Date().getFullYear()} CutTheCheese Games. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon, href }: { icon: any; href: string }) {
  return (
    <a
      href={href}
      className="text-amber-400 hover:text-yellow-400 transition-colors duration-200"
    >
      <Icon className="w-6 h-6" />
    </a>
  );
}