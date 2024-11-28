import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Games } from './components/Games';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-amber-50">
      <Header />
      <Hero />
      <Games />
      <Footer />
    </div>
  );
}

export default App;