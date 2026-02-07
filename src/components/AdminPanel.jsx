import React, { useState } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import {
  Plus, Bell, Mail, Phone,
  Trash2, Layers, Filter, Settings, X, Pencil, AlertTriangle,
  TrendingUp, CreditCard, Package, Search, MessageCircle, Ban,
  Tag, Percent, RefreshCcw, EyeOff, Send, Inbox, Menu
} from 'lucide-react';
import { formatImageUrl, formatCOP } from '../utils';
import ImageUploader from './ImageUploader';

export default function AdminPanel({
  db,
  appId,
  products,
  collections,
  categories,
  visors,
  reservations,
  messages = [],
  subscribers = [],
  showToast
}) {
  const [adminTab, setAdminTab] = useState('products');

  // --- ESTADOS DEL FORMULARIO DE PRODUCTOS ---
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", collection: "", category: "", type: "",
    size: "", price: "", stock: 1, discount: 0, image: "",
    isHidden: false
  });

  const [isUploading, setIsUploading] = useState(false);

  const [fileToUpload, setFileToUpload] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [notifySubscribers, setNotifySubscribers] = useState(false);

  // --- ESTADOS DE ELIMINACIÓN ---
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- ESTADOS DE AUXILIARES ---
  const [newCol, setNewCol] = useState({ name: "", isLimited: false, expiry: "" });
  const [newCat, setNewCat] = useState("");
  const [newVisor, setNewVisor] = useState("");

  const [editingColId, setEditingColId] = useState(null);
  const [oldColName, setOldColName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [oldCatName, setOldCatName] = useState("");
  const [editingVisorId, setEditingVisorId] = useState(null);
  const [oldVisorName, setOldVisorName] = useState("");

  // --- ESTADOS DE MARKETING ---
  const [marketingTarget, setMarketingTarget] = useState("all");
  const [marketingValue, setMarketingValue] = useState("");
  const [marketingPercent, setMarketingPercent] = useState("");
  const [offerDuration, setOfferDuration] = useState("permanent");
  const [customDate, setCustomDate] = useState("");

  // --- BUSCADORES ---
  const [requestSearch, setRequestSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  // =================================================================
  // 1. LÓGICA DE PRODUCTOS (CRUD)
  // =================================================================
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // 1. Validaciones iniciales
    if (!newProduct.name || !newProduct.brand || !newProduct.price || !newProduct.collection) {
      return showToast("Por favor completa los campos obligatorios", "error");
    }

    // 2. Bloquear interfaz para evitar doble click
    setIsUploading(true);

    try {
      let finalImageUrl = newProduct.image;

      // --- PASO 1: SUBIR IMAGEN A CLOUDINARY (Solo si hay un archivo local seleccionado) ---
      if (fileToUpload) {
        try {
          // La subida ocurre aquí de forma silenciosa, el botón mostrará el estado de carga
          finalImageUrl = await uploadImageToCloudinary(fileToUpload);
        } catch (uploadError) {
          console.error("Error en Cloudinary:", uploadError);
          setIsUploading(false);
          return showToast("Error al subir la imagen a la nube", "error");
        }
      }

      // --- PASO 2: PREPARAR OBJETO PARA FIREBASE ---
      const productData = {
        ...newProduct,
        image: formatImageUrl(finalImageUrl),
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        discount: parseInt(newProduct.discount) || 0,
        isHidden: newProduct.isHidden,
        // Si editamos no sobreescribimos creación; si es nuevo, inicializamos
        ...(editingId ? {} : { sales: 0, createdAt: new Date().toISOString() })
      };

      // --- PASO 3: GUARDAR EN FIRESTORE ---
      if (editingId) {
        // MODO EDICIÓN
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId), productData);
        setEditingId(null);
        showToast("Producto editado correctamente", "success");
      } else {
        // MODO CREACIÓN
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), productData);
        showToast("Producto agregado correctamente", "success");

        // --- PASO 4: NOTIFICACIONES POR CORREO (Solo productos nuevos) ---
        if (notifySubscribers) {
          if (subscribers.length === 0) {
            showToast("No hay suscriptores para notificar", "error");
          } else {
            const mailBatch = writeBatch(db);

            subscribers.forEach(sub => {
              const mailRef = doc(collection(db, "mail"));
              const imgUrl = formatImageUrl(finalImageUrl);

              mailBatch.set(mailRef, {
                to: sub.email,
                message: {
                  subject: `🔥 DROP ALERT: ${newProduct.name} ya está aquí`,
                  text: `Hola! Acaba de llegar la ${newProduct.name} a T&E Street Caps. Precio: ${formatCOP(parseFloat(newProduct.price))}. Cómprala aquí: https://testreetcaps.com`,
                  html: `
                  <!DOCTYPE html>
                  <html>
                  <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="background-color: #000000; padding: 20px; text-align: center;">
                        <p style="color: #ffffff; font-weight: 900; letter-spacing: 4px; margin: 0; font-size: 14px; text-transform: uppercase;">T&E STREET CAPS</p>
                      </div>
                      <div style="background-color: #f8f8f8; padding: 40px 0; text-align: center;">
                        <img src="${imgUrl}" alt="${newProduct.name}" style="width: 80%; max-width: 400px; height: auto; object-fit: contain; display: block; margin: 0 auto; mix-blend-mode: multiply;">
                      </div>
                      <div style="padding: 40px 30px; text-align: center;">
                        <span style="background-color: #eff6ff; color: #2563eb; font-size: 10px; font-weight: 800; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">Nuevo Stock</span>
                        <h1 style="color: #111111; font-size: 28px; font-weight: 900; margin-top: 20px; margin-bottom: 10px; line-height: 1.2; text-transform: uppercase;">${newProduct.name}</h1>
                        <p style="color: #666666; font-size: 16px; margin: 0 0 25px 0;">La espera terminó. El modelo oficial de <strong>${newProduct.brand}</strong> ya está disponible en nuestra tienda.</p>
                        <p style="color: #111111; font-size: 24px; font-weight: 800; margin: 0 0 30px 0;">${formatCOP(parseFloat(newProduct.price))}</p>
                        <a href="https://testreetcaps.com/#catalogo" style="background-color: #000000; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; display: inline-block;">Comprar Ahora</a>
                      </div>
                      <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="color: #999999; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} T&E Street Caps. Todos los derechos reservados.</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `
                }
              });
            });
            await mailBatch.commit();
            showToast(`¡Enviando correos a ${subscribers.length} suscriptores!`, "success");
          }
        }
      }

      // --- PASO 5: LIMPIEZA Y RESETEO ---
      setNewProduct({ name: "", brand: "", collection: "", category: "", type: "", size: "", price: "", stock: 1, discount: 0, image: "", isHidden: false });
      setFileToUpload(null);
      setNotifySubscribers(false);

      if (window.innerWidth > 768) window.scrollTo({ top: 500, behavior: 'smooth' });

    } catch (err) {
      console.error("Error al guardar:", err);
      showToast("Error al guardar el producto", "error");
    } finally {
      // Liberamos el botón
      setIsUploading(false);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'productos_preset'); // Tu preset unsigned

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dl0ds7egv/image/upload`, // Tu Cloud Name
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    return data.secure_url; // Retorna el link final
  };

  const startEditing = (product) => {
    setNewProduct({ ...product, isHidden: product.isHidden || false });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setNewProduct({ name: "", brand: "", collection: "", category: "", type: "", size: "", price: "", stock: 1, discount: 0, image: "", isHidden: false });
    setEditingId(null);
    setNotifySubscribers(false);
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

  const requestDeleteProduct = (id, name) => setItemToDelete({ type: 'product', id, name });

  // =================================================================
  // 2. LÓGICA DE AUXILIARES
  // =================================================================
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      if (editingColId) {
        const batch = writeBatch(db);
        const colRef = doc(db, 'artifacts', appId, 'public', 'data', 'collections', editingColId);
        batch.update(colRef, newCol);
        if (oldColName !== newCol.name) {
          products.filter(p => p.collection === oldColName).forEach(p => {
            const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
            batch.update(prodRef, { collection: newCol.name });
          });
        }
        await batch.commit();
        showToast("Colección actualizada");
        setEditingColId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'collections'), newCol);
        showToast("Colección creada");
      }
      setNewCol({ name: "", isLimited: false, expiry: "" });
    } catch (e) { showToast("Error", "error"); }
  };
  const requestDeleteCollection = (id, name) => {
    if (products.some(p => p.collection === name)) return showToast("En uso, no se puede borrar", "error");
    setItemToDelete({ type: 'collection', id, name });
  };
  const startEditingCollection = (col) => { setNewCol(col); setEditingColId(col.id); setOldColName(col.name); };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'categories', editingCatId), { name: newCat });
        if (oldCatName !== newCat) {
          products.filter(p => p.category === oldCatName).forEach(p => {
            batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id), { category: newCat });
          });
        }
        await batch.commit();
        setEditingCatId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), { name: newCat });
      }
      setNewCat("");
    } catch (e) { console.error(e); }
  };
  const requestDeleteCategory = (id, name) => {
    if (products.some(p => p.category === name)) return showToast("En uso", "error");
    setItemToDelete({ type: 'category', id, name });
  };
  const startEditingCategory = (cat) => { setNewCat(cat.name); setEditingCatId(cat.id); setOldCatName(cat.name); };

  const handleSaveVisor = async (e) => {
    e.preventDefault();
    try {
      if (editingVisorId) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'visors', editingVisorId), { name: newVisor });
        if (oldVisorName !== newVisor) {
          products.filter(p => p.type === oldVisorName).forEach(p => {
            batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id), { type: newVisor });
          });
        }
        await batch.commit();
        setEditingVisorId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'visors'), { name: newVisor });
      }
      setNewVisor("");
    } catch (e) { console.error(e); }
  };
  const requestDeleteVisor = (id, name) => {
    if (products.some(p => p.type === name)) return showToast("En uso", "error");
    setItemToDelete({ type: 'visor', id, name });
  };
  const startEditingVisor = (v) => { setNewVisor(v.name); setEditingVisorId(v.id); setOldVisorName(v.name); };

  // =================================================================
  // 3. LÓGICA DE BORRADO UNIVERSAL
  // =================================================================
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { type, id } = itemToDelete;
      let colName = type + 's';
      if (type === 'category') colName = 'categories';
      if (type === 'message') colName = 'messages';

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, id));
      showToast(`${type} eliminado correctamente`, "success");
      setItemToDelete(null);
    } catch (error) { console.error(error); showToast("Error al eliminar", "error"); }
  };

  // =================================================================
  // 4. MÉTRICAS Y FILTROS
  // =================================================================
  const totalRevenue = products.reduce((acc, p) => acc + ((p.sales || 0) * (p.price * (1 - (p.discount || 0) / 100))), 0);
  const totalUnits = products.reduce((acc, p) => acc + (p.sales || 0), 0);
  const averageTicket = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  const filteredReservations = reservations.filter(res =>
    res.productName.toLowerCase().includes(requestSearch.toLowerCase()) ||
    res.email.toLowerCase().includes(requestSearch.toLowerCase()) ||
    res.phone.includes(requestSearch)
  );

  const filteredInventory = products.filter(p =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.collection.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const filteredMessages = messages.filter(msg =>
    (msg.name || "").toLowerCase().includes(messageSearch.toLowerCase()) ||
    (msg.email || "").toLowerCase().includes(messageSearch.toLowerCase())
  );

  // =================================================================
  // 5. ACCIONES CRM
  // =================================================================
  const handleWhatsAppNotify = (phone, product, type) => {
    if (!phone) return showToast("Sin teléfono", "error");
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `57${cleanPhone}`;
    let message = type === 'available'
      ? `👋 ¡Hola! Vimos que esperabas la gorra *${product}*.\n\n🔥 ¡YA ESTÁ DISPONIBLE! Cómprala aquí: https://testreetcaps.com/#catalogo`
      : `👋 ¡Hola! Sobre la gorra *${product}*...\n\nLamentablemente se agotó definitivamente 😔. Mira lo nuevo aquí: https://testreetcaps.com`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleReplyMessage = (phone, name) => {
    if (!phone) return showToast("Sin teléfono", "error");
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `57${cleanPhone}`;
    const message = `Hola ${name}, te escribimos de T&E Street Caps recibimos tu mensaje...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // =================================================================
  // 6. MARKETING
  // =================================================================
  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!marketingPercent) return showToast("Falta porcentaje", "error");
    let expiry = null;
    const now = new Date();
    if (offerDuration === '1h') expiry = new Date(now.getTime() + (3600000)).toISOString();
    else if (offerDuration === '24h') expiry = new Date(now.getTime() + (86400000)).toISOString();
    else if (offerDuration === 'custom' && customDate) expiry = new Date(customDate).toISOString();

    let targets = [];
    if (marketingTarget === 'all') targets = products;
    else if (marketingTarget === 'collection') targets = products.filter(p => p.collection === marketingValue);
    else if (marketingTarget === 'category') targets = products.filter(p => p.category === marketingValue);
    else if (marketingTarget === 'visor') targets = products.filter(p => p.type === marketingValue);
    else if (marketingTarget === 'product') targets = products.filter(p => p.id === marketingValue);

    if (targets.length === 0) return showToast("Sin productos seleccionados", "error");

    const batch = writeBatch(db);
    targets.forEach(p => batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id), { discount: parseInt(marketingPercent), discountExpiry: expiry }));
    await batch.commit();
    showToast("Oferta aplicada", "success");
    setMarketingValue(""); setMarketingPercent("");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">

      {/* HEADER PRINCIPAL RESPONSIVE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none text-black">Control Center</h1>
          <p className="text-zinc-400 font-medium tracking-wide mt-2 uppercase text-xs">Gestión de inventario y pedidos T&E</p>
        </div>

        {/* NAVEGACIÓN SCROLLABLE EN MÓVIL */}
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm min-w-max">
            {['products', 'inbox', 'settings', 'marketing'].map(tab => (
              <button key={tab} onClick={() => setAdminTab(tab)} className={`px-4 md:px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer outline-none whitespace-nowrap ${adminTab === tab ? "bg-black text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}>
                {tab === 'products' && 'Productos'}
                {tab === 'inbox' && 'Buzón'}
                {tab === 'settings' && 'Ajustes'}
                {tab === 'marketing' && 'Ofertas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS (1 Columna Móvil / 3 Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-zinc-200 group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700"><CreditCard size={100} /></div>
          <div className="relative z-10"><div className="flex items-center gap-3 mb-4 text-blue-400"><div className="p-2 bg-blue-500/20 rounded-lg"><TrendingUp size={20} /></div><span className="text-xs font-black uppercase tracking-widest">Ingresos</span></div><h3 className="text-3xl md:text-4xl font-black tracking-tighter">{formatCOP(totalRevenue)}</h3></div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 text-zinc-50 transform group-hover:rotate-12 transition-transform duration-500"><Package size={120} /></div>
          <div className="relative z-10 text-black"><div className="flex items-center gap-3 mb-4 text-orange-500"><div className="p-2 bg-orange-100 rounded-lg"><Package size={20} /></div><span className="text-xs font-black uppercase tracking-widest">Ventas</span></div><h3 className="text-3xl md:text-4xl font-black tracking-tighter text-black">{totalUnits} <span className="text-lg text-zinc-300">unds.</span></h3></div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10 text-black"><div className="flex items-center gap-3 mb-4 text-green-600"><div className="p-2 bg-green-100 rounded-lg"><Inbox size={20} /></div><span className="text-xs font-black uppercase tracking-widest">Mensajes</span></div><h3 className="text-3xl md:text-4xl font-black tracking-tighter text-black">{messages.length}</h3><p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-wider">Contactos recibidos</p></div>
        </div>
      </div>

      {/* --- VISTA PRODUCTOS --- */}
      {adminTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* FORMULARIO (Apilado en móvil) */}
          <div className="lg:col-span-4 text-black order-1">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm lg:sticky lg:top-24 text-black">
              <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight leading-none">{editingId ? <Pencil className="text-orange-500" /> : <Plus className="text-blue-600" />} {editingId ? "Editar" : "Nuevo Ingreso"}</h2>

              <form className="space-y-6" onSubmit={handleSaveProduct}>

                <div className="space-y-4">

                  {/* --- FILA 1: MODELO Y MARCA --- */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Modelo</label>
                      <input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Marca</label>
                      <input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} required />
                    </div>
                  </div>

                  {/* --- FILA 2: VISERA Y CATEGORÍA (AHORA ESTÁ ARRIBA) --- */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Visera</label>
                      <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })} required>
                        <option value="">...</option>
                        {visors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoría</label>
                      <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required>
                        <option value="">...</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* --- FILA 3: COLECCIÓN (75%) Y TALLA (25%) (AHORA ESTÁ ABAJO) --- */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Colección / Drop</label>
                      <select className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm outline-none font-bold cursor-pointer text-black" value={newProduct.collection} onChange={e => setNewProduct({ ...newProduct, collection: e.target.value })} required>
                        <option value="">Seleccionar...</option>
                        {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Talla</label>
                      <input className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-black text-center" placeholder="Ej: L" value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })} />
                    </div>
                  </div>

                </div>

                {/* --- FILA 4: PRECIOS Y STOCK --- */}
                <div className="grid grid-cols-3 gap-3 font-bold text-black">
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio</label><input type="number" step="1" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock</label><input type="number" min="1" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dcto%</label><input type="number" className="w-full border border-zinc-100 bg-zinc-50 rounded-xl px-3 py-3 text-sm outline-none font-bold text-black" value={newProduct.discount} onChange={e => setNewProduct({ ...newProduct, discount: e.target.value })} /></div>
                </div>

                {/* --- SECCIÓN IMAGEN --- */}
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex gap-4 items-center">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      📸 Imagen del Producto
                    </label>
                    <ImageUploader
                      onFileSelect={(file, previewUrl) => {
                        setFileToUpload(file); // Guardamos el archivo real para después
                        setNewProduct(prev => ({ ...prev, image: previewUrl })); // Mostramos la preview local
                      }}
                    />
                  </div>
                  {newProduct.image && (
                    <div className="flex-shrink-0">
                      <img src={newProduct.image} alt="Preview" className="w-16 h-16 rounded-lg border border-zinc-200 object-cover bg-white shadow-sm" />
                    </div>
                  )}
                </div>

                {/* --- OPCIONES EXTRA --- */}
                <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="hideProduct" checked={newProduct.isHidden} onChange={e => setNewProduct({ ...newProduct, isHidden: e.target.checked })} className="w-5 h-5 accent-black cursor-pointer" />
                    <label htmlFor="hideProduct" className="text-xs font-black uppercase text-zinc-500 cursor-pointer flex items-center gap-2"><EyeOff size={14} /> Ocultar en Tienda</label>
                  </div>
                  {!editingId && (
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
                      <input type="checkbox" id="notifySubs" checked={notifySubscribers} onChange={e => setNotifySubscribers(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                      <label htmlFor="notifySubs" className="text-xs font-black uppercase text-blue-600 cursor-pointer flex items-center gap-2"><Send size={14} /> Enviar Alerta Email</label>
                    </div>
                  )}
                </div>

                {/* --- BOTONES --- */}
                <div className="flex gap-2">
                  {editingId && <button type="button" onClick={cancelEditing} className="w-1/3 bg-zinc-200 text-black font-black py-5 rounded-2xl hover:bg-zinc-300 transition-all cursor-pointer outline-none uppercase tracking-widest text-xs">Cancelar</button>}
                  <button
                    type="submit"
                    disabled={isUploading} // Bloquear para evitar doble click
                    className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl cursor-pointer outline-none uppercase tracking-widest text-xs flex justify-center items-center gap-2
      ${editingId ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}
      ${isUploading ? "opacity-75 cursor-wait" : ""}
    `}
                  >
                    {/* Lógica del texto del botón */}
                    {isUploading
                      ? "⏳ Subiendo y Guardando..."
                      : (editingId ? "Guardar Cambios" : "Publicar")
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* TABLA INVENTARIO (Ahora order-2 en móvil) */}
          <div className="lg:col-span-8 space-y-10 text-black order-2">
            <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden text-black">
              {/* Header Tabla */}
              <div className="p-6 md:p-8 bg-zinc-50/50 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><h2 className="text-black font-black uppercase tracking-tight">Inventario Live</h2><span className="text-[10px] tracking-widest opacity-40 text-black font-bold">{filteredInventory.length} Resultados</span></div>
                <div className="relative group w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition" size={16} /><input type="text" placeholder="Filtrar..." className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none w-full sm:w-64 text-sm font-bold text-black" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} /></div>
              </div>

              {/* CONTENEDOR RESPONSIVE PARA TABLA (Scroll Horizontal) */}
              <div className="overflow-x-auto text-black">
                <table className="w-full text-left text-black min-w-[600px]"> {/* Min-width fuerza el scroll en pantallas pequeñas */}
                  <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-400 font-black tracking-widest text-black"><tr><th className="px-6 md:px-8 py-4">Gorra / Drop</th><th className="px-6 md:px-8 py-4 text-center">Stock</th><th className="px-6 md:px-8 py-4 text-center">Ventas</th><th className="px-6 md:px-8 py-4 text-right">Acción</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 text-black">
                    {filteredInventory.map(p => (
                      <tr key={p.id} className={`hover:bg-zinc-50/80 transition-all text-black ${p.isHidden ? 'opacity-60 bg-zinc-50' : ''}`}>
                        <td className="px-6 md:px-8 py-5 text-black">
                          <div className="flex items-center gap-4 text-black">
                            <div className="relative flex-shrink-0"><img src={formatImageUrl(p.image)} className="w-12 h-12 rounded-xl object-cover shadow-sm text-black" />{p.isHidden && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"><EyeOff size={16} className="text-white" /></div>}</div>
                            <div className="uppercase text-black"><p className="font-black text-zinc-900 leading-none text-sm text-black flex items-center gap-2 whitespace-nowrap">{p.name}{p.isHidden && <span className="text-[8px] bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-500">OCULTO</span>}</p><p className="text-[10px] text-blue-600 font-bold mt-1 tracking-widest text-black whitespace-nowrap">{p.collection} • {p.type}</p></div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-center text-black"><span className={`text-xs font-black px-3 py-1 rounded-lg text-black ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-100'}`}>{p.stock}</span></td>
                        <td className="px-6 md:px-8 py-5 text-center font-bold text-zinc-500 text-sm text-black">{p.sales || 0}</td>
                        <td className="px-6 md:px-8 py-5 text-right text-black"><div className="flex justify-end gap-2"><button onClick={() => handleMarkAsSold(p.id)} disabled={p.stock === 0} className={`text-[10px] font-black px-3 py-2 rounded-xl uppercase transition shadow-sm cursor-pointer whitespace-nowrap ${p.stock === 0 ? 'bg-zinc-100 text-zinc-400 !cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'}`}>Vendido</button><button onClick={() => startEditing(p)} className="text-zinc-300 hover:text-blue-600 cursor-pointer p-2 transition"><Pencil size={18} /></button><button onClick={() => requestDeleteProduct(p.id, p.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer p-2 transition"><Trash2 size={18} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SOLICITUDES (Responsive) */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm text-black">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight text-orange-600 text-black"><Bell size={24} /> Solicitudes Stock</h2>
                <div className="relative group w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition" size={16} /><input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none w-full sm:w-64 text-sm font-bold text-black" value={requestSearch} onChange={(e) => setRequestSearch(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-black max-h-[600px] overflow-y-auto pr-2">
                {filteredReservations.map((res, i) => (
                  <div key={i} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:border-orange-200 transition text-black">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{res.date}</span><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {res.id.slice(0, 4)}</span></div>
                      <h4 className="font-black text-lg uppercase leading-none mb-3 break-words">{res.productName}</h4>
                      <div className="space-y-1"><p className="flex items-center gap-2 text-xs text-zinc-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-100 w-fit max-w-full truncate"><Mail size={12} className="text-zinc-400 flex-shrink-0" /> <span className="truncate">{res.email}</span></p><p className="flex items-center gap-2 text-xs text-zinc-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-100 w-fit"><Phone size={12} className="text-zinc-400" /> {res.phone}</p></div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button onClick={() => handleWhatsAppNotify(res.phone, res.productName, 'available')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white p-3 rounded-xl transition cursor-pointer"><MessageCircle size={18} /></button>
                      <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reservations', res.id)); showToast("Eliminada", "success"); }} className="bg-white border border-zinc-200 text-zinc-300 hover:text-red-500 hover:border-red-200 p-3 rounded-xl transition cursor-pointer shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA BUZÓN (Responsive) --- */}
      {adminTab === 'inbox' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm text-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight text-blue-600 text-black"><Inbox size={24} /> Mensajes Recibidos</h2>
              <div className="relative group w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition" size={16} /><input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none w-full sm:w-64 text-sm font-bold text-black" value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} /></div>
            </div>

            <div className="space-y-4">
              {filteredMessages.length === 0 ? <div className="py-20 text-center flex flex-col items-center opacity-40"><Inbox size={48} className="mb-4 text-zinc-300" /><p className="font-bold text-zinc-400 uppercase tracking-widest">Buzón Vacío</p></div> :
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <div><div className="flex items-center gap-2 mb-2"><span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">{msg.date}</span><h3 className="font-black text-lg text-black">{msg.name}</h3></div><div className="flex flex-wrap gap-2 text-xs font-bold text-zinc-500"><span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-zinc-200 break-all"><Mail size={12} /> {msg.email}</span><span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-zinc-200"><Phone size={12} /> {msg.phone}</span></div></div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end"><button onClick={() => handleReplyMessage(msg.phone, msg.name)} className="bg-green-100 text-green-700 p-2 rounded-xl hover:bg-green-600 hover:text-white transition" title="Responder WhatsApp"><MessageCircle size={18} /></button><a href={`mailto:${msg.email}`} className="bg-blue-100 text-blue-700 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition" title="Responder Email"><Mail size={18} /></a><button onClick={() => setItemToDelete({ type: 'message', id: msg.id, name: `Mensaje de ${msg.name}` })} className="bg-red-50 text-red-400 p-2 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={18} /></button></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-zinc-100 text-sm font-medium text-zinc-600 italic break-words">"{msg.message}"</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA AJUSTES (1 Columna Móvil / 3 Desktop) --- */}
      {adminTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-black">
          {/* Colecciones */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 text-black">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Layers className="text-blue-600" /> Colecciones</h2>
            <form onSubmit={handleSaveCollection} className="space-y-4 mb-8 text-black">
              <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Nombre" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })} required />
              <div className="flex items-center gap-2 px-2 text-black"><input type="checkbox" id="ltd" checked={newCol.isLimited} onChange={e => setNewCol({ ...newCol, isLimited: e.target.checked })} className="cursor-pointer" /><label htmlFor="ltd" className="text-xs font-black uppercase text-zinc-400 cursor-pointer">¿Tiempo Limitado?</label></div>
              {newCol.isLimited && <input type="date" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" value={newCol.expiry} onChange={e => setNewCol({ ...newCol, expiry: e.target.value })} />}
              <div className="flex gap-2">{editingColId && <button type="button" onClick={() => { setEditingColId(null); setNewCol({ name: "", isLimited: false, expiry: "" }); }} className="w-1/3 bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase">Cancelar</button>}<button className={`w-full text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer outline-none ${editingColId ? "bg-orange-500" : "bg-black"}`}>{editingColId ? "Actualizar" : "Crear"}</button></div>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">{collections.map(c => (<div key={c.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black"><span className="text-xs font-bold uppercase text-black">{c.name} {c.isLimited && "⏳"}</span><div className="flex gap-2"><button onClick={() => startEditingCollection(c)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteCollection(c.id, c.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div></div>))}</div>
          </div>
          {/* Categorías */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Filter className="text-blue-600" /> Categorías</h2>
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-2 mb-8 text-black">
              <div className="flex gap-2"><input className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Nombre" value={newCat} onChange={e => setNewCat(e.target.value)} required /><button className={`text-white p-3 rounded-xl cursor-pointer outline-none ${editingCatId ? "bg-orange-500" : "bg-blue-600"}`}>{editingCatId ? <Pencil size={20} /> : <Plus size={20} />}</button></div>
              {editingCatId && <button type="button" onClick={() => { setEditingCatId(null); setNewCat(""); }} className="text-xs font-bold uppercase text-zinc-400 hover:text-red-500 self-end">Cancelar Edición</button>}
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">{categories.map(c => (<div key={c.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black"><span className="text-xs font-bold uppercase text-black">{c.name}</span><div className="flex gap-2"><button onClick={() => startEditingCategory(c)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteCategory(c.id, c.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div></div>))}</div>
          </div>
          {/* Viseras */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 text-black">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-black"><Settings className="text-blue-600" /> Viseras</h2>
            <form onSubmit={handleSaveVisor} className="flex flex-col gap-2 mb-8 text-black">
              <div className="flex gap-2"><input className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" placeholder="Nombre" value={newVisor} onChange={e => setNewVisor(e.target.value)} required /><button className={`text-white p-3 rounded-xl cursor-pointer outline-none ${editingVisorId ? "bg-orange-500" : "bg-blue-600"}`}>{editingVisorId ? <Pencil size={20} /> : <Plus size={20} />}</button></div>
              {editingVisorId && <button type="button" onClick={() => { setEditingVisorId(null); setNewVisor(""); }} className="text-xs font-bold uppercase text-zinc-400 hover:text-red-500 self-end">Cancelar Edición</button>}
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto text-black">{visors.map(v => (<div key={v.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-black"><span className="text-xs font-bold uppercase text-black">{v.name}</span><div className="flex gap-2"><button onClick={() => startEditingVisor(v)} className="text-zinc-300 hover:text-blue-600 cursor-pointer outline-none"><Pencil size={14} /></button><button onClick={() => requestDeleteVisor(v.id, v.name)} className="text-zinc-300 hover:text-red-500 cursor-pointer outline-none"><X size={14} /></button></div></div>))}</div>
          </div>
        </div>
      )}

      {/* --- VISTA MARKETING (Responsive) --- */}
      {adminTab === 'marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-black">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-black mb-2 flex items-center gap-3 uppercase tracking-tight leading-none text-black"><Tag className="text-pink-600" /> Crear Campaña</h2>
            <p className="text-zinc-400 text-xs font-bold mb-8 uppercase tracking-wide">Configura descuentos masivos por tiempo limitado.</p>
            <form onSubmit={handleApplyDiscount} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">¿A qué aplicamos el descuento?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['all', 'collection', 'category', 'visor'].map(t => (
                    <button key={t} type="button" onClick={() => setMarketingTarget(t)} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${marketingTarget === t ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                      {t === 'all' && 'Todo'}
                      {t === 'collection' && 'Colección'}
                      {t === 'category' && 'Categoría'}
                      {t === 'visor' && 'Visera'}
                    </button>
                  ))}
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
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Porcentaje</label>
                <div className="relative"><Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="number" min="0" max="100" placeholder="Ej: 20" className="w-full pl-12 pr-4 py-3 border border-zinc-100 bg-zinc-50 rounded-xl text-sm outline-none font-bold text-black" value={marketingPercent} onChange={(e) => setMarketingPercent(e.target.value)} required /></div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Duración</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOfferDuration('permanent')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === 'permanent' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>Indefinida</button>
                  <button type="button" onClick={() => setOfferDuration('1h')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === '1h' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>⚡ 1h</button>
                  <button type="button" onClick={() => setOfferDuration('24h')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === '24h' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>🔥 24h</button>
                  <button type="button" onClick={() => setOfferDuration('custom')} className={`p-3 rounded-xl text-xs font-bold uppercase border transition ${offerDuration === 'custom' ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>📅 Fecha</button>
                </div>
                {offerDuration === 'custom' && (<div className="animate-slide-up mt-2"><input type="datetime-local" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold outline-none text-black" value={customDate} onChange={(e) => setCustomDate(e.target.value)} required /></div>)}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => { setMarketingPercent("0"); handleApplyDiscount({ preventDefault: () => { } }); }} className="bg-zinc-100 text-zinc-500 font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"><RefreshCcw size={16} /> Restablecer</button>
                <button type="submit" className="bg-pink-600 text-white font-black py-4 rounded-2xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 uppercase tracking-widest text-xs">Aplicar</button>
              </div>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-pink-50 p-6 md:p-8 rounded-[2.5rem] border border-pink-100 text-pink-900">
              <h3 className="font-black uppercase text-xl mb-4">Resumen</h3>
              <p className="font-medium text-sm mb-6">Estás a punto de aplicar un <span className="font-black text-2xl">{marketingPercent || 0}% OFF</span> a:</p>
              <div className="bg-white/50 p-6 rounded-3xl border border-white/50 break-words">
                {marketingTarget === 'all' && <span className="font-black text-lg uppercase">📦 Todo el Inventario</span>}
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

      {/* MODAL BORRADO RESPONSIVE */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl animate-slide-up mx-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black uppercase text-black mb-2">¿Estás seguro?</h3>
            <p className="text-zinc-500 font-medium text-sm mb-8 break-words">Vas a eliminar permanentemente: <br /><span className="text-black font-black">"{itemToDelete.name}"</span></p>
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