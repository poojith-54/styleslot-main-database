import React, { useEffect, useState, useRef } from 'react';
import { Shop } from '../types';
import { MapPin, Navigation, Compass, ShieldCheck } from 'lucide-react';

interface MockMapProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  userCoordinates?: { lat: number; lng: number };
  activeHomeServiceBarber?: { name: string; eta: number; status: string } | null;
  userAddress?: string;
  onMapClick?: () => void;
}

export default function MockMap({
  shops,
  selectedShop,
  onSelectShop,
  userCoordinates = { lat: 37.7749, lng: -122.4194 },
  activeHomeServiceBarber,
  userAddress,
  onMapClick
}: MockMapProps) {
  const [zoom, setZoom] = useState(13);
  const [transitPercent, setTransitPercent] = useState(0);
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

  // Handle rendering of our stunning stylized Vector Map inside HTML5 Canvas
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

    // Clear Canvas with deep slate/charcoal background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Render Cyber Neon Streets Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
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

    // Draw primary golden arterial avenues & transit highways (San Francisco simulation)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.lineWidth = 4;
    
    // Diagonal Broadway Express
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Horizontal Market St
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width, height * 0.6);
    ctx.stroke();

    // Vertical Van Ness Ave
    ctx.beginPath();
    ctx.moveTo(width * 0.45, 0);
    ctx.lineTo(width * 0.45, height);
    ctx.stroke();

    // Draw central parks/luxury business circles as subtle translucent blobs
    ctx.fillStyle = 'rgba(212, 175, 55, 0.02)';
    ctx.beginPath();
    ctx.arc(width * 0.45, height * 0.6, 60, 0, Math.PI * 2);
    ctx.fill();

    // Draw User Location (The blue pulse center coordinate)
    const userX = width * 0.5;
    const userY = height * 0.55;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.beginPath();
    ctx.arc(userX, userY, 24 + Math.sin(Date.now() / 300) * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(userX, userY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Shops on Map
    shops.forEach((shop, index) => {
      // Map lat/lng delta to local coordinates around center user location
      const dx = (shop.coordinates.lng - userCoordinates.lng) * 4500;
      const dy = -(shop.coordinates.lat - userCoordinates.lat) * 4500;

      const shopX = userX + dx;
      const shopY = userY + dy;

      const isSel = selectedShop?.id === shop.id;

      // Ensure coordinates sit in visible map boundaries
      const boundedX = Math.max(20, Math.min(width - 20, shopX));
      const boundedY = Math.max(20, Math.min(height - 20, shopY));

      // Draw pulse signal for featured shops
      if (shop.isFeatured || isSel) {
        ctx.fillStyle = isSel ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.1)';
        ctx.beginPath();
        ctx.arc(boundedX, boundedY, isSel ? 18 : 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stylized pin
      ctx.fillStyle = isSel ? '#EAB308' : '#D4AF37'; // gold
      ctx.beginPath();
      ctx.arc(boundedX, boundedY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text label
      ctx.fillStyle = isSel ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = isSel ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      
      // Draw background tag for premium readability
      const labelText = shop.name;
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
      ctx.fillRect(boundedX - textWidth / 2 - 4, boundedY - 24, textWidth + 8, 14);
      ctx.strokeStyle = isSel ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)';
      ctx.strokeRect(boundedX - textWidth / 2 - 4, boundedY - 24, textWidth + 8, 14);

      ctx.fillStyle = isSel ? '#FACC15' : 'rgba(255,255,255,0.85)';
      ctx.fillText(labelText, boundedX, boundedY - 14);
    });

    // Draw active home service tracking line (if transit is active)
    if (activeHomeServiceBarber && selectedShop) {
      const sDx = (selectedShop.coordinates.lng - userCoordinates.lng) * 4500;
      const sDy = -(selectedShop.coordinates.lat - userCoordinates.lat) * 4500;
      const startX = Math.max(20, Math.min(width - 20, userX + sDx));
      const startY = Math.max(20, Math.min(height - 20, userY + sDy));

      // Draw direct route line representing real-time navigation path
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(userX, userY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Calculate barber current pixel on transit interval
      const tRatio = transitPercent / 100;
      const barbX = startX + (userX - startX) * tRatio;
      const barbY = startY + (userY - startY) * tRatio;

      // Animated Barber motorcycle/delivery dot
      ctx.fillStyle = '#10B981'; // vibrant green for tracker
      ctx.beginPath();
      ctx.arc(barbX, barbY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floating indicator label above barber
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillRect(barbX - 35, barbY - 26, 70, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(`TRANSIT ${transitPercent}%`, barbX, barbY - 16);
    }
  }, [shops, selectedShop, userCoordinates, activeHomeServiceBarber, transitPercent]);

  return (
    <div 
      onClick={onMapClick}
      className={`relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 backdrop-blur-md ${onMapClick ? 'cursor-pointer hover:border-yellow-500/40 transition-all' : ''}`}
    >
      {/* Background canvas rendering */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating navigation overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        <div className="bg-black/70 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
          <span className="text-xs font-semibold text-white tracking-wide">Live GPS Simulator</span>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setZoom(z => Math.min(16, z + 1))}
            className="w-8 h-8 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center text-white text-sm hover:bg-zinc-800 transition"
          >
            +
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(10, z - 1))}
            className="w-8 h-8 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center text-white text-sm hover:bg-zinc-800 transition"
          >
            -
          </button>
        </div>
      </div>

      {/* Bottom telemetry HUD overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md border border-white/10 rounded-xl p-3 flex sm:flex-row flex-col items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Your Location</p>
            <p className="font-semibold text-white">{userAddress || '412 Gold Avenue Block, San Francisco'}</p>
          </div>
        </div>

        {activeHomeServiceBarber ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-3 rounded-full font-mono text-[11px] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>StyleSlot Delivery: {activeHomeServiceBarber.name} ETA ~{Math.max(1, Math.round(15 * (1 - transitPercent / 100)))} mins</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
            <span>Interactive booking coverage active</span>
          </div>
        )}
      </div>
    </div>
  );
}
