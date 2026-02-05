import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contacto" className="bg-zinc-900 py-32 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs">Soporte al cliente</span>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mt-4 mb-8">Únete a la<br/><span className="text-blue-500 underline decoration-white/20">Cultura Street</span></h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-md">¿Tienes dudas sobre tu envío o buscas un modelo específico de T&E Street Caps? Escríbenos.</p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4"><div className="bg-white/5 p-4 rounded-2xl text-blue-500 border border-white/10"><Phone size={24} /></div><div><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Atención</p><p className="font-bold">+1 234 STREET</p></div></div>
              <div className="flex items-start space-x-4"><div className="bg-white/5 p-4 rounded-2xl text-blue-500 border border-white/10"><Mail size={24} /></div><div><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</p><p className="font-bold text-sm">info@testreetcaps.com</p></div></div>
            </div>
          </div>
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-zinc-900 text-2xl font-black uppercase mb-8">Envíanos un mensaje</h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black" placeholder="Nombre" />
                <input type="email" className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black" placeholder="Email" />
              </div>
              <textarea rows="4" className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black" placeholder="¿En qué podemos ayudarte?"></textarea>
              <button className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest cursor-pointer outline-none">Enviar solicitud</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}