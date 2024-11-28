import React from 'react';
import { Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-amber-900 to-amber-800 text-amber-100 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-yellow-400">Crafting</span> Unforgettable Gaming Experiences
          </h1>
          <p className="text-xl mb-8 text-amber-200">
            We create games that bring people together and spark joy through innovative gameplay and storytelling.
          </p>
          <button className="bg-yellow-400 text-amber-900 px-8 py-3 rounded-full font-semibold flex items-center gap-2 mx-auto hover:bg-yellow-300 transition-colors duration-200">
            <Sparkles className="w-5 h-5" />
            See Our Games
          </button>
        </div>
      </div>
    </section>
  );
}