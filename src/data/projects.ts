export type Status = 'live' | 'soon' | 'dev';

export interface ProjectLink {
  label: string;
  href: string;
  primary?: boolean;
}

export interface Project {
  slug: string;
  title: string;
  platform: string;
  status: Status;
  /** Shown next to the status, e.g. a release date. */
  statusNote?: string;
  description: string;
  links: ProjectLink[];
  /** Cell in public/sprites/icons.png (0-8). */
  icon: number;
}

export const STATUS_LABEL: Record<Status, string> = {
  live: 'Out now',
  soon: 'Coming soon',
  dev: 'In the workshop',
};

export const projects: Project[] = [
  {
    slug: 'sixseven',
    title: 'Six Seven Tap',
    platform: 'iPhone and iPad',
    status: 'live',
    description:
      'Tap once to start the timer, then tap again at exactly 6.7 seconds. Keep a streak going and climb the Game Center leaderboard.',
    links: [
      { label: 'Get it on the App Store', href: 'https://apps.apple.com/us/app/six-seven-tap/id6799709944', primary: true },
      { label: 'Support', href: '/sixseven/support' },
      { label: 'Privacy', href: '/sixseven/privacy' },
    ],
    icon: 0,
  },
  {
    slug: 'heat-and-hammer',
    title: 'Heat & Hammer',
    platform: 'Browser, in English and Russian',
    status: 'live',
    statusNote: 'updated weekly',
    description:
      'A blacksmith dice roguelite. Turn raw blanks into orders while the forge keeps getting hotter, then survive a year of four seasons that each end with a big guild order.',
    links: [
      { label: 'Play in your browser', href: 'https://forge.cutthecheese.games', primary: true },
      { label: 'itch.io', href: 'https://yetanothermike.itch.io/heat-and-hammer' },
    ],
    icon: 1,
  },
  {
    slug: 'draw-me-a-river',
    title: 'Draw Me a River',
    platform: 'Browser',
    status: 'live',
    statusNote: 'new',
    description:
      'Draw a creature, and an AI works out its skeleton and teaches it to walk, roll or wriggle. Then physics decides whether it makes it across. Eleven puzzle levels full of axes, hammers and floating logs, plus a level designer.',
    links: [
      { label: 'Draw a creature', href: 'https://draw-me-a-river.vercel.app', primary: true },
      { label: 'itch.io', href: 'https://yetanothermike.itch.io/draw-me-a-river' },
    ],
    icon: 8,
  },
  {
    slug: 'vesper',
    title: 'Vesper: A Small Bat',
    platform: 'Apple Watch',
    status: 'soon',
    description:
      'An alarm clock with opinions. A small bat lives on your wrist, wakes you up just before she goes to sleep at dawn, and has dry, fond things to say about your step count.',
    links: [
      { label: 'Support', href: '/vesper/support' },
      { label: 'Privacy', href: '/vesper/privacy' },
    ],
    icon: 2,
  },
  {
    slug: 'pete',
    title: 'How Far Can Pete Go?',
    platform: 'Reddit',
    status: 'live',
    description:
      'Pete is a plush man who cannot walk on his own, so every Redditor gets to move him exactly one step. Some steps turn into a skateboard, a bus, a plane or a rocket, and the map zooms out from his lawn all the way to the Sun.',
    links: [{ label: 'Play on Reddit', href: 'https://www.reddit.com/r/HowFarPeteCanGo/', primary: true }],
    icon: 3,
  },
  {
    slug: 'pixelfight',
    title: 'PixelFight',
    platform: 'Browser',
    status: 'live',
    description:
      'A pixel-art fight pit that never closes. The thirty highest bids hold the floor. Outbid someone to take the controls, and your fighter carries your project’s icon over its head.',
    links: [{ label: 'Enter the pit', href: 'https://pixelfight.lol', primary: true }],
    icon: 4,
  },
  {
    slug: 'tiny-world',
    title: 'Tiny World',
    platform: 'Browser, multiplayer',
    status: 'live',
    description:
      'A comic-book planet you share with strangers. Hop on a bus, a plane, a boat or a hot-air balloon and talk to everyone from the window, or type a wish and the whole planet gets it, from rain to rush hour. Every 15 minutes it is rebuilt and everybody falls off.',
    links: [
      { label: 'Visit the planet', href: 'https://tiny-world.cutthecheese.games', primary: true },
      { label: 'itch.io', href: 'https://yetanothermike.itch.io/tiny-world' },
    ],
    icon: 5,
  },
  {
    slug: 'little-planet',
    title: 'Little Planet',
    platform: 'Browser',
    status: 'dev',
    description:
      'A toy planet with three little towns, a lighthouse, wind turbines, a sailboat and a biplane on patrol. Orbit it, zoom in, and switch between day and night.',
    links: [],
    icon: 6,
  },
  {
    slug: 'brush-the-cat',
    title: 'Brush the Cat',
    platform: 'PC',
    status: 'dev',
    description:
      'Groom a very particular cat by dragging a brush over it. When the cat turns around to check on you, freeze.',
    links: [],
    icon: 7,
  },
];
