import React from 'react';
import { ShoppingCart, X, Trash2, Minus, Plus, ExternalLink } from 'lucide-react';
import { formatImageUrl, formatCOP } from '../utils';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  updateQuantity 
}) {
  if (!isOpen) return null;

  // --- FUNCIÓN HELPER PARA CALCULAR PRECIO REAL ---
  // Verifica si el descuento existe Y si la fecha aún es válida
  const getFinalPrice = (item) => {
    const hasValidDiscount = item.discount > 0 && (
      !item.discountExpiry || // Si no tiene fecha, es permanente
      new Date(item.discountExpiry) > new Date() // Si tiene fecha, ¿es futuro?
    );
    
    return hasValidDiscount 
      ? item.price * (1 - item.discount / 100) 
      : item.price;
  };

  // Calculamos el total usando el precio real (validado por fecha)
  const cartTotal = cart.reduce((acc, item) => {
    return acc + (getFinalPrice(item) * item.quantity);
  }, 0);

  const handleCheckout = () => {
    const message = `¡Hola T&E Street Caps! Quiero realizar un pedido:\n\n` +
      cart.map(item => `- ${item.name} (${item.brand}) x${item.quantity} - ${formatCOP(getFinalPrice(item) * item.quantity)}`).join('\n') +
      `\n\n*Total a pagar: ${formatCOP(cartTotal)}*`;
    
    const whatsappUrl = `https://wa.me/573118517224?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left text-black">
        
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-blue-600" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Tu Carrito</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition cursor-pointer outline-none"><X size={24} /></button>
        </div>

        {/* LISTA DE ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="bg-zinc-100 p-6 rounded-full"><ShoppingCart size={48} /></div>
              <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">Tu carrito está vacío</p>
              <button onClick={onClose} className="text-blue-600 font-bold text-xs underline cursor-pointer outline-none">Empezar a comprar</button>
            </div>
          ) : (
            cart.map(item => {
              const unitPrice = getFinalPrice(item); // Precio validado
              
              return (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 h-24 bg-zinc-100 rounded-2xl overflow-hidden shrink-0">
                    <img src={formatImageUrl(item.image)} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-zinc-900 leading-tight uppercase text-sm truncate max-w-[150px]">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500 transition cursor-pointer outline-none"><Trash2 size={16} /></button>
                    </div>
                    
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{item.brand} • {item.type}</p>
                    
                    {/* Alerta si el descuento expiró mientras estaba en el carrito */}
                    {item.discount > 0 && unitPrice === item.price && (
                       <span className="text-[10px] text-red-500 font-black uppercase">Oferta finalizada</span>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-zinc-200 rounded-lg p-1 bg-white">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600 cursor-pointer outline-none"><Minus size={14} /></button>
                        <span className="px-3 text-sm font-black text-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600 cursor-pointer outline-none"><Plus size={14} /></button>
                      </div>
                      <span className="font-black text-blue-600 text-lg">
                        {formatCOP(unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER TOTALES */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-100 bg-zinc-50 space-y-4 shadow-2xl">
            <div className="space-y-2">
              <div className="flex justify-between text-zinc-500 text-sm font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatCOP(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-green-600 text-xs font-black uppercase tracking-widest">
                <span>Envío</span>
                <span>¡Gratis!</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between items-end">
                <span className="text-zinc-900 font-black uppercase text-xl">Total</span>
                <span className="text-zinc-900 font-[900] text-3xl tracking-tighter">{formatCOP(cartTotal)}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 uppercase tracking-widest cursor-pointer outline-none"
            >
              <ExternalLink size={20} /> Pedir por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}