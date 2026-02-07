// src/utils.js
export const formatImageUrl = (url) => {
  if (!url) return "";

  // 1. Lógica para imágenes antiguas (Google Drive)
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([-\w]+)/) || url.match(/[?&]id=([-\w]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
    }
  }

  // 2. NUEVA LÓGICA: Optimización automática para Cloudinary
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    // Si la URL aún no tiene parámetros de optimización, los agregamos
    // f_auto: elige el mejor formato (WebP/AVIF)
    // q_auto: comprime sin perder calidad visible
    if (!url.includes("f_auto,q_auto")) {
      return url.replace("/upload/", "/upload/f_auto,q_auto/");
    }
  }

  // 3. Si no es ni Drive ni Cloudinary, devuelve la original
  return url;
};

export const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};