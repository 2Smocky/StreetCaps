import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { Search, Filter, Loader2, ChevronDown } from 'lucide-react';

// IMPORTAR TUS COMPONENTES (Nuevos y Viejos)
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProductCard from './components/ProductCard';
import AdminPanel from './components/AdminPanel';
import HeroCarousel from './components/HeroCarousel';     // <--- NUEVO
import ContactSection from './components/ContactSection'; // <--- NUEVO
import Footer from './components/Footer';                 // <--- NUEVO
import LoginModal from './components/LoginModal';         // <--- NUEVO
import ReserveModal from './components/ReserveModal';
import Toast from './components/Toast';     // <--- NUEVO

// --- CONFIGURACIÓN DE FIREBASE ---
const manualFirebaseConfig = {
  apiKey: "AIzaSyAwSGq0W8kVLpBG715BE5t8WuHw6lwHIRQ",
  authDomain: "tye-street-caps.firebaseapp.com",
  projectId: "tye-street-caps",
  storageBucket: "tye-street-caps.firebasestorage.app",
  messagingSenderId: "537917007603",
  appId: "1:537917007603:web:4af445a35a60a038e1f986",
  measurementId: "G-Q397PZTNNW"
};

const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : manualFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'tye-street-caps';

export default function App() {
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // Función para disparar notificaciones (se la pasaremos a los hijos)
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    // Se borra sola a los 3 segundos
    setTimeout(() => setNotification(null), 3000);
  };
  const [view, setView] = useState('user');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(null);

  // Estados de Datos
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("Todas");

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visors, setVisors] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [cart, setCart] = useState([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  // --- AUTH ---
  // --- AUTH (LÓGICA BLINDADA) ---
  useEffect(() => {
    // Escuchamos el estado de Firebase PRIMERO
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // CASO 1: Firebase encontró un usuario (Admin o Anónimo existente)
        setUser(u);

        // Solo forzamos la vista Admin si es la PRIMERA carga (isLoading es true)
        // Esto evita que si vas a "Inicio", te devuelva al Admin de golpe.
        if (!u.isAnonymous && isLoading) {
          setView('admin');
        }
      } else {
        // CASO 2: No hay usuario en absoluto (Primera vez que entra un cliente)
        // Solo AQUI creamos el anónimo
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error creando anónimo:", error);
        }
      }

      // Terminó la carga inicial
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- DATA SYNC ---
  useEffect(() => {
    const path = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);

    const unsubProds = onSnapshot(path('products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCols = onSnapshot(path('collections'), (s) => setCollections(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCats = onSnapshot(path('categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubVisors = onSnapshot(path('visors'), (s) => setVisors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRes = onSnapshot(path('reservations'), (s) => setReservations(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMsgs = onSnapshot(path('messages'), (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSubs = onSnapshot(path('subscribers'), (s) => setSubscribers(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    setIsLoading(false);
    return () => { unsubProds(); unsubCols(); unsubCats(); unsubVisors(); unsubRes(); unsubMsgs(); unsubSubs(); };
  }, []);

  // --- LÓGICA DE CARRITO ---
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // --- FILTROS (Mantenemos esto aquí porque usa los estados) ---
  const availableCollections = ["Todas", ...collections.map(c => c.name)];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()) || (p.collection && p.collection.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filter === "all" || (filter === "bestsellers" && p.sales > 100) || (filter === "out-of-stock" && p.stock === 0) || p.category === filter;
    const matchesCollection = selectedCollection === "Todas" || p.collection === selectedCollection;
    return matchesSearch && matchesCategory && matchesCollection;
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-blue-100">

      <Navbar
        user={user}
        auth={auth}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        setView={setView}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsCartOpen={setIsCartOpen}
        setShowLoginModal={setShowLoginModal}
        view={view}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
      />

      {view === 'user' ? (
        <main>
          {/* Componente Carrusel */}
          <HeroCarousel />

          {/* CATALOG SECTION (Aún en App para manejar filtros fácilmente) */}
          <section id="catalogo" className="max-w-7xl mx-auto px-4 py-24">
            <div className="flex flex-col gap-12 mb-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                  <span className="text-blue-600 font-bold uppercase tracking-[0.3em] text-xs">Catálogo Oficial</span>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-black">Nuestras Colecciones</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto text-black">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition" size={18} />
                    <input type="text" placeholder="Gorra, marca o colección..." className="pl-10 pr-4 py-3 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 w-full sm:w-64 outline-none transition bg-white font-bold text-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-4 py-3">
                    <Filter size={16} className="mr-2 text-zinc-400" />
                    <select
                      className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold uppercase cursor-pointer appearance-none" // <-- AÑADE 'appearance-none' AQUÍ
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">Filtros</option>
                      <option value="bestsellers">Más Vendidas</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 pb-4">
                {availableCollections.map(col => (
                  <button key={col} onClick={() => setSelectedCollection(col)} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer outline-none border ${selectedCollection === col ? "bg-black text-white border-black" : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400"}`}>{col}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    onReserve={setShowReserveModal}
                  />
                ))
              ) : (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-100 rounded-[3rem]">
                  <p className="text-zinc-400 font-black uppercase tracking-widest">No se encontraron productos.</p>
                </div>
              )}
            </div>
          </section>

          {/* Componente Contacto */}
          <ContactSection />
        </main>
      ) : (
        /* VISTA ADMIN */
        <AdminPanel
          db={db}
          appId={appId}
          products={products}
          collections={collections}
          categories={categories}
          visors={visors}
          reservations={reservations}
          messages={messages}
          subscribers={subscribers}
          showToast={showToast}  // <--- AGREGADO
        />
      )}

      {/* COMPONENTE TOAST (RENDERIZADO GLOBAL) */}
      <Toast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Componentes Modales */}
      <ReserveModal
        product={showReserveModal}
        onClose={() => setShowReserveModal(null)}
        db={db}
        appId={appId}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        auth={auth}
        setView={setView}
      />

      {/* Componente Footer */}
      <Footer db={db} appId={appId} />
    </div>
  );
}