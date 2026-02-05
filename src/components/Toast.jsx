import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export default function Toast({ notification, onClose }) {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-4 p-4 rounded-2xl shadow-2xl border animate-slide-left ${isSuccess ? 'bg-white border-green-100' : 'bg-white border-red-100'}`}>
      <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {isSuccess ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
      </div>
      <div>
        <h4 className={`font-black text-sm uppercase tracking-wider ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {isSuccess ? '¡Éxito!' : 'Error'}
        </h4>
        <p className="text-xs font-bold text-zinc-500 mt-0.5">
          {notification.message}
        </p>
      </div>
      <button onClick={onClose} className="text-zinc-300 hover:text-black transition cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
}