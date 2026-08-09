import React from 'react';
import { Gamepad2, Github, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-amber-900 text-amber-100">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">CutTheCheese</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <FooterLink href="/sixseven/support">Support</FooterLink>
            <FooterLink href="/sixseven/privacy">Privacy Policy</FooterLink>
          </div>
          <div className="flex gap-6">
            <SocialLink
              icon={Mail}
              href="mailto:support@cutthecheese.games"
              label="Email support"
            />
            <SocialLink
              icon={Github}
              href="https://github.com/jfkz/sixseven-support/issues"
              label="Support tracker on GitHub"
            />
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

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-amber-100 hover:text-yellow-400 transition-colors duration-200"
    >
      {children}
    </a>
  );
}

function SocialLink({
  icon: Icon,
  href,
  label,
}: {
  icon: any;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="text-amber-400 hover:text-yellow-400 transition-colors duration-200"
    >
      <Icon className="w-6 h-6" />
    </a>
  );
}
