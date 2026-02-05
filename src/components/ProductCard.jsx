// src/components/ProductCard.jsx
import React from 'react';
import { Plus, Bell } from 'lucide-react';
import { formatImageUrl, formatCOP } from '../utils'; // Importamos las utilidades

export default function ProductCard({ product, addToCart, onReserve }) {
  
  // --- LÓGICA DE EXPIRACIÓN ---
  // Verificamos si tiene descuento Y si la fecha aún es válida
  const hasValidDiscount = product.discount > 0 && (
    !product.discountExpiry || // Si no tiene fecha, es permanente (válido)
    new Date(product.discountExpiry) > new Date() // Si tiene fecha, ¿es mayor que ahora?
  );

  // Usamos esa variable para calcular precio y mostrar etiquetas
  const isOutOfStock = product.stock === 0;
  const finalPrice = hasValidDiscount 
    ? product.price * (1 - (product.discount || 0) / 100) 
    : product.price;

  

  // Lógica para mostrar el tipo de ajuste
  const getFitType = (cat) => {
    if (['Snapback', 'Trucker', 'Strapback'].some(t => cat.includes(t))) return ' AJUSTABLE';
    if (cat.includes('Fitted')) return ' CERRADA';
    return ` ${cat.toUpperCase()}`;
  };

  return (
    <div className="relative group flex flex-col h-full text-black">
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 rounded-3xl mb-4 shadow-sm">
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm flex items-center justify-center text-center">
            <span className="text-3xl font-black text-zinc-900/40 uppercase -rotate-12 border-4 border-zinc-900/40 px-6 py-2 rounded-2xl tracking-tighter">Agotado</span>
          </div>
        )}
        <img 
          src={formatImageUrl(product.image)} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isOutOfStock ? 'grayscale' : 'group-hover:scale-110'}`} 
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {hasValidDiscount && <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl shadow-red-900/20">-{product.discount}% OFF</span>}
          <span className="bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-wider">{product.collection}</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col px-1">
        <div className="flex justify-between items-center mb-1 text-black">
          {/* AQUÍ ESTÁ TU LÓGICA DE AJUSTABLE */}
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
            {product.type} • {getFitType(product.category)} {product.size ? `• ${product.size}` : ''}
          </span>
          {!isOutOfStock && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">Stock</span>}
        </div>
        
        <h3 className="text-xl font-bold text-zinc-900 mb-2 truncate group-hover:text-blue-600 transition uppercase tracking-tight">{product.name}</h3>
        
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-black text-zinc-900 tracking-tighter">{formatCOP(finalPrice)}</span>
          {hasValidDiscount && <span className="text-sm text-zinc-400 line-through tracking-tighter">{formatCOP(product.price)}</span>}
        </div>
        
        <div className="mt-auto">
          {isOutOfStock ? (
            <button onClick={() => onReserve(product)} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer outline-none uppercase text-xs tracking-widest">
              <Bell size={16} /> Reservar Ahora
            </button>
          ) : (
            <button onClick={() => addToCart(product)} className="w-full bg-zinc-100 text-zinc-900 font-black py-4 rounded-2xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer outline-none uppercase text-xs tracking-widest">
              <Plus size={16} /> Añadir al carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}