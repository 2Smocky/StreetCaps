import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';

export default function ReserveModal({ product, onClose, db, appId }) {
  const [reservationForm, setReservationForm] = useState({ email: "", phone: "" });

  if (!product) return null;

  const handleReserve = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reservations'), {
        productId: product.id,
        productName: product.name,
        ...reservationForm,
        date: new Date().toLocaleDateString()
      });
      onClose();
      setReservationForm({ email: "", phone: "" });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl text-black">
        <div className="flex justify-between items-start mb-10"><div><span className="text-blue-600 font-black text-xs uppercase tracking-widest">Reserva Premium</span><h2 className="text-3xl font-black uppercase tracking-tighter mt-2 leading-none">{product.name}</h2></div><button onClick={onClose} className="text-zinc-300 hover:text-black transition p-2 bg-zinc-50 rounded-full cursor-pointer outline-none"><X size={24} /></button></div>
        <div className="bg-zinc-50 p-6 rounded-3xl mb-10 flex items-start gap-4 border border-zinc-100"><Clock className="text-blue-600 shrink-0" size={24} /><p className="text-sm text-zinc-600 font-medium uppercase tracking-tight">Recibirás un alerta inmediata apenas la colección <span className="font-black text-black">{product.collection}</span> reciba nuevas piezas.</p></div>
        <form className="space-y-5 text-black" onSubmit={handleReserve}>
          <input type="email" placeholder="Tu Email" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-black" value={reservationForm.email} onChange={e => setReservationForm({...reservationForm, email: e.target.value})} required />
          <input type="tel" placeholder="WhatsApp" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-black" value={reservationForm.phone} onChange={e => setReservationForm({...reservationForm, phone: e.target.value})} required />
          <button type="submit" className="w-full bg-black text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all mt-6 shadow-xl shadow-zinc-300 uppercase tracking-widest cursor-pointer outline-none text-white">Confirmar reserva</button>
        </form>
      </div>
    </div>
  );
}