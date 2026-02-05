import React, { useState } from 'react';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Logo from './Logo';

export default function Navbar({ 
  user, 
  auth, 
  cartCount, 
  setView, 
  isMenuOpen, 
  setIsMenuOpen, 
  setIsCartOpen, 
  setShowLoginModal,
  view 
}) {
  
  const [activeSection, setActiveSection] = useState('inicio');
  const isAdmin = user && !user.isAnonymous;

  const handleAdminClick = () => {
    if (isAdmin) setView('admin');
    else setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('user');
    setIsMenuOpen(false); 
  };

  // --- 🚀 MOTOR DE SCROLL ÉPICO ---
  const scrollToSection = (sectionId, sectionName) => {
    // 1. Aseguramos estar en la vista de usuario
    setView('user');
    setActiveSection(sectionName);
    setIsMenuOpen(false); // Cerramos menú móvil si está abierto

    // 2. Si es 'inicio', scrolleamos arriba del todo
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Buscamos la sección y scrolleamos con compensación (Offset)
    // El offset es para que la barra de navegación no tape el título
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100; // 100px de espacio para que "respire"
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const getLinkClass = (sectionName) => {
    const baseClass = "py-1 transition-all cursor-pointer outline-none border-b-2 uppercase font-bold text-sm tracking-widest";
    if (activeSection === sectionName && view === 'user') {
      return `${baseClass} text-blue-600 border-blue-600`;
    }
    return `${baseClass} text-zinc-500 border-transparent hover:text-black`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO */}
          <div className="flex items-center cursor-pointer group" onClick={() => scrollToSection('top', 'inicio')}>
             <Logo className="h-14" imgSrc="/logo.png" />
          </div>

          {/* MENÚ DE ESCRITORIO */}
          <div className="hidden md:flex items-center space-x-8">
            
            <button 
              onClick={() => scrollToSection('top', 'inicio')} 
              className={getLinkClass('inicio')}
            >
              Inicio
            </button>

            {/* Usamos botones en lugar de <a> para controlar el scroll */}
            <button 
              onClick={() => scrollToSection('catalogo', 'colecciones')}
              className={getLinkClass('colecciones')}
            >
              Colecciones
            </button>

            <button 
              onClick={() => scrollToSection('contacto', 'contacto')}
              className={getLinkClass('contacto')}
            >
              Contacto
            </button>
            
            <div className="flex items-center space-x-3 ml-4 text-black">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-zinc-100 rounded-full transition cursor-pointer outline-none"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {isAdmin ? (
                <>
                  {view === 'user' && (
                    <button 
                      onClick={() => setView('admin')} 
                      className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 cursor-pointer outline-none text-sm font-bold uppercase tracking-widest"
                    >
                      <LayoutDashboard size={16} />
                      <span>Panel</span>
                    </button>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center justify-center bg-red-50 text-red-600 p-2.5 rounded-full hover:bg-red-100 transition cursor-pointer outline-none"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="flex items-center space-x-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 transition shadow-lg shadow-zinc-200 cursor-pointer outline-none text-sm font-bold uppercase tracking-widest"
                >
                  <User size={16} />
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>
          
          {/* BOTONES MÓVIL */}
          <div className="md:hidden flex items-center gap-4 text-black">
             <button onClick={() => setIsCartOpen(true)} className="relative p-2 cursor-pointer outline-none">
               <ShoppingCart size={22} />
               {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
             </button>
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-zinc-100 rounded-lg cursor-pointer outline-none">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 w-full bg-white border-b border-zinc-200 z-40 animate-slide-left shadow-xl h-[calc(100vh-80px)] overflow-y-auto">
          <div className="flex flex-col p-6 space-y-4 font-bold text-sm uppercase tracking-widest text-zinc-600">
            
            <button 
              onClick={() => scrollToSection('top', 'inicio')} 
              className={`p-4 rounded-xl text-left transition ${activeSection === 'inicio' ? 'bg-blue-50 text-blue-600' : 'hover:bg-zinc-50'}`}
            >
              Inicio
            </button>

            <button 
              onClick={() => scrollToSection('catalogo', 'colecciones')} 
              className={`p-4 rounded-xl text-left transition ${activeSection === 'colecciones' ? 'bg-blue-50 text-blue-600' : 'hover:bg-zinc-50'}`}
            >
              Colecciones
            </button>

            <button 
              onClick={() => scrollToSection('contacto', 'contacto')} 
              className={`p-4 rounded-xl text-left transition ${activeSection === 'contacto' ? 'bg-blue-50 text-blue-600' : 'hover:bg-zinc-50'}`}
            >
              Contacto
            </button>
            
            <div className="h-px bg-zinc-100 my-4"></div>

            {isAdmin ? (
              <div className="grid grid-cols-1 gap-4">
                 <button onClick={() => { setView('admin'); setIsMenuOpen(false); }} className="p-4 bg-blue-600 text-white rounded-xl text-center shadow-lg flex items-center justify-center gap-2"><LayoutDashboard size={18}/> Ir al Panel</button>
                 <button onClick={handleLogout} className="p-4 bg-red-50 text-red-600 rounded-xl text-center flex items-center justify-center gap-2"><LogOut size={18}/> Cerrar Sesión</button>
              </div>
            ) : (
              <button onClick={() => { setShowLoginModal(true); setIsMenuOpen(false); }} className="p-4 bg-black text-white rounded-xl text-center shadow-lg flex items-center justify-center gap-2"><User size={18}/> Admin Login</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}