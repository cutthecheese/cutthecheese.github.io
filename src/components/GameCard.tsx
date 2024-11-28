import React from 'react';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  releaseDate: string;
}

export function GameCard({ title, description, imageUrl, releaseDate }: GameCardProps) {
  return (
    <div className="bg-amber-50 rounded-lg overflow-hidden shadow-lg transition-transform duration-200 hover:-translate-y-1">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-2">{title}</h3>
        <p className="text-amber-700 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-amber-600">{releaseDate}</span>
          <button className="bg-yellow-400 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition-colors duration-200">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}