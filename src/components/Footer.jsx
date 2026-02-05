import React, { useState } from 'react';
import { Truck, ShieldCheck, Instagram, Facebook, Twitter, Loader2, Check, AlertCircle, Info } from 'lucide-react';
import Logo from './Logo';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function Footer({ db, appId }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'subscribers');
      
      // Verificamos duplicados
      const q = query(collectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setStatus('exists');
        setTimeout(() => setStatus('idle'), 3000);
        return; 
      }

      // Guardamos si no existe
      await addDoc(collectionRef, {
        email: email,
        joinedAt: new Date().toISOString(),
        active: true
      });

      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);

    } catch (error) {
      console.error("Error al suscribir:", error);
      setStatus('error');
    }
  };

  return (
    <footer className="bg-white border-t border-zinc-100 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          {/* 1. MARCA Y REDES SOCIALES (ACTUALIZADO CON LINKS) */}
          <div className="space-y-8">
            <Logo className="h-16" imgSrc="/logo.png" />
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Elevamos la cultura del streetwear con gorras de alta calidad diseñadas para quienes viven la ciudad sin límites.</p>
            
            <div className="flex space-x-4">
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/tye_streetcaps?igsh=MTg0bGI2Z2prcHdicw%3D%3D&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer flex items-center justify-center text-zinc-700"
              >
                <Instagram size={20} />
              </a>

              {/* Facebook
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer flex items-center justify-center text-zinc-700"
              >
                <Facebook size={20} />
              </a>

              {/* Twitter / X 
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-zinc-100 p-3 rounded-full hover:bg-black hover:text-white transition cursor-pointer flex items-center justify-center text-zinc-700"
              >
                <Twitter size={20} />
              </a> */}
            </div>
          </div>

          {/* 2. NAVEGACIÓN */}
          <div>
            <h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Navegación</h4>
            <ul className="space-y-4 text-sm font-bold text-zinc-500">
              <li><a href="#" className="hover:text-blue-600 transition cursor-pointer">Inicio</a></li>
              <li><a href="#catalogo" className="hover:text-blue-600 transition cursor-pointer">Colecciones</a></li>
              <li><a href="#contacto" className="hover:text-blue-600 transition cursor-pointer">Contacto</a></li>
            </ul>
          </div>
          
          {/* 3. SERVICIOS */}
          <div>
            <h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Servicios</h4>
            <ul className="space-y-4 text-sm font-bold text-zinc-500">
              <li className="flex items-center gap-2 cursor-pointer hover:text-black transition"><Truck size={16} /> Envíos Nacionales</li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-black transition"><ShieldCheck size={16} /> Compra Protegida</li>
            </ul>
          </div>
          
          {/* 4. NEWSLETTER */}
          <div>
            <h4 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-8">Newsletter</h4>
            <p className="text-zinc-500 text-sm mb-6 font-medium">Suscríbete para lanzamientos exclusivos.</p>
            
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success' || status === 'exists'}
                className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-black disabled:opacity-50" 
                required
              />
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success' || status === 'exists'}
                className={`w-full font-black py-4 rounded-2xl transition shadow-lg uppercase text-xs tracking-widest cursor-pointer flex justify-center items-center gap-2
                  ${status === 'success' ? 'bg-green-500 text-white shadow-green-200' : 
                    status === 'error' ? 'bg-red-500 text-white shadow-red-200' : 
                    status === 'exists' ? 'bg-orange-400 text-white shadow-orange-200' :
                    'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
              >
                {status === 'loading' && <Loader2 className="animate-spin" size={16} />}
                {status === 'success' && <><Check size={16} /> ¡Listo!</>}
                {status === 'exists' && <><Info size={16} /> Ya estás dentro</>}
                {status === 'error' && <><AlertCircle size={16} /> Error</>}
                {status === 'idle' && 'Unirme'}
              </button>
            </form>
          </div>

        </div>
        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6"><div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">© {new Date().getFullYear()} T&E STREET CAPS. RESERVADOS.</div></div>
      </div>
    </footer>
  );
}