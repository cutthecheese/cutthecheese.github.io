import React from 'react';
import { GameCard } from './GameCard';

export function Games() {
  const games = [
    {
      title: "Cheese Runner",
      description: "An endless runner where you collect cheese while avoiding mousetraps.",
      imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=2070",
      releaseDate: "Coming Soon"
    },
    {
      title: "Mouse Quest",
      description: "A puzzle adventure game set in a world of cheese and mystery.",
      imageUrl: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=2069",
      releaseDate: "Available Now"
    },
    {
      title: "Cheese Factory Tycoon",
      description: "Build and manage your own cheese empire in this simulation game.",
      imageUrl: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&q=80&w=2070",
      releaseDate: "In Development"
    }
  ];

  return (
    <section id="games" className="py-20 bg-amber-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-amber-900 text-center mb-12">Our Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}