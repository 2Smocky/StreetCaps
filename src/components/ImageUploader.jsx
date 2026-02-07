import React from 'react';

export default function ImageUploader({ onFileSelect }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // 1. Creamos una URL temporal solo para mostrar la imagen en pantalla (Preview)
      // Esto NO sube nada a internet todavía.
      const previewUrl = URL.createObjectURL(file);
      
      // 2. Le pasamos el archivo REAL (para subirlo luego) y la URL (para verlo ahora) al padre
      onFileSelect(file, previewUrl);
    }
  };

  return (
    <div className="relative">
      {/* Botón estilizado, el input real está oculto */}
      <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-black px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-zinc-200 w-full text-center shadow-sm">
        <span>📂 Elegir Foto</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </label>
    </div>
  );
}