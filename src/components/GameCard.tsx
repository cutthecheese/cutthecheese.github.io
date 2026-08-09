
interface GameCardProps {
  title: string;
  description: string;
  mark: string;
  releaseDate: string;
  supportUrl?: string;
  privacyUrl?: string;
}

export function GameCard({
  title,
  description,
  mark,
  releaseDate,
  supportUrl,
  privacyUrl,
}: GameCardProps) {
  return (
    <div className="bg-amber-50 rounded-lg overflow-hidden shadow-lg transition-transform duration-200 hover:-translate-y-1">
      <div className="w-full h-48 bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center">
        <span className="text-6xl font-bold text-yellow-400">{mark}</span>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-2">{title}</h3>
        <p className="text-amber-700 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-amber-600">{releaseDate}</span>
          <div className="flex gap-4 text-sm font-semibold">
            {supportUrl && (
              <a
                href={supportUrl}
                className="text-amber-900 hover:text-amber-700 transition-colors duration-200"
              >
                Support
              </a>
            )}
            {privacyUrl && (
              <a
                href={privacyUrl}
                className="text-amber-900 hover:text-amber-700 transition-colors duration-200"
              >
                Privacy
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
