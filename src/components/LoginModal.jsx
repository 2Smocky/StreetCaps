import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginModal({ isOpen, onClose, auth, setView }) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      onClose();
      setView('admin');
      setAdminEmail("");
      setAdminPassword("");
    } catch (error) {
      console.error("Error login:", error);
      setLoginError("Credenciales inválidas");
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md px-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl text-center text-black relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition"><X size={20} /></button>
        <div className="bg-zinc-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-black"><ShieldCheck size={48} className="text-blue-600" /></div>
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-black mb-2">Admin Hub</h2>
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-8">Acceso restringido T&E</p>
        <form onSubmit={handleAdminLogin} className="space-y-4 text-black text-left">
          <div><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Email Admin</label><input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-black" placeholder="admin@testreetcaps.com" required /></div>
          <div><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Contraseña</label><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-black" placeholder="••••••••" required /></div>
          {loginError && <div className="bg-red-50 text-red-600 text-xs font-black p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {loginError}</div>}
          <button type="submit" disabled={isAuthLoading} className="w-full bg-black text-white font-[900] py-5 rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-xl cursor-pointer outline-none flex justify-center items-center gap-2 mt-4">{isAuthLoading ? <Loader2 className="animate-spin" /> : "Acceder al Sistema"}</button>
        </form>
      </div>
    </div>
  );
}