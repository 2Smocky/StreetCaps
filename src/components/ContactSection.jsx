import React, { useState } from 'react';
import { Phone, Mail } from 'lucide-react';

export default function ContactSection() {
  // 1. Estado actualizado incluyendo el 'telefono'
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.mensaje) {
      alert("Por favor completa tu nombre y el mensaje.");
      return;
    }

    // Tu número de recepción (Soporte)
    const miNumeroWhatsApp = "573165577858";

    // 2. EL MENSAJE CON EL FORMATO EXACTO QUE PEDISTE
    // Nota: Corregí "mi correo es: numero" por "mi número es: [telefono]" para que tenga sentido.
    const texto = `*NUEVO CONTACTO DESDE LA WEB* 
    
Hola, soy *${formData.nombre}* y les escribo desde el formulario de contacto.

*Mis datos:*

    • *Nombre:* ${formData.nombre}
    • *Teléfono:* ${formData.telefono}
    • *Correo:* ${formData.email}

*Motivo del mensaje:*

${formData.mensaje}

_Quedo atento a su respuesta, gracias._`;


    // Codificamos para URL
    const mensajeCodificado = encodeURIComponent(texto);

    // Abrir WhatsApp
    window.open(`https://wa.me/${miNumeroWhatsApp}?text=${mensajeCodificado}`, '_blank');
  };

  return (
    <section id="contacto" className="bg-zinc-900 py-32 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Info Lateral */}
          <div>
            <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs">Soporte al cliente</span>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mt-4 mb-8">
              Únete a la<br /><span className="text-blue-500 underline decoration-white/20">Cultura Street</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-md">
              ¿Tienes dudas sobre tu envío o buscas un modelo específico de T&E Street Caps? Escríbenos.
            </p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-white/5 p-4 rounded-2xl text-blue-500 border border-white/10">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Atención</p>
                  <p className="font-bold">+57 316 557 7858</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/5 p-4 rounded-2xl text-blue-500 border border-white/10">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</p>
                  <p className="font-bold text-sm">juanestebanbernalsilva2@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-zinc-900 text-2xl font-black uppercase mb-8">Envíanos un mensaje</h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Fila 1: Nombre y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black"
                  placeholder="Nombre"
                  required
                />
                {/* Nuevo campo de Teléfono */}
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black"
                  placeholder="Celular / WhatsApp"
                  required
                />
              </div>

              {/* Fila 2: Email (Ancho completo) */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black"
                placeholder="Email"
                required
              />

              {/* Fila 3: Mensaje */}
              <textarea
                rows="4"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                className="bg-zinc-100 text-zinc-900 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 w-full font-bold text-black"
                placeholder="¿En qué podemos ayudarte?"
                required
              ></textarea>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest cursor-pointer outline-none">
                Enviar a WhatsApp
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}