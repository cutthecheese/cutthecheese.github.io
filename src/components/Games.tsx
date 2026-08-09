import { GameCard } from './GameCard';

export function Games() {
  const games = [
    {
      title: 'SixSeven Tap Game',
      description:
        'Tap once to start the timer, tap again at exactly 6.7 seconds. Build a streak and climb the global leaderboard.',
      mark: '6.7',
      releaseDate: 'iOS — coming soon',
      supportUrl: '/sixseven/support',
      privacyUrl: '/sixseven/privacy',
    },
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
