import React, { useEffect, useState, useRef } from 'react';
import { Shop } from '../types';
import { MapPin, Navigation, Compass, ShieldCheck, Sparkles, LocateFixed, Eye } from 'lucide-react';

interface MockMapProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  userCoordinates?: { lat: number; lng: number };
  activeHomeServiceBarber?: { name: string; eta: number; status: string } | null;
  userAddress?: string;
  onMapClick?: () => void;
  theme?: 'dark' | 'light';
}

export default function MockMap({
  shops,
  selectedShop,
  onSelectShop,
  userCoordinates = { lat: 17.6868, lng: 83.2185 },
  activeHomeServiceBarber,
  userAddress,
  onMapClick,
  theme = 'dark'
}: MockMapProps) {
  const [zoom, setZoom] = useState(13);
  const [transitPercent, setTransitPercent] = useState(0);
  const [hoveredShop, setHoveredShop] = useState<Shop | null>(null);
  const [radarAngle, setRadarAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate transit for home service barber tracking
  useEffect(() => {
    let intervalId: any;
    if (activeHomeServiceBarber) {
      intervalId = setInterval(() => {
        setTransitPercent((prev) => {
          if (prev >= 100) return 0; // Loop tracking
          return prev + 1;
        });
      }, 350);
    } else {
      setTransitPercent(0);
    }
    return () => clearInterval(intervalId);
  }, [activeHomeServiceBarber]);

  // Live Radar Sweep Animation loop
  useEffect(() => {
    let animationFrameId: number;
    const animateSweep = () => {
      setRadarAngle((prev) => (prev + 0.03) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(animateSweep);
    };
    animationFrameId = requestAnimationFrame(animateSweep);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Handle rendering of our stunning stylized Vector Radar Map inside HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const isLight = theme === 'light';

    // Clear Canvas with theme background
    ctx.fillStyle = isLight ? '#F8FAFC' : '#0A0A0A';
    ctx.fillRect(0, 0, width, height);

    // Render Cyber Grid
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 36;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Concentric Radar Distance Rings
    const userX = width * 0.5;
    const userY = height * 0.55;
    const maxRadius = Math.max(width, height) * 0.6;

    for (let r = 40; r < maxRadius; r += 50) {
      ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.10)' : 'rgba(212, 175, 55, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(userX, userY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dynamic Rotating Radar Sweep Beam
    const sweepGradient = ctx.createRadialGradient(userX, userY, 10, userX, userY, maxRadius);
    if (isLight) {
      sweepGradient.addColorStop(0, 'rgba(217, 119, 6, 0.20)');
      sweepGradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
      sweepGradient.addColorStop(1, 'rgba(217, 119, 6, 0)');
    } else {
      sweepGradient.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
      sweepGradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.10)');
      sweepGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
    }

    ctx.save();
    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(userX, userY);
    ctx.arc(userX, userY, maxRadius, radarAngle, radarAngle + 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw primary arterial avenues
    ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.20)' : 'rgba(212, 175, 55, 0.12)';
    ctx.lineWidth = 3;
    
    // Diagonal Avenue
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Horizontal Ring Road
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width, height * 0.6);
    ctx.stroke();

    // Vertical Central Boulevard
    ctx.beginPath();
    ctx.moveTo(width * 0.45, 0);
    ctx.lineTo(width * 0.45, height);
    ctx.stroke();

    // Draw User Location (Center coordinate)
    ctx.fillStyle = isLight ? 'rgba(37, 99, 235, 0.18)' : 'rgba(59, 130, 246, 0.20)';
    ctx.beginPath();
    ctx.arc(userX, userY, 20 + Math.sin(Date.now() / 250) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(userX, userY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Shops on Map
    shops.forEach((shop) => {
      const dx = (shop.coordinates.lng - userCoordinates.lng) * 4500;
      const dy = -(shop.coordinates.lat - userCoordinates.lat) * 4500;

      const shopX = userX + dx;
      const shopY = userY + dy;

      const isSel = selectedShop?.id === shop.id;
      const isHov = hoveredShop?.id === shop.id;

      // Ensure coordinates sit in visible boundaries
      const boundedX = Math.max(25, Math.min(width - 25, shopX));
      const boundedY = Math.max(25, Math.min(height - 25, shopY));

      // Pulse circle for selected/featured
      if (shop.isVerified || isSel || isHov) {
        ctx.fillStyle = isLight 
          ? (isSel ? 'rgba(217, 119, 6, 0.30)' : 'rgba(217, 119, 6, 0.15)')
          : (isSel ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.15)');
        ctx.beginPath();
        ctx.arc(boundedX, boundedY, isSel ? 20 : 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stylized Pin
      ctx.fillStyle = isLight
        ? (isSel ? '#D97706' : '#B45309')
        : (isSel ? '#EAB308' : '#D4AF37');
      ctx.beginPath();
      ctx.arc(boundedX, boundedY, isSel ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isLight ? '#FFFFFF' : '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Badge Label
      const labelText = shop.name;
      ctx.font = isSel ? 'bold 11px sans-serif' : '10px sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 10, 0.90)';
      ctx.fillRect(boundedX - textWidth / 2 - 4, boundedY - 24, textWidth + 8, 15);
      
      ctx.strokeStyle = isLight
        ? (isSel ? 'rgba(217, 119, 6, 0.6)' : 'rgba(203, 213, 225, 0.8)')
        : (isSel ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.15)');
      ctx.strokeRect(boundedX - textWidth / 2 - 4, boundedY - 24, textWidth + 8, 15);

      ctx.fillStyle = isLight ? '#0F172A' : (isSel ? '#FACC15' : '#FFFFFF');
      ctx.textAlign = 'center';
      ctx.fillText(labelText, boundedX, boundedY - 13);
    });

    // Draw active home service tracking line (if transit is active)
    if (activeHomeServiceBarber && selectedShop) {
      const sDx = (selectedShop.coordinates.lng - userCoordinates.lng) * 4500;
      const sDy = -(selectedShop.coordinates.lat - userCoordinates.lat) * 4500;
      const startX = Math.max(20, Math.min(width - 20, userX + sDx));
      const startY = Math.max(20, Math.min(height - 20, userY + sDy));

      ctx.strokeStyle = isLight ? '#D97706' : '#EAB308';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(userX, userY);
      ctx.stroke();
      ctx.setLineDash([]);

      const tRatio = transitPercent / 100;
      const barbX = startX + (userX - startX) * tRatio;
      const barbY = startY + (userY - startY) * tRatio;

      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(barbX, barbY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.fillRect(barbX - 35, barbY - 26, 70, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(`TRANSIT ${transitPercent}%`, barbX, barbY - 16);
    }
  }, [shops, selectedShop, hoveredShop, userCoordinates, activeHomeServiceBarber, transitPercent, radarAngle, theme]);

  const isLight = theme === 'light';

  return (
    <div 
      onClick={onMapClick}
      className={`relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        isLight 
          ? 'border-slate-200 bg-slate-50 shadow-md' 
          : 'border-white/10 bg-zinc-950 shadow-2xl'
      } ${onMapClick ? 'cursor-pointer hover:border-amber-500/50 hover:shadow-lg' : ''}`}
    >
      {/* Background canvas rendering */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Radar Status HUD */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
        <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 pointer-events-auto transition-all shadow-sm ${
          isLight 
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' 
            : 'bg-black/75 border-white/10 text-white'
        }`}>
          <Compass className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          <span className="text-[11px] font-bold tracking-wide">Live GPS Radar Sweep</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        
        <div className="flex gap-1.5 pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setZoom(z => Math.min(16, z + 1));
            }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition shadow-sm cursor-pointer ${
              isLight 
                ? 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-100' 
                : 'bg-black/75 border-white/10 text-white hover:bg-zinc-800'
            }`}
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setZoom(z => Math.max(10, z - 1));
            }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition shadow-sm cursor-pointer ${
              isLight 
                ? 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-100' 
                : 'bg-black/75 border-white/10 text-white hover:bg-zinc-800'
            }`}
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Bottom Telemetry HUD overlay */}
      <div className={`absolute bottom-3 left-3 right-3 backdrop-blur-md border rounded-xl p-3 flex sm:flex-row flex-col items-center justify-between gap-2.5 text-xs transition-all shadow-lg ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/60' 
          : 'bg-black/85 border-white/10 text-white'
      }`}>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="truncate">
            <p className={`text-[9px] uppercase tracking-widest font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Current Radar Center</p>
            <p className={`font-bold text-[11px] truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{userAddress || 'Visakhapatnam, Andhra Pradesh'}</p>
          </div>
        </div>

        {activeHomeServiceBarber ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 py-1 px-3 rounded-full font-mono text-[10px] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Home Transit: {activeHomeServiceBarber.name} ETA ~{Math.max(1, Math.round(15 * (1 - transitPercent / 100)))} mins</span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>{shops.length} Salons In Coverage</span>
          </div>
        )}
      </div>
    </div>
  );
}
