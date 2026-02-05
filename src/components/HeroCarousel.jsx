import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CAROUSEL_ITEMS = [
  { title: "T&E Street Caps", subtitle: "Domina el asfalto con estilo", image: "/Banner-1.png" },
  { title: "Nueva Colección Urban", subtitle: "Diseños que hablan por ti", image: "/Gorras.png" },
  { title: "Ediciones Limitadas", subtitle: "Exclusividad en cada costura", image: "/Limit.png" }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[400px] md:h-[650px] overflow-hidden bg-black">
      {CAROUSEL_ITEMS.map((item, idx) => (
        <div key={idx} className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center text-white ${currentSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
          <div className="absolute inset-0">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
          </div>
          <div className="relative text-center px-4 space-y-6 max-w-4xl z-10">
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">{item.title}</h1>
            <p className="text-xl md:text-3xl font-light opacity-80 uppercase tracking-[0.2em]">{item.subtitle}</p>
            <div className="pt-8">
              <a href="#catalogo" className="bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl cursor-pointer">Explorar tienda</a>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => setCurrentSlide(prev => (prev === 0 ? CAROUSEL_ITEMS.length - 1 : prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition cursor-pointer outline-none"><ChevronLeft size={24} /></button>
      <button onClick={() => setCurrentSlide(prev => (prev + 1) % CAROUSEL_ITEMS.length)} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition cursor-pointer outline-none"><ChevronRight size={24} /></button>
    </section>
  );
}