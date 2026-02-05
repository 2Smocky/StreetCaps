import React from 'react';
import { formatImageUrl } from '../utils';

export default function Logo({ className = "h-12", light = false, imgSrc = "/logo.png" }) {
  return (
    <div className={`flex items-center gap-3 ${className} cursor-pointer`}>
      <div className={`relative h-full aspect-square flex items-center justify-center overflow-hidden`}>
        {imgSrc ? (
          <img 
            src={formatImageUrl(imgSrc)} 
            alt="T&E Logo" 
            className="w-full h-full object-contain block drop-shadow-sm" 
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{ display: 'none' }} className={`w-full h-full items-center justify-center ${light ? "bg-white/10" : "bg-black"} rounded-xl`}>
          <svg viewBox="0 0 100 100" className="h-[70%] w-[70%]">
            <g fill="white">
              <path d="M25 20 H75 V32 H56 V80 H44 V32 H25 Z" />
              <path d="M35 42 H70 V52 H48 V56 H65 V64 H48 V68 H70 V78 H35 Z" fill="#3b82f6" />
            </g>
          </svg>
        </div>
      </div>
      
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span className={`text-2xl font-[900] tracking-tighter uppercase ${light ? "text-white" : "text-black"}`}>
            T&E
          </span>
          <span className="text-blue-600 font-[900] text-lg uppercase tracking-tighter ml-1 text-nowrap">STREET</span>
        </div>
        <span className={`text-[8px] font-black tracking-[0.4em] uppercase opacity-70 ${light ? "text-zinc-400" : "text-zinc-500"} whitespace-nowrap`}>
          Authentic Headwear
        </span>
      </div>
    </div>
  );
}