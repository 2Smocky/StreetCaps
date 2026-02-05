import React from 'react';
import { Truck, ShieldCheck, Instagram, Facebook, Twitter } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <Logo className="h-16" imgSrc="/logo.png" />
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Elevamos la cultura del streetwear con gorras de alta calidad diseñadas para quienes viven la ciudad sin límites.</p>
            <div className="flex space-x-4">
              <div className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer"><Instagram size={20} /></div>
              <div className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer"><Facebook size={20} /></div>
              <div className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer"><Twitter size={20} /></div>
            </div>
          </div>
          <div><h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Navegación</h4><ul className="space-y-4 text-sm font-bold text-zinc-500"><li><a href="#" className="hover:text-blue-600 transition cursor-pointer">Colección Verano</a></li><li><a href="#" className="hover:text-blue-600 transition cursor-pointer">Gorras Snapback</a></li></ul></div>
          <div><h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Servicios</h4><ul className="space-y-4 text-sm font-bold text-zinc-500"><li className="flex items-center gap-2 cursor-pointer hover:text-black transition"><Truck size={16} /> Envíos Nacionales</li><li className="flex items-center gap-2 cursor-pointer hover:text-black transition"><ShieldCheck size={16} /> Compra Protegida</li></ul></div>
          <div><h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Newsletter</h4><p className="text-zinc-500 text-sm mb-6 font-medium">Suscríbete para lanzamientos exclusivos.</p><div className="space-y-3"><input type="email" placeholder="Email" className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" /><button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase text-xs tracking-widest cursor-pointer">Unirme</button></div></div>
        </div>
        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6"><div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">© {new Date().getFullYear()} T&E STREET CAPS. RESERVADOS.</div></div>
      </div>
    </footer>
  );
}