import React, { useState } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import {
  BarChart3, Plus, Bell, Mail, Phone, CheckCircle2,
  Trash2, Layers, Filter, Settings, X, Pencil, AlertTriangle,
  TrendingUp, CreditCard, Package, Search, MessageCircle, Ban,
  Tag, Calendar, Percent, RefreshCcw
} from 'lucide-react';
import { formatImageUrl, formatCOP } from '../utils';

export default function AdminPanel({
  db,
  appId,
  products,
  collections,
  categories,
  visors,
  reservations,
  showToast
}) {
  const [adminTab, setAdminTab] = useState('products');

  // Estados de formularios (Movidos desde App.jsx para limpiar)
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", collection: "", category: "", type: "",
    size: "", price: "", stock: 1, discount: 0, image: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [newCol, setNewCol] = useState({ name: "", isLimited: false, expiry: "" });
  const [newCat, setNewCat] = useState("");
  const [newVisor, setNewVisor] = useState("");

  // --- ESTADOS DE MARKETING ---
  const [marketingTarget, setMarketingTarget] = useState("all"); // 'all', 'collection', 'category', 'visor', 'product'
  const [marketingValue, setMarketingValue] = useState("");      // El ID o Nombre de lo seleccionado
  const [marketingPercent, setMarketingPercent] = useState("");  // 10, 20, 50...
  const [offerDuration, setOfferDuration] = useState("permanent"); // 'permanent', '1h', '24h', 'custom'
  const [customDate, setCustomDate] = useState("");

  // Estados para Edición de Auxiliares
  const [editingColId, setEditingColId] = useState(null);
  const [oldColName, setOldColName] = useState("");

  const [editingCatId, setEditingCatId] = useState(null);
  const [oldCatName, setOldCatName] = useState("");

  const [editingVisorId, setEditingVisorId] = useState(null);
  const [oldVisorName, setOldVisorName] = useState("");

  // --- LÓGICA DE GESTIÓN (CRUD) ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        image: formatImageUrl(newProduct.image),
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        discount: parseInt(newProduct.discount) || 0,
        // Si estamos editando, no tocamos 'sales' ni 'createdAt'
        ...(editingId ? {} : { sales: 0, createdAt: new Date().toISOString() })
      };

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId), productData);
        setEditingId(null);
        showToast("Producto editado correctamente"); // <--- NOTIFICACIÓN
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), productData);
        showToast("Producto agregado correctamente"); // <--- NOTIFICACIÓN
      }

      // Reset del formulario
      setNewProduct({ name: "", brand: "", collection: "", category: "", type: "", size: "", price: "", stock: 1, discount: 0, image: "" });

      // Scroll suave hacia la tabla
      window.scrollTo({ top: 500, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      showToast("Error al guardar producto", "error"); // <--- ERROR
    }
  };

  // Función para cargar datos en el formulario
  const startEditing = (product) => {
    setNewProduct(product);
    setEditingId(product.id);
    // Scroll suave hacia arriba (el formulario)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setNewProduct({ name: "", brand: "", collection: "", category: "", type: "", size: "", price: "", stock: 1, discount: 0, image: "" });
    setEditingId(null);
  };

  const handleMarkAsSold = async (id) => {
    const prod = products.find(p => p.id === id);
    if (prod && prod.stock > 0) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id), {
        stock: prod.stock - 1,
        sales: (prod.sales || 0) + 1
      });
    }
  };

  // --------------------------------------------------------
  // 1. LÓGICA DE COLECCIONES (Con cascada y protección)
  // --------------------------------------------------------
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      if (editingColId) {
        // MODO EDICIÓN: Actualizar nombre y propagar a productos
        const batch = writeBatch(db);

        // 1. Actualizar la colección en sí
        const colRef = doc(db, 'artifacts', appId, 'public', 'data', 'collections', editingColId);
        batch.update(colRef, newCol);

        // 2. Buscar productos con el nombre viejo y actualizarlos
        if (oldColName !== newCol.name) {
          const productsToUpdate = products.filter(p => p.collection === oldColName);
          productsToUpdate.forEach(p => {
            const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
            batch.update(prodRef, { collection: newCol.name });
          });
        }

        await batch.commit();
        showToast(`Colección actualizada y ${products.filter(p => p.collection === oldColName).length} productos corregidos.`);
        setEditingColId(null);
        setOldColName("");
      } else {
        // MODO CREACIÓN
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'collections'), newCol);
        showToast("Colección creada correctamente");
      }
      setNewCol({ name: "", isLimited: false, expiry: "" });
    } catch (e) { console.error(e); showToast("Error al guardar colección", "error"); }
  };

  const requestDeleteCollection = (id, name) => {
    const isUsed = products.some(p => p.collection === name);
    if (isUsed) {
      showToast(`No puedes borrar "${name}", hay gorras usándola.`, "error");
      return;
    }
    // Si pasa la validación, abrimos el modal
    setItemToDelete({ type: 'collection', id, name });
  };

  const startEditingCollection = (col) => {
    setNewCol(col);
    setEditingColId(col.id);
    setOldColName(col.name);
  };

  // --------------------------------------------------------
  // 2. LÓGICA DE CATEGORÍAS
  // --------------------------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        const batch = writeBatch(db);
        const catRef = doc(db, 'artifacts', appId, 'public', 'data', 'categories', editingCatId);
        batch.update(catRef, { name: newCat });

        if (oldCatName !== newCat) {
          products.filter(p => p.category === oldCatName).forEach(p => {
            const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
            batch.update(prodRef, { category: newCat });
          });
        }
        await batch.commit();
        showToast("Categoría actualizada en todo el inventario");
        setEditingCatId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name: newCat });
        showToast("Categoría creada");
      }
      setNewCat("");
    } catch (e) { console.error(e); }
  };

  const requestDeleteCategory = (id, name) => {
    if (products.some(p => p.category === name)) {
      showToast(`Error: Hay productos marcados como "${name}"`, "error");
      return;
    }
    setItemToDelete({ type: 'category', id, name });
  };

  const startEditingCategory = (cat) => {
    setNewCat(cat.name);
    setEditingCatId(cat.id);
    setOldCatName(cat.name);
  };

  // --------------------------------------------------------
  // 3. LÓGICA DE VISERAS
  // --------------------------------------------------------
  const handleSaveVisor = async (e) => {
    e.preventDefault();
    try {
      if (editingVisorId) {
        const batch = writeBatch(db);
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'visors', editingVisorId);
        batch.update(ref, { name: newVisor });

        if (oldVisorName !== newVisor) {
          products.filter(p => p.type === oldVisorName).forEach(p => {
            const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
            batch.update(prodRef, { type: newVisor });
          });
        }
        await batch.commit();
        showToast("Visera actualizada correctamente");
        setEditingVisorId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'visors'), { name: newVisor });
        showToast("Visera creada");
      }
      setNewVisor("");
    } catch (e) { console.error(e); }
  };

  const requestDeleteVisor = (id, name) => {
    if (products.some(p => p.type === name)) {
      showToast(`Error: Hay productos con visera "${name}"`, "error");
      return;
    }
    setItemToDelete({ type: 'visor', id, name });
  };

  const startEditingVisor = (v) => {
    setNewVisor(v.name);
    setEditingVisorId(v.id);
    setOldVisorName(v.name);
  };

  const requestDeleteProduct = (id, name) => {
    setItemToDelete({ type: 'product', id, name });
  };

  // --- FUNCIÓN QUE EJECUTA EL BORRADO FINAL ---
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { type, id, name } = itemToDelete;

      if (type === 'product') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
        showToast("Producto eliminado correctamente", "success");
      }
      else if (type === 'collection') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'collections', id));
        showToast(`Colección "${name}" eliminada`, "success");
      }
      else if (type === 'category') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', id));
        showToast(`Categoría "${name}" eliminada`, "success");
      }
      else if (type === 'visor') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'visors', id));
        showToast(`Visera "${name}" eliminada`, "success");
      }

      // Cerrar modal
      setItemToDelete(null);

    } catch (error) {
      console.error(error);
      showToast("Error al eliminar", "error");
    }
  };

  // --- CÁLCULOS DE MÉTRICAS ---
  const totalRevenue = products.reduce((acc, p) => {
    // 1. Calculamos el precio real final con el descuento aplicado
    const realPrice = p.price * (1 - (p.discount || 0) / 100);

    // 2. Multiplicamos por las unidades vendidas
    return acc + ((p.sales || 0) * realPrice);
  }, 0);

  const totalUnits = products.reduce((acc, p) => acc + (p.sales || 0), 0);
  const averageTicket = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  // --- LÓGICA DE SOLICITUDES (CRM) ---
  const [requestSearch, setRequestSearch] = useState("");

  // 1. Filtramos las solicitudes según lo que escribas
  const filteredReservations = reservations.filter(res =>
    res.productName.toLowerCase().includes(requestSearch.toLowerCase()) ||
    res.email.toLowerCase().includes(requestSearch.toLowerCase()) ||
    res.phone.includes(requestSearch)
  );

  // 2. Función Inteligente para WhatsApp
  const handleWhatsAppNotify = (phone, product, type) => {
    if (!phone) return showToast("No hay teléfono registrado", "error");

    // Limpiamos el número (quitamos espacios, guiones, +)
    let cleanPhone = phone.replace(/\D/g, '');

    // Si no tiene código de país (ej: 57 de Colombia), se lo ponemos por defecto
    // Asumimos Colombia (57) si el número tiene 10 dígitos (300...)
    if (cleanPhone.length === 10) cleanPhone = `57${cleanPhone}`;

    let message = "";

    if (type === 'available') {
      message = `👋 ¡Hola! Vimos que estabas esperando la gorra *${product}*.\n\n🔥 ¡Te tengo buenas noticias! *YA ESTÁ DISPONIBLE NUEVAMENTE* en nuestra tienda.\n\nNo te quedes sin la tuya esta vez, cómprala aquí antes de que vuelen: https://testreetcaps.com/#catalogo`;
    } else {
      message = `👋 ¡Hola! Sobre tu interés en la gorra *${product}*...\n\nLamentablemente esta fue una edición limitada y *ya se agotó definitivamente* 😔.\n\nPero acabamos de lanzar nuevos modelos brutales que te van a gustar. Chequéalos aquí: https://testreetcaps.com`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- LÓGICA DE APLICAR DESCUENTOS MASIVOS (ACTUALIZADA) ---
  const handleApplyDiscount = async (e) => {
    e.preventDefault();

    if (!marketingPercent || marketingPercent < 0 || marketingPercent > 100) {
      return showToast("Por favor ingresa un porcentaje válido (0-100)", "error");
    }

    // 1. Calcular Fecha de Expiración
    let expiry = null;
    const now = new Date();

    if (offerDuration === '1h') {
      expiry = new Date(now.getTime() + (60 * 60 * 1000)).toISOString();
    } else if (offerDuration === '24h') {
      expiry = new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString();
    } else if (offerDuration === 'custom' && customDate) {
      expiry = new Date(customDate).toISOString();
    }
    // Si es 'permanent', expiry se queda en null

    // 2. Filtramos objetivos (Igual que antes)
    let targets = [];
    if (marketingTarget === 'all') targets = products;
    else if (marketingTarget === 'collection') targets = products.filter(p => p.collection === marketingValue);
    else if (marketingTarget === 'category') targets = products.filter(p => p.category === marketingValue);
    else if (marketingTarget === 'visor') targets = products.filter(p => p.type === marketingValue);
    else if (marketingTarget === 'product') targets = products.filter(p => p.id === marketingValue);

    if (targets.length === 0) return showToast("No se encontraron productos", "error");

    try {
      const batch = writeBatch(db);

      targets.forEach(p => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
        batch.update(ref, {
          discount: parseInt(marketingPercent),
          discountExpiry: expiry // <--- GUARDAMOS LA FECHA LÍMITE
        });
      });

      await batch.commit();
      showToast(`¡Oferta aplicada a ${targets.length} gorras!`, "success");

      // Reset
      setMarketingValue("");
      setMarketingPercent("");
      setOfferDuration("permanent");
      setCustomDate("");

    } catch (error) {
      console.error(error);
      showToast("Error al aplicar descuentos", "error");
    }
  };

  // Función para quitar descuentos (Reset)
  const handleResetDiscounts = async () => {
    // Esto quita el descuento SOLO a lo seleccionado actualmente
    // Reusamos la lógica pero con porcentaje 0
    setMarketingPercent("0");
    // (El usuario debe dar click en "Aplicar" para confirmar el borrado, 
    // o puedes llamar a handleApplyDiscount programáticamente si ajustas la lógica)
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      {/* HEADER Y TÍTULO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-black">Control Center</h1>
          <p className="text-zinc-400 font-medium tracking-wide mt-2 uppercase text-xs">Gestión de inventario y pedidos T&E</p>
        </div>

        {/* TABS DE NAVEGACIÓN (Diseño mejorado) */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
          <button
            onClick={() => setAdminTab('products')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer outline-none ${adminTab === 'products' ? "bg-black text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
          >
            Productos
          </button>
          <button
            onClick={() => setAdminTab('settings')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer outline-none ${adminTab === 'settings' ? "bg-black text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
          >
            Ajustes
          </button>
          <button
            onClick={() => setAdminTab('marketing')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer outline-none ${adminTab === 'marketing' ? "bg-black text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
          >
            Ofertas
          </button>
        </div>
      </div>

      {/* --- NUEVO DASHBOARD DE MÉTRICAS (GRID DE 3) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

        {/* CARD 1: REVENUE TOTAL (La principal) */}
        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-zinc-200 group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <div className="p-2 bg-blue-500/20 rounded-lg"><TrendingUp size={20} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Ingresos Totales</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter">{formatCOP(totalRevenue)}</h3>
            <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-wider">Dinero generado en ventas</p>
          </div>
        </div>

        {/* CARD 2: UNIDADES VENDIDAS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 text-zinc-50 transform group-hover:rotate-12 transition-transform duration-500">
            <Package size={150} />
          </div>
          <div className="relative z-10 text-black">
            <div className="flex items-center gap-3 mb-4 text-orange-500">
              <div className="p-2 bg-orange-100 rounded-lg"><Package size={20} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Volumen Ventas</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter text-black">{totalUnits} <span className="text-lg text-zinc-300">unds.</span></h3>
            <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-wider">Gorras entregadas</p>
          </div>
        </div>

        {/* CARD 3: TICKET PROMEDIO */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10 text-black">
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <div className="p-2 bg-green-100 rounded-lg"><CreditCard size={20} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Ticket Promedio</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter text-black">{formatCOP(averageTicket)}</h3>
            <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-wider">Valor promedio por gorra</p>
          </div>
        </div>
      </div>

      {/* ---------------- VISTA PRODUCTOS ---------------- */}
      {adminTab === 'products' && (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 text-black">
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm sticky top-24 text-black">
              <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight leading-none"><Plus className="text-blue-600" /> Nuevo Ingreso</h2>
              <form className="space-y-6" onSubmit={handleSaveProduct}>
                {/* ... (Formulario de Productos - Sin cambios) ... */}
                <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Modelo</label><input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Marca</label><input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} required /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Talla</label><input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black" value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })} /></div>
                  </div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Colección / Drop</label>
                  <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.collection} onChange={e => setNewProduct({ ...newProduct, collection: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Visera</label>
                    <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })} required>
                      <option value="">Seleccionar...</option>
                      {visors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoría</label>
                    <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required>
                      <option value="">Seleccionar...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 font-bold text-black">
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio</label><input type="number" step="1" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock</label><input type="number" min="1" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dcto%</label><input type="number" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.discount} onChange={e => setNewProduct({ ...newProduct, discount: e.target.value })} /></div>
                </div>
                <div className="space-y-1 text-black"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Drive Link Imagen</label><input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold text-black" placeholder="Link de Google Drive" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} required /></div>
                <div className="flex gap-2">
                  {editingId && (
                    <button type="button" onClick={cancelEditing} className="w-1/3 bg-zinc-200 text-black font-black py-5 rounded-2xl hover:bg-zinc-300 transition-all cursor-pointer outline-none uppercase tracking-widest text-xs">Cancelar</button>
                  )}
                  <button type="submit" className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl cursor-pointer outline-none uppercase tracking-widest text-xs ${editingId ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}>
                    {editingId ? "Guardar Cambios" : "Publicar Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10 text-black">
            <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden text-black">
              <div className="p-8 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-center text-black font-black uppercase"><h2 className="tracking-tight text-black">Inventario Live</h2><span className="text-[10px] tracking-widest opacity-40 text-black">{products.length} Modelos</span></div>
              <div className="overflow-x-auto text-black">
                <table className="w-full text-left text-black">
                  <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-400 font-black tracking-widest text-black">
                    <tr><th className="px-8 py-4">Gorra / Drop</th><th className="px-8 py-4 text-center">Stock</th><th className="px-8 py-4 text-center">Ventas</th><th className="px-8 py-4 text-right">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-black">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition-all text-black">
                        <td className="px-8 py-5 text-black"><div className="flex items-center gap-4 text-black"><img src={formatImageUrl(p.image)} className="w-12 h-12 rounded-xl object-cover shadow-sm text-black" /><div className="uppercase text-black"><p className="font-black text-zinc-900 leading-none text-sm text-black">{p.name}</p><p className="text-[10px] text-blue-600 font-bold mt-1 tracking-widest text-black">{p.collection} • {p.type}</p></div></div></td>
                        <td className="px-8 py-5 text-center text-black"><span className={`text-xs font-black px-3 py-1 rounded-lg text-black ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-100'}`}>{p.stock}</span></td>
                        <td className="px-8 py-5 text-center font-bold text-zinc-500 text-sm text-black">{p.sales || 0}</td>
                        <td className="px-8 py-5 text-right text-black"><div className="flex justify-end gap-3"><button onClick={() => handleMarkAsSold(p.id)} disabled={p.stock === 0} className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase transition shadow-sm cursor-pointer ${p.stock === 0 ? 'bg-zinc-100 text-zinc-400 !cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'}`}>Vendido</button><button onClick={() => startEditing(p)} className="text-zinc-300 hover:text-blue-600 cursor-pointer p-2 transition"><Pencil size={18} /></button><button onClick={() => requestDeleteProduct(p.id, p.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer p-2 transition"><Trash2 size={18} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN CRM SOLICITUDES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm text-black">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight text-orange-600 text-black"><Bell size={24} /> Solicitudes de Stock</h2>
                <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition" size={16} />
                  <input type="text" placeholder="Buscar gorra o cliente..." className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none w-full sm:w-64 text-sm font-bold text-black" value={requestSearch} onChange={(e) => setRequestSearch(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-black max-h-[600px] overflow-y-auto pr-2">
                {filteredReservations.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-zinc-100 rounded-[2rem] opacity-50 italic font-bold text-zinc-400 uppercase tracking-widest">{requestSearch ? "No se encontraron coincidencias" : "Sin solicitudes pendientes"}</div>
                ) : (
                  filteredReservations.map((res, i) => (
                    <div key={i} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:border-orange-200 transition text-black">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{res.date}</span><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {res.id.slice(0, 4)}</span></div>
                        <h4 className="font-black text-lg uppercase leading-none mb-3">{res.productName}</h4>
                        <div className="space-y-1"><p className="flex items-center gap-2 text-xs text-zinc-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-100 w-fit"><Mail size={12} className="text-zinc-400" /> {res.email}</p><p className="flex items-center gap-2 text-xs text-zinc-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-100 w-fit"><Phone size={12} className="text-zinc-400" /> {res.phone}</p></div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => handleWhatsAppNotify(res.phone, res.productName, 'available')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white p-3 rounded-xl transition cursor-pointer" title="Notificar Disponibilidad"><MessageCircle size={18} /><span className="sm:hidden text-xs font-bold uppercase">Ya llegó</span></button>
                        <button onClick={() => handleWhatsAppNotify(res.phone, res.productName, 'soldout')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-200 text-zinc-500 hover:bg-black hover:text-white p-3 rounded-xl transition cursor-pointer" title="Notificar Descontinuado"><Ban size={18} /><span className="sm:hidden text-xs font-bold uppercase">Agotada</span></button>
                        <div className="w-px h-8 bg-zinc-200 mx-2 hidden sm:block"></div>
                        <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reservations', res.id)); showToast("Solicitud gestionada y eliminada", "success"); }} className="bg-white border border-zinc-200 text-zinc-300 hover:text-red-500 hover:border-red-200 p-3 rounded-xl transition cursor-pointer shadow-sm" title="Borrar Solicitud"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VISTA AJUSTES ---------------- */}
      {adminTab === 'settings' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-black">
          {/* SECCIÓN COLECCIONES */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 text-black">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Layers className="text-blue-600" /> Colecciones</h2>
            <form onSubmit={handleSaveCollection} className="space-y-4 mb-8 text-black">
              <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Nombre (Verano 2024)" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })} required />
              <div className="flex items-center gap-2 px-2 text-black">
                <input type="checkbox" id="ltd" checked={newCol.isLimited} onChange={e => setNewCol({ ...newCol, isLimited: e.target.checked })} className="cursor-pointer" />
                <label htmlFor="ltd" className="text-xs font-black uppercase text-zinc-400 cursor-pointer">¿Tiempo Limitado?</label>
              </div>
              {newCol.isLimited && <input type="date" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" value={newCol.expiry} onChange={e => setNewCol({ ...newCol, expiry: e.target.value })} />}
              <div className="flex gap-2">
                {editingColId && <button type="button" onClick={() => { setEditingColId(null); setNewCol({ name: "", isLimited: false, expiry: "" }); }} className="w-1/3 bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase">Cancelar</button>}
                <button className={`w-full text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer outline-none ${editingColId ? "bg-orange-500" : "bg-black"}`}>{editingColId ? "Actualizar" : "Crear"}</button>
              </div>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">
              {collections.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black">
                  <span className="text-xs font-bold uppercase text-black">{c.name} {c.isLimited && "⏳"}</span>
                  <div className="flex gap-2"><button onClick={() => startEditingCollection(c)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteCollection(c.id, c.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN CATEGORÍAS */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Filter className="text-blue-600" /> Categorías</h2>
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-2 mb-8 text-black">
              <div className="flex gap-2">
                <input className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Beanie, Snapback..." value={newCat} onChange={e => setNewCat(e.target.value)} required />
                <button className={`text-white p-3 rounded-xl cursor-pointer outline-none ${editingCatId ? "bg-orange-500" : "bg-blue-600"}`}>{editingCatId ? <Pencil size={20} /> : <Plus size={20} />}</button>
              </div>
              {editingCatId && <button type="button" onClick={() => { setEditingCatId(null); setNewCat(""); }} className="text-xs font-bold uppercase text-zinc-400 hover:text-red-500 self-end">Cancelar Edición</button>}
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">
              {categories.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black">
                  <span className="text-xs font-bold uppercase text-black">{c.name}</span>
                  <div className="flex gap-2"><button onClick={() => startEditingCategory(c)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteCategory(c.id, c.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN VISERAS */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 text-black">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Settings className="text-blue-600" /> Viseras</h2>
            <form onSubmit={handleSaveVisor} className="flex flex-col gap-2 mb-8 text-black">
              <div className="flex gap-2">
                <input className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Plana, Curva..." value={newVisor} onChange={e => setNewVisor(e.target.value)} required />
                <button className={`text-white p-3 rounded-xl cursor-pointer outline-none ${editingVisorId ? "bg-orange-500" : "bg-blue-600"}`}>{editingVisorId ? <Pencil size={20} /> : <Plus size={20} />}</button>
              </div>
              {editingVisorId && <button type="button" onClick={() => { setEditingVisorId(null); setNewVisor(""); }} className="text-xs font-bold uppercase text-zinc-400 hover:text-red-500 self-end">Cancelar Edición</button>}
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">
              {visors.map(v => (
                <div key={v.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black">
                  <span className="text-xs font-bold uppercase text-black">{v.name}</span>
                  <div className="flex gap-2"><button onClick={() => startEditingVisor(v)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteVisor(v.id, v.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VISTA MARKETING ---------------- */}
      {adminTab === 'marketing' && (
        <div className="grid lg:grid-cols-2 gap-8 text-black">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-black mb-2 flex items-center gap-3 uppercase tracking-tight leading-none text-black"><Tag className="text-pink-600" /> Crear Campaña</h2>
            <p className="text-zinc-400 text-xs font-bold mb-8 uppercase tracking-wide">Configura descuentos masivos por tiempo limitado.</p>
            <form onSubmit={handleApplyDiscount} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">¿A qué aplicamos el descuento?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMarketingTarget('all')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === 'all' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Toda la Tienda</button>
                  <button type="button" onClick={() => setMarketingTarget('collection')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === 'collection' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Por Colección</button>
                  <button type="button" onClick={() => setMarketingTarget('category')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === 'category' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Por Categoría</button>
                  <button type="button" onClick={() => setMarketingTarget('visor')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === 'visor' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Por Visera</button>
                  <button type="button" onClick={() => setMarketingTarget('product')} className={`col-span-2 p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === 'product' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Un Producto Específico</button>
                </div>
              </div>
              {marketingTarget !== 'all' && (
                <div className="space-y-1 animate-slide-up">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Selecciona Específicamente:</label>
                  <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={marketingValue} onChange={(e) => setMarketingValue(e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {marketingTarget === 'collection' && collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {marketingTarget === 'category' && categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {marketingTarget === 'visor' && visors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    {marketingTarget === 'product' && products.map(p => <option key={p.id} value={p.id}>{p.name} - {p.brand}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Porcentaje de Descuento</label>
                <div className="relative"><Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="number" min="0" max="100" placeholder="Ej: 20" className="w-full pl-12 pr-4 py-3 border border-zinc-100 bg-zinc-50 rounded-xl text-sm outline-none font-bold text-black" value={marketingPercent} onChange={(e) => setMarketingPercent(e.target.value)} required /></div>
              </div>
              {/* 4. DURACIÓN (NUEVO) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Duración de la Oferta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOfferDuration('permanent')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === 'permanent' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Indefinida</button>
                  <button type="button" onClick={() => setOfferDuration('1h')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === '1h' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>⚡ 1 Hora</button>
                  <button type="button" onClick={() => setOfferDuration('24h')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === '24h' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>🔥 24 Horas</button>
                  <button type="button" onClick={() => setOfferDuration('custom')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === 'custom' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>📅 Elegir Fecha</button>
                </div>

                {offerDuration === 'custom' && (
                  <div className="animate-slide-up mt-2">
                    <input
                      type="datetime-local"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => { setMarketingPercent("0"); handleApplyDiscount({ preventDefault: () => { } }); }} className="bg-zinc-100 text-zinc-500 font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"><RefreshCcw size={16} /> Restablecer Precio</button>
                <button type="submit" className="bg-pink-600 text-white font-black py-4 rounded-2xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 uppercase tracking-widest text-xs">Aplicar Oferta</button>
              </div>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-pink-50 p-8 rounded-[2.5rem] border border-pink-100 text-pink-900">
              <h3 className="font-black uppercase text-xl mb-4">Resumen de Impacto</h3>
              <p className="font-medium text-sm mb-6">Estás a punto de aplicar un <span className="font-black text-2xl">{marketingPercent || 0}% OFF</span> a:</p>
              <div className="bg-white/50 p-6 rounded-3xl border border-white/50">
                {marketingTarget === 'all' && <span className="font-black text-lg uppercase">📦 Todo el Inventario ({products.length} gorras)</span>}
                {marketingTarget === 'collection' && <span className="font-black text-lg uppercase">📂 Colección: {marketingValue || "..."}</span>}
                {marketingTarget === 'category' && <span className="font-black text-lg uppercase">🏷️ Categoría: {marketingValue || "..."}</span>}
                {marketingTarget === 'visor' && <span className="font-black text-lg uppercase">🧢 Visera: {marketingValue || "..."}</span>}
                {marketingTarget === 'product' && <span className="font-black text-lg uppercase">🧢 Producto Individual</span>}
              </div>
              <p className="text-xs font-bold mt-6 opacity-60 uppercase tracking-wide">Nota: Esta acción actualizará los precios inmediatamente en la tienda pública.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl animate-slide-up">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black uppercase text-black mb-2">¿Estás seguro?</h3>
            <p className="text-zinc-500 font-medium text-sm mb-8">Vas a eliminar permanentemente: <br /><span className="text-black font-black">"{itemToDelete.name}"</span></p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setItemToDelete(null)} className="w-full bg-zinc-100 text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition cursor-pointer outline-none uppercase text-xs tracking-wider">Cancelar</button>
              <button onClick={confirmDelete} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 cursor-pointer outline-none uppercase text-xs tracking-wider">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}