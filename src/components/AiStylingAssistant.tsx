import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Upload, Bot, Send, RefreshCw, UserCheck, 
  CheckCircle2, Star, Download, Maximize2, Share2, ArrowLeftRight, 
  AlertCircle, Info, Zap, X, Trash2, Heart, Sliders, Palette
} from 'lucide-react';
import { supabase, isDemoMode } from '../supabase';

interface AiStylingAssistantProps {
  onAnalyzeComplete: (report: string) => void;
  walletBalance: number;
}

// Hairstyle model images dictionary (Unsplash references)
const MODEL_IMAGES: Record<string, string> = {
  "Modern Mullet": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400",
  "Burst Fade Mullet": "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400",
  "Low Fade": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
  "Mid Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=400",
  "High Fade": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
  "French Crop": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
  "Crew Cut": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
  "Buzz Cut": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
  "Wolf Cut": "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400",
  "Messy Fringe": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  "Side Part": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400",
  "Curtains": "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?auto=format&fit=crop&q=80&w=400",
  "Pompadour": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  "Textured Quiff": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
  "Undercut": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400",
  "Drop Fade": "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400",
  "Taper Fade": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
  "Curly Top": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
  "Long Layers": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=400",
  "Modern Slick Back": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  "Classic Taper": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
};

// Premium SVG Try-On Hairstyle definitions
const SVG_HAIRSTYLES: Record<string, {
  back?: string;   // drawn behind face
  top: string;     // main body
  details: string; // textures / strands
  fade?: string;   // overlay for fades
  defaultScale: number;
  defaultY: number;
}> = {
  "Modern Mullet": {
    back: "M 80 180 Q 70 260 100 320 Q 120 320 130 280 Q 140 320 160 320 Q 200 270 190 180 Z",
    top: "M 80 160 Q 70 80 120 70 Q 170 50 200 90 Q 210 130 200 160 Q 180 120 140 120 Q 100 120 80 160 Z",
    details: "M 100 95 Q 125 80 150 95 M 120 110 Q 140 100 160 110 M 110 160 Q 130 180 150 160 M 110 220 Q 95 260 105 290 M 165 220 Q 180 260 170 290",
    defaultScale: 1.15,
    defaultY: -10
  },
  "Burst Fade Mullet": {
    back: "M 85 190 Q 75 270 100 310 Q 125 310 130 285 Q 135 310 155 310 Q 185 270 180 190 Z",
    top: "M 85 155 Q 75 85 125 75 Q 165 65 195 95 Q 205 130 195 155 Q 180 125 145 125 Q 110 125 85 155 Z",
    details: "M 105 100 Q 125 85 145 100 M 125 115 Q 145 105 160 115 M 115 160 Q 130 175 145 160 M 120 220 Q 110 260 115 285",
    fade: "M 70 160 Q 80 185 85 200 M 210 160 Q 200 185 195 200",
    defaultScale: 1.1,
    defaultY: -8
  },
  "Low Fade": {
    top: "M 90 140 Q 80 80 130 70 Q 180 70 200 115 Q 210 140 200 140 Q 185 120 150 120 Q 115 120 90 140 Z",
    details: "M 110 95 Q 135 85 160 95 M 125 110 Q 145 100 170 110",
    fade: "M 75 145 L 85 200 L 95 210 M 215 145 L 205 200 L 195 210",
    defaultScale: 1.1,
    defaultY: -5
  },
  "Mid Fade": {
    top: "M 92 135 Q 82 78 132 68 Q 182 68 200 112 Q 208 135 200 135 Q 185 118 150 118 Q 115 118 92 135 Z",
    details: "M 112 92 Q 137 82 162 92 M 127 108 Q 147 98 172 108",
    fade: "M 78 135 Q 90 175 92 205 M 212 135 Q 200 175 198 205",
    defaultScale: 1.1,
    defaultY: -5
  },
  "High Fade": {
    top: "M 95 130 Q 85 75 135 65 Q 185 65 200 110 Q 205 130 200 130 Q 185 115 150 115 Q 115 115 95 130 Z",
    details: "M 115 90 Q 140 80 165 90 M 130 105 Q 150 95 175 105",
    fade: "M 80 125 Q 95 155 98 185 M 210 125 Q 195 155 192 185",
    defaultScale: 1.1,
    defaultY: -5
  },
  "French Crop": {
    top: "M 90 145 C 80 90, 110 70, 150 70 C 190 70, 210 90, 200 145 Q 180 135 150 135 Q 110 135 90 145 Z",
    details: "M 100 142 L 105 135 M 120 142 L 123 135 M 140 142 L 141 135 M 160 142 L 158 135 M 180 142 L 175 135 M 115 95 Q 145 85 175 95",
    fade: "M 75 145 Q 85 185 90 200 M 215 145 Q 205 185 200 200",
    defaultScale: 1.05,
    defaultY: -8
  },
  "Crew Cut": {
    top: "M 92 140 Q 85 95 135 85 Q 185 95 198 140 Q 180 130 150 130 Q 115 130 92 140 Z",
    details: "M 110 105 L 115 98 M 130 102 L 132 95 M 150 102 L 148 95 M 170 105 L 165 98",
    fade: "M 78 140 Q 88 175 92 195 M 212 140 Q 202 175 198 195",
    defaultScale: 1.08,
    defaultY: -6
  },
  "Buzz Cut": {
    top: "M 95 142 C 90 110, 110 95, 145 95 C 180 95, 200 110, 195 142 C 180 138, 160 136, 145 136 C 130 136, 110 138, 95 142 Z",
    details: "M 105 120 L 108 115 M 125 115 L 127 110 M 145 112 L 145 107 M 165 115 L 163 110 M 185 120 L 182 115",
    defaultScale: 1.02,
    defaultY: -5
  },
  "Wolf Cut": {
    back: "M 75 180 Q 55 250 90 310 Q 115 320 120 280 Q 130 320 145 320 Q 185 300 190 280 Q 205 285 210 240 Q 215 190 205 180 Z",
    top: "M 75 150 C 60 90, 100 60, 145 60 C 190 60, 230 90, 215 150 Q 185 130 145 130 Q 105 130 75 150 Z",
    details: "M 95 140 Q 120 110 145 140 M 145 140 Q 170 110 195 140 M 115 90 Q 145 75 175 90 M 90 200 Q 75 240 85 270 M 200 200 Q 215 240 205 270",
    defaultScale: 1.18,
    defaultY: -12
  },
  "Messy Fringe": {
    top: "M 85 145 C 75 90, 110 65, 150 65 C 190 65, 215 90, 205 145 C 180 155, 160 160, 145 145 C 130 130, 105 155, 85 145 Z",
    details: "M 105 105 Q 125 90 145 105 M 130 120 Q 150 110 170 120 M 100 138 L 105 146 M 120 135 L 123 145 M 140 135 L 138 145 M 165 138 L 160 148",
    defaultScale: 1.1,
    defaultY: -8
  },
  "Side Part": {
    top: "M 88 140 C 80 90, 110 70, 145 70 C 175 70, 210 85, 202 140 Q 185 130 145 132 Q 105 130 88 140 Z",
    details: "M 130 72 L 130 130 M 105 95 Q 120 85 128 92 M 145 92 Q 170 80 185 98 M 110 110 Q 122 105 128 112 M 145 112 Q 170 102 185 118",
    defaultScale: 1.08,
    defaultY: -6
  },
  "Curtains": {
    top: "M 85 145 C 75 90, 110 70, 145 70 C 180 70, 215 90, 205 145 C 190 120, 165 110, 147 122 C 145 125, 145 125, 143 122 C 125 110, 100 120, 85 145 Z",
    details: "M 145 72 L 145 105 M 105 95 Q 125 85 138 105 M 185 95 Q 165 85 152 105 M 100 120 Q 120 112 130 125 M 190 120 Q 170 112 160 125",
    defaultScale: 1.1,
    defaultY: -8
  },
  "Pompadour": {
    top: "M 85 135 C 70 80, 100 45, 145 45 C 190 45, 220 80, 205 135 Q 185 120 145 120 Q 105 120 85 135 Z",
    details: "M 105 85 Q 145 65 185 85 M 115 102 Q 145 85 175 102 M 130 112 Q 145 100 160 112 M 145 48 C 135 60, 135 90, 145 120",
    defaultScale: 1.12,
    defaultY: -12
  },
  "Textured Quiff": {
    top: "M 88 135 C 75 80, 110 55, 155 50 C 195 55, 215 90, 202 135 Q 182 122 147 122 Q 108 122 88 135 Z",
    details: "M 108 85 L 128 65 M 128 92 L 148 72 M 148 95 L 168 75 M 168 102 L 188 82 M 120 115 Q 145 100 170 115",
    fade: "M 78 135 Q 88 175 92 195 M 212 135 Q 202 175 198 195",
    defaultScale: 1.1,
    defaultY: -10
  },
  "Undercut": {
    top: "M 90 130 C 80 80, 110 60, 145 60 C 180 60, 210 80, 200 130 Q 185 115 145 115 Q 105 115 90 130 Z",
    details: "M 105 90 Q 145 75 185 90 M 115 105 Q 145 92 175 105 M 130 112 Q 145 102 160 112",
    fade: "M 75 130 L 75 190 M 215 130 L 215 190",
    defaultScale: 1.08,
    defaultY: -7
  },
  "Drop Fade": {
    top: "M 90 138 Q 80 80 130 70 Q 180 70 200 115 Q 210 138 200 138 Q 185 118 150 118 Q 115 118 90 138 Z",
    details: "M 110 95 Q 135 85 160 95 M 125 110 Q 145 100 170 110",
    fade: "M 75 142 C 78 170, 95 195, 105 210 M 215 142 C 212 170, 195 195, 185 210",
    defaultScale: 1.1,
    defaultY: -6
  },
  "Taper Fade": {
    top: "M 90 140 Q 80 80 130 70 Q 180 70 200 115 Q 210 140 200 140 Q 185 120 150 120 Q 115 120 90 140 Z",
    details: "M 110 95 Q 135 85 160 95 M 125 110 Q 145 100 170 110",
    fade: "M 75 145 L 80 180 M 215 145 L 210 180 M 90 220 L 100 235 M 200 220 L 190 235",
    defaultScale: 1.1,
    defaultY: -5
  },
  "Curly Top": {
    top: "M 85 135 C 70 80, 100 50, 145 50 C 190 50, 220 80, 205 135 Q 185 122 145 122 Q 105 122 85 135 Z",
    details: "M 105 90 A 8 8 0 1 1 115 95 M 125 80 A 10 10 0 1 1 138 88 M 150 78 A 9 9 0 1 1 162 85 M 118 108 A 8 8 0 1 1 128 112 M 145 102 A 10 10 0 1 1 158 108 M 165 98 A 8 8 0 1 1 175 102 M 135 92 A 9 9 0 1 1 145 98 M 98 105 A 7 7 0 1 1 106 110 M 182 110 A 8 8 0 1 1 190 115",
    fade: "M 78 135 Q 88 175 92 195 M 212 135 Q 202 175 198 195",
    defaultScale: 1.12,
    defaultY: -10
  },
  "Long Layers": {
    back: "M 70 150 Q 40 250 60 360 Q 90 380 110 320 Q 120 380 145 360 Q 180 380 200 320 Q 220 250 190 150 Z",
    top: "M 70 135 C 60 70, 110 50, 145 50 C 180 50, 230 70, 220 135 Q 185 120 145 120 Q 105 120 70 135 Z",
    details: "M 90 110 Q 120 90 145 110 M 145 110 Q 170 90 200 110 M 90 160 Q 75 220 80 290 M 200 160 Q 215 220 210 290 M 70 240 Q 60 290 65 330 M 220 240 Q 230 290 225 330",
    defaultScale: 1.2,
    defaultY: -15
  },
  "Modern Slick Back": {
    top: "M 90 132 C 82 85, 112 65, 145 65 C 178 65, 208 85, 200 132 Q 185 118 145 118 Q 105 118 90 132 Z",
    details: "M 100 120 C 105 105, 125 92, 145 92 C 165 92, 185 105, 190 120 M 115 112 C 120 100, 135 90, 145 90 C 155 90, 170 100, 175 112 M 130 108 C 135 98, 140 92, 145 92 C 150 92, 155 98, 160 108 M 145 68 L 145 118",
    defaultScale: 1.05,
    defaultY: -6
  },
  "Classic Taper": {
    top: "M 88 138 C 80 85, 110 68, 145 68 C 180 68, 210 85, 202 138 Q 185 122 145 124 Q 105 122 88 138 Z",
    details: "M 105 92 Q 125 80 145 92 M 145 92 Q 165 80 185 92 M 115 108 Q 135 98 155 108 M 155 108 Q 170 98 180 108",
    fade: "M 75 142 L 80 175 M 215 142 L 210 175",
    defaultScale: 1.08,
    defaultY: -6
  }
};

// Premium Hair Color Palette
const HAIR_COLORS = [
  { name: 'Natural Black', value: '#111113', gradient: ['#050505', '#1a1a1c', '#2c2c2e'] },
  { name: 'Espresso Brown', value: '#362211', gradient: ['#1c1006', '#3d2613', '#5a3d22'] },
  { name: 'Golden Blonde', value: '#cca762', gradient: ['#92702c', '#cca762', '#ebd097'] },
  { name: 'Platinum Grey', value: '#a8a8b0', gradient: ['#52525b', '#a8a8b0', '#f4f4f5'] },
  { name: 'Auburn Red', value: '#7c1a22', gradient: ['#4c050b', '#88131b', '#b91c1c'] },
  { name: 'Copper Gold', value: '#bd6515', gradient: ['#78350f', '#bd6515', '#fbbf24'] },
  { name: 'Neon Blue', value: '#2563eb', gradient: ['#1e3a8a', '#2563eb', '#60a5fa'] },
  { name: 'Emerald Green', value: '#059669', gradient: ['#064e3b', '#059669', '#34d399'] }
];

export default function AiStylingAssistant({ onAnalyzeComplete, walletBalance }: AiStylingAssistantProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'scan' | 'consult'>('scan');

  // Input states & analysis data
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [cancelRequested, setCancelRequested] = useState(false);

  // Analysis result states
  const [detectedFeatures, setDetectedFeatures] = useState<any | null>(null);
  const [hairGuide, setHairGuide] = useState<any | null>(null);
  const [bestMatches, setBestMatches] = useState<any[]>([]);
  const [goodOptions, setGoodOptions] = useState<any[]>([]);
  const [lessRecommended, setLessRecommended] = useState<any[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState('');

  // Interactive Try-On Config
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>('Modern Mullet');
  const [activeColor, setActiveColor] = useState(HAIR_COLORS[0]);
  const [tryOnScale, setTryOnScale] = useState(1.0);
  const [tryOnX, setTryOnX] = useState(0);
  const [tryOnY, setTryOnY] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragSlider, setIsDragSlider] = useState(false);

  // UI state overlays
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('styleslot_favorites_styles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // History log
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('styleslot_gen_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Camera references
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scanning animation loop
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chatbot conversation states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Greetings of elegance. I am your StyleSlot VIP virtual aesthetic director. Ask me about custom fades, face shape analysis, or beard designs." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('styleslot_favorites_styles', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('styleslot_gen_history_v2', JSON.stringify(history));
  }, [history]);

  // SVG auto alignment when hairstyle changes
  useEffect(() => {
    const layout = SVG_HAIRSTYLES[selectedHairstyle];
    if (layout) {
      setTryOnScale(layout.defaultScale);
      setTryOnY(layout.defaultY);
      setTryOnX(0);
    }
  }, [selectedHairstyle]);

  // Dragging slider tracking
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  // Canvas scanner loop
  useEffect(() => {
    if (!isScanning) return;
    let animId: number;
    let startTimestamp: number | null = null;
    const duration = 2200; // 2.2 seconds scan

    const drawScan = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      setScanProgress(Math.floor(progress * 100));

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const w = canvas.width;
          const h = canvas.height;

          // Technical grid
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
          ctx.lineWidth = 1;
          const gridSize = 16;
          for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Glowing laser sweep
          const scanY = h * (0.15 + 0.7 * Math.sin(timestamp * 0.0028 + Math.PI / 2));
          const scanGlow = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
          scanGlow.addColorStop(0, 'rgba(212, 175, 55, 0)');
          scanGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.45)');
          scanGlow.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.fillStyle = scanGlow;
          ctx.fillRect(0, scanY - 15, w, 30);

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();

          // Draw floating coordinate dots on face region
          const cx = w / 2;
          const cy = h / 2;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#D4AF37';

          const landmarks = [
            { x: cx - 45, y: cy + 40 }, { x: cx - 25, y: cy + 55 }, { x: cx, y: cy + 62 }, { x: cx + 25, y: cy + 55 }, { x: cx + 45, y: cy + 40 },
            { x: cx - 20, y: cy - 12 }, { x: cx - 8, y: cy - 10 }, { x: cx + 8, y: cy - 10 }, { x: cx + 20, y: cy - 12 },
            { x: cx, y: cy - 25 }, { x: cx, y: cy + 5 }, { x: cx - 6, y: cy + 10 }, { x: cx + 6, y: cy + 10 },
            { x: cx - 15, y: cy + 28 }, { x: cx + 15, y: cy + 28 }, { x: cx, y: cy + 34 }
          ];

          landmarks.forEach((pt, idx) => {
            const flicker = 0.3 + 0.7 * Math.sin(timestamp * 0.02 + idx);
            ctx.fillStyle = `rgba(212, 175, 55, ${flicker})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Connect neighboring dots
            if (idx > 0 && idx < 5) {
              ctx.strokeStyle = `rgba(212, 175, 55, ${flicker * 0.25})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(landmarks[idx - 1].x, landmarks[idx - 1].y);
              ctx.lineTo(pt.x, pt.y);
              ctx.stroke();
            }
          });
          ctx.shadowBlur = 0;
        }
      }

      if (progress < 1) {
        animId = requestAnimationFrame(drawScan);
      } else {
        setIsScanning(false);
        // Completed scan animation -> trigger automatic API analysis call
        handleRunAiAnalysis();
      }
    };

    animId = requestAnimationFrame(drawScan);
    return () => cancelAnimationFrame(animId);
  }, [isScanning]);

  // Compress image helper using canvas
  const compressImage = (dataUrl: string, maxWidth = 600, maxHeight = 600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            width = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  // Camera integration
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setDetectedFeatures(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access declined or unavailable', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      stopCamera();
      const compressed = await compressImage(dataUrl);
      setCapturedImage(compressed);
      setIsScanning(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(event.target.result as string);
          setCapturedImage(compressed);
          setDetectedFeatures(null);
          setIsScanning(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Generation Handler
  const handleRunAiAnalysis = async (customVal?: string) => {
    if (!capturedImage) return;

    setAnalyzing(true);
    setCancelRequested(false);

    try {
      setLoadingStep("Reading Visual Pixels...");
      await new Promise(r => setTimeout(r, 500));
      if (cancelRequested) return;

      setLoadingStep("Detecting Facial Landmarks...");
      await new Promise(r => setTimeout(r, 600));
      if (cancelRequested) return;

      setLoadingStep("Analyzing Face Shape & Symmetry...");
      await new Promise(r => setTimeout(r, 500));
      if (cancelRequested) return;

      setLoadingStep("Generating Hairstyle Strategy...");
      const response = await fetch('/api/ai/virtual-hairstylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          customRequest: customVal !== undefined ? customVal : customRequest
        })
      });

      if (!response.ok) {
        throw new Error('Server responded with status: ' + response.status);
      }

      const data = await response.json();
      if (cancelRequested) return;

      // Unpack structured data
      setDetectedFeatures(data.detectedFeatures);
      setHairGuide(data.hairGuide);
      setBestMatches(data.bestMatches || []);
      setGoodOptions(data.goodOptions || []);
      setLessRecommended(data.lessRecommended || []);
      setAnalysisSummary(data.analysisSummary || '');

      // Set default selected style
      if (data.bestMatches && data.bestMatches.length > 0) {
        setSelectedHairstyle(data.bestMatches[0].name);
      }

      // Add to Cache History
      const newHistoryItem = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        request: customVal !== undefined ? customVal : customRequest,
        image: capturedImage,
        data
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);

      onAnalyzeComplete(data.analysisSummary || 'Analysis generated successfully.');
    } catch (err) {
      console.error('Styling generation error:', err);
    } finally {
      setAnalyzing(false);
      setLoadingStep('');
    }
  };

  // Download combined image: user's face + the overlaid hair SVG
  const handleDownloadTryOn = () => {
    if (!capturedImage) return;
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw face base
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Fetch SVG structure and serialize
        const svgElement = document.getElementById('tryon-svg-overlay');
        if (svgElement) {
          const svgString = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const hairImg = new Image();
          hairImg.src = url;
          hairImg.onload = () => {
            ctx.drawImage(hairImg, 0, 0, canvas.width, canvas.height);
            // Trigger browser save
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/jpeg', 0.95);
            a.download = `styleslot-tryon-${selectedHairstyle.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };
        }
      }
    };
  };

  // Chatbot logic
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const payloadHistory = chatHistory.slice(-6);
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          previousMessages: payloadHistory
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`Check out my customized StyleSlot AI hairstyle preview: ${selectedHairstyle}! ✨`);
    alert("Share details copied to clipboard!");
  };

  const toggleFavorite = (styleName: string) => {
    setFavorites(prev => 
      prev.includes(styleName) ? prev.filter(s => s !== styleName) : [...prev, styleName]
    );
  };

  // Helper component to render SVG path layers for try-on hair
  const HairstyleSvgContent = ({ styleName, colorGrad }: { styleName: string, colorGrad: string[] }) => {
    const config = SVG_HAIRSTYLES[styleName];
    if (!config) return null;

    const mainGradId = `grad-${styleName.replace(/\s+/g, '-')}`;
    return (
      <>
        <defs>
          <linearGradient id={mainGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorGrad[0]} />
            <stop offset="50%" stopColor={colorGrad[1]} />
            <stop offset="100%" stopColor={colorGrad[2] || colorGrad[1]} />
          </linearGradient>
          <filter id="hair-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Back hair layer */}
        {config.back && (
          <path 
            d={config.back} 
            fill={`url(#${mainGradId})`} 
            opacity="0.95" 
          />
        )}

        {/* Main top hair body */}
        <path 
          d={config.top} 
          fill={`url(#${mainGradId})`} 
          filter="url(#hair-shadow)"
        />

        {/* Highlights & strand lines */}
        <path 
          d={config.details} 
          fill="none" 
          stroke="rgba(255,255,255,0.18)" 
          strokeWidth="1.2" 
          strokeLinecap="round"
        />

        {/* Fade overlay layer */}
        {config.fade && (
          <path 
            d={config.fade} 
            fill="none" 
            stroke="rgba(255,255,255,0.06)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            opacity="0.5"
          />
        )}
      </>
    );
  };

  // Render a mini face preview container with the specified style overlaid
  const FacePreviewCard = ({ styleName, sizeClass = "h-28" }: { styleName: string, sizeClass?: string }) => {
    const layout = SVG_HAIRSTYLES[styleName];
    const scaleFactor = layout ? layout.defaultScale : 1.0;
    const yOffset = layout ? layout.defaultY : 0;

    return (
      <div className={`relative w-full ${sizeClass} rounded-xl overflow-hidden bg-zinc-950 border border-white/5`}>
        {capturedImage ? (
          <img src={capturedImage} alt="User Face" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs">No Photo</div>
        )}
        {/* Render overlay on face */}
        {layout && capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 320 256" className="w-full h-full">
              <g transform={`translate(${160} , ${90 + yOffset}) scale(${scaleFactor * 0.95}) translate(-145, -140)`}>
                <HairstyleSvgContent styleName={styleName} colorGrad={activeColor.gradient} />
              </g>
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-300">
          Try On
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Golden accent glow at top */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-500/10 blur-[50px] pointer-events-none rounded-full" />
      
      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/30">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'scan' ? 'bg-yellow-500/15 text-yellow-400 border-b-2 border-yellow-500' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> Hairstyle Analysis Studio
        </button>
        <button
          onClick={() => setActiveTab('consult')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'consult' ? 'bg-yellow-500/15 text-yellow-400 border-b-2 border-yellow-500' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" /> AI Grooming Chat
        </button>
      </div>

      {activeTab === 'scan' ? (
        <div className="p-6 space-y-8">
          
          {/* Top Title: HAIRSTYLE ANALYSIS */}
          <div className="text-center max-w-xl mx-auto space-y-2 pb-2">
            <span className="text-[10px] font-mono tracking-widest text-yellow-500 uppercase font-extrabold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/10">Premium AI Lab</span>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-1">Hairstyle Analysis</h2>
            <p className="text-xs text-zinc-400">Personalized For You &bull; Custom Face Structure Mapping</p>
          </div>

          {/* Prompt custom request entry */}
          <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
              <input
                type="text"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="I want a Modern Mullet / Korean Wolf Cut / Buzz Cut..."
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={analyzing || !capturedImage}
              className="w-full md:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} /> Apply Style Request
            </button>
          </div>

          {/* Loader status */}
          {analyzing && (
            <div className="bg-zinc-950/80 border border-yellow-500/25 rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 py-10 shadow-lg shadow-yellow-500/5">
              <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white uppercase tracking-wider">{loadingStep}</p>
                <p className="text-[10px] text-zinc-400">Analyzing facial proportions, landmarks & hairstyles...</p>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-yellow-500/20 bg-zinc-950">
              {capturedImage && (
                <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover opacity-50 filter blur-[1px]" />
              )}
              <canvas ref={canvasRef} width={640} height={400} className="absolute inset-0 w-full h-full z-10" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-yellow-500/30 text-white text-xs font-mono px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl z-20">
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
                <span>Running Landmark Symmetry Scan: {scanProgress}%</span>
              </div>
            </div>
          )}

          {/* Core Dashboard UI */}
          {!detectedFeatures && !isScanning && !analyzing && (
            <div className="border border-white/5 rounded-3xl bg-zinc-950/40 p-12 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto">
                <Upload className="w-7 h-7 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-bold text-white">No analyzed portrait loaded</h3>
                <p className="text-xs text-zinc-400">Capture from camera or browse folders to trigger instant automatic face scanning and style mapping.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={startCamera}
                  className="bg-zinc-800 border border-white/10 text-white hover:bg-zinc-700 text-xs font-semibold rounded-xl px-5 py-3 transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-yellow-500" /> Start Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500 text-xs font-bold rounded-xl px-6 py-3 transition cursor-pointer"
                >
                  Browse Folders
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}

          {cameraActive && (
            <div className="relative w-full h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black rounded-full px-6 py-3 text-xs flex items-center gap-2 shadow-2xl active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" /> Capture Face Frame
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-zinc-900 border border-white/15 text-white hover:bg-zinc-800 rounded-full px-5 py-3 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Main Layout Rows */}
          {detectedFeatures && !isScanning && !analyzing && (
            <div className="space-y-8">
              
              {/* Row 1: Left original and interactive try-on Arena / Right Best Matches */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Interactive Try-On Arena */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Try-On Arena (Active Image)</span>
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Image
                    </button>
                  </div>

                  {/* Interactive container */}
                  <div 
                    ref={containerRef}
                    className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 select-none cursor-crosshair"
                  >
                    {/* Before Image */}
                    <img 
                      src={capturedImage!} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />

                    {/* After tryon overlaid image */}
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                      style={{ width: `${sliderPos}%` }}
                    >
                      {/* Face base */}
                      <img 
                        src={capturedImage!} 
                        alt="Tryon Base" 
                        className="absolute inset-0 w-full h-[400px] object-cover pointer-events-none max-w-none"
                        style={{ width: containerRef.current?.getBoundingClientRect().width || 400 }}
                      />

                      {/* Overlaid Hair SVG overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <svg 
                          id="tryon-svg-overlay"
                          viewBox="0 0 320 320" 
                          className="w-full h-full"
                        >
                          <g transform={`translate(${160 + tryOnX}, ${140 + tryOnY}) scale(${tryOnScale}) translate(-145, -140)`}>
                            <HairstyleSvgContent styleName={selectedHairstyle} colorGrad={activeColor.gradient} />
                          </g>
                        </svg>
                      </div>
                    </div>

                    {/* Custom try-on label overlay */}
                    <div className="absolute top-4 left-4 bg-black/75 backdrop-blur px-3 py-1 rounded-full text-[9px] font-mono text-zinc-400 border border-white/5">
                      Original Upload
                    </div>

                    <div className="absolute top-4 right-4 bg-yellow-500/90 text-zinc-950 font-bold px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border border-yellow-400/20 shadow-lg">
                      {selectedHairstyle}
                    </div>

                    {/* Slider separator bar */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_12px_#fbbf24] cursor-ew-resize"
                      style={{ left: `${sliderPos}%` }}
                      onMouseDown={() => setIsDragSlider(true)}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-zinc-950 border border-zinc-900 flex items-center justify-center shadow-2xl">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Invisible drag overlay for mouse track */}
                    {isDragSlider && (
                      <div 
                        className="absolute inset-0 z-40 bg-transparent"
                        onMouseMove={(e) => handleSliderMove(e.clientX)}
                        onMouseUp={() => setIsDragSlider(false)}
                        onMouseLeave={() => setIsDragSlider(false)}
                      />
                    )}
                  </div>

                  {/* Slider Helper */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-zinc-500 font-mono">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                    <span>Swipe slider or use control panel below to fit hair</span>
                  </div>

                  {/* Fitting & Styling Tuning Controls */}
                  <div className="border border-white/5 bg-zinc-950/80 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-yellow-500" /> Hairstyle Adjustments
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">Fine Fitting</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Scale Slider */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-medium w-16">Size/Scale</span>
                        <input 
                          type="range" 
                          min="0.7" 
                          max="1.6" 
                          step="0.02" 
                          value={tryOnScale} 
                          onChange={(e) => setTryOnScale(parseFloat(e.target.value))}
                          className="flex-1 accent-yellow-500"
                        />
                        <span className="text-zinc-500 font-mono w-8 text-right">{Math.round(tryOnScale * 100)}%</span>
                      </div>

                      {/* Y position Slider */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-medium w-16">Vertical</span>
                        <input 
                          type="range" 
                          min="-80" 
                          max="80" 
                          step="1" 
                          value={tryOnY} 
                          onChange={(e) => setTryOnY(parseInt(e.target.value))}
                          className="flex-1 accent-yellow-500"
                        />
                        <span className="text-zinc-500 font-mono w-8 text-right">{tryOnY}px</span>
                      </div>

                      {/* X position Slider */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-medium w-16">Horizontal</span>
                        <input 
                          type="range" 
                          min="-40" 
                          max="40" 
                          step="1" 
                          value={tryOnX} 
                          onChange={(e) => setTryOnX(parseInt(e.target.value))}
                          className="flex-1 accent-yellow-500"
                        />
                        <span className="text-zinc-500 font-mono w-8 text-right">{tryOnX}px</span>
                      </div>
                    </div>

                    {/* Color Swatch Picker */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-yellow-500" /> Dye Salon (Color)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map(c => (
                          <button
                            key={c.name}
                            onClick={() => setActiveColor(c)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                              activeColor.name === c.name 
                                ? 'bg-zinc-800 text-yellow-400 border-yellow-500' 
                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: c.value }} />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Best Matches */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Best Matches (Recommended)</span>
                    <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">Top Matches</span>
                  </div>

                  <div className="space-y-4">
                    {bestMatches.map((style, idx) => (
                      <div 
                        key={style.name}
                        onClick={() => setSelectedHairstyle(style.name)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${
                          selectedHairstyle === style.name 
                            ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg' 
                            : 'bg-zinc-950/80 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="w-24 shrink-0">
                          <FacePreviewCard styleName={style.name} sizeClass="h-24" />
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">{style.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-yellow-400 shrink-0">
                              {style.compatibility}% Match
                            </span>
                          </div>
                          
                          {/* Rating and Stars */}
                          <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                            <span>{style.rating}</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < Math.floor(style.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`} 
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">
                            {style.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT PANEL - Hair Guide */}
                  {hairGuide && (
                    <div className="border border-white/10 rounded-3xl p-5 bg-zinc-950/80 space-y-4 shadow-lg">
                      <div className="border-b border-white/5 pb-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Hair Guide</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Hair Type</span>
                          <span className="text-white font-sans">{hairGuide.hairType}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Hair Density</span>
                          <span className="text-white font-sans">{hairGuide.hairDensity}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Hair Texture</span>
                          <span className="text-white font-sans">{hairGuide.hairTexture}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Hair Length</span>
                          <span className="text-white font-sans">{hairGuide.hairLength}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Face Shape</span>
                          <span className="text-white font-sans">{hairGuide.faceShape}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Hairline</span>
                          <span className="text-white font-sans">{hairGuide.hairline}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Forehead</span>
                          <span className="text-white font-sans">{hairGuide.forehead}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Jawline</span>
                          <span className="text-white font-sans">{hairGuide.jawline}</span>
                        </div>
                        <div className="space-y-0.5 col-span-2 border-t border-white/5 pt-2">
                          <span className="text-zinc-500 block uppercase text-[8px]">Ideal Hair Volume</span>
                          <span className="text-yellow-400 font-sans">{hairGuide.idealHairVolume}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Recommended Finish</span>
                          <span className="text-white font-sans">{hairGuide.recommendedFinish}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 block uppercase text-[8px]">Recommended Styling Products</span>
                          <span className="text-white font-sans truncate block">{hairGuide.recommendedStylingProducts}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* SECOND ROW: Good Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Good Options (Secondary Candidates)</span>
                  <span className="text-[9px] text-zinc-500 font-mono">4 Variations</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {goodOptions.map((style) => (
                    <div 
                      key={style.name}
                      onClick={() => setSelectedHairstyle(style.name)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        selectedHairstyle === style.name 
                          ? 'bg-yellow-500/10 border-yellow-500/40' 
                          : 'bg-zinc-950/80 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <FacePreviewCard styleName={style.name} sizeClass="h-28" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-[11px] font-bold text-white truncate">{style.name}</h5>
                          <span className="text-[9px] text-yellow-400 font-mono shrink-0">{style.compatibility}%</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 line-clamp-2 leading-tight">
                          {style.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* THIRD ROW: Less Recommended */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Less Recommended Styles</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Avoid/Alter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lessRecommended.map((style) => (
                    <div 
                      key={style.name}
                      onClick={() => setSelectedHairstyle(style.name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${
                        selectedHairstyle === style.name 
                          ? 'bg-yellow-500/10 border-yellow-500/40' 
                          : 'bg-zinc-950/60 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="w-16 shrink-0">
                        <FacePreviewCard styleName={style.name} sizeClass="h-16" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <h5 className="text-[11px] font-bold text-white truncate">{style.name}</h5>
                        <p className="text-[9px] text-zinc-400 leading-tight">
                          {style.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM: Analysis Summary */}
              <div className="border border-white/5 bg-zinc-950/60 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-yellow-500 font-black tracking-wider text-xs">
                  <Bot className="w-4 h-4" /> ANALYSIS SUMMARY & STRUCTURAL WHY
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {analysisSummary}
                </p>
              </div>

              {/* BOTTOM GALLERY: Display all generated hairstyle images */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Grooming Portfolio & Try-On Controls</span>
                  <span className="text-[10px] font-mono text-zinc-500">Professional Studio Gallery</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {Object.keys(SVG_HAIRSTYLES).map((styleName) => (
                    <div 
                      key={styleName}
                      onClick={() => setSelectedHairstyle(styleName)}
                      className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedHairstyle === styleName 
                          ? 'border-yellow-500 bg-zinc-950 scale-95' 
                          : 'border-white/5 bg-zinc-950/80 hover:border-white/10'
                      }`}
                    >
                      {/* Interactive visual on user face */}
                      <FacePreviewCard styleName={styleName} sizeClass="h-32" />
                      
                      <div className="p-3 bg-zinc-950">
                        <h6 className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-yellow-400 transition">{styleName}</h6>
                        
                        {/* Mini control icons */}
                        <div className="flex items-center justify-between gap-1.5 mt-2 border-t border-white/5 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHairstyle(styleName);
                              handleDownloadTryOn();
                            }}
                            className="text-zinc-500 hover:text-yellow-400 transition"
                            title="Download combination"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHairstyle(styleName);
                              setFullscreenImage(MODEL_IMAGES[styleName] || null);
                            }}
                            className="text-zinc-500 hover:text-yellow-400 transition"
                            title="Show reference photo"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(styleName);
                            }}
                            className="text-zinc-500 hover:text-yellow-400 transition"
                            title="Favorite"
                          >
                            <Heart className={`w-3 h-3 ${favorites.includes(styleName) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHairstyle(styleName);
                              handleShare();
                            }}
                            className="text-zinc-500 hover:text-yellow-400 transition"
                            title="Share"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunAiAnalysis(styleName);
                            }}
                            className="text-zinc-500 hover:text-yellow-400 transition text-[8px] font-bold tracking-widest shrink-0 uppercase"
                            title="Generate similar hairstyles based on this pattern"
                          >
                            Sync AI
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* History Panel */}
          {history.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-yellow-500" /> Generation History log
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCapturedImage(item.image);
                      setDetectedFeatures(item.data.detectedFeatures);
                      setHairGuide(item.data.hairGuide);
                      setBestMatches(item.data.bestMatches || []);
                      setGoodOptions(item.data.goodOptions || []);
                      setLessRecommended(item.data.lessRecommended || []);
                      setAnalysisSummary(item.data.analysisSummary || '');
                      if (item.data.bestMatches && item.data.bestMatches.length > 0) {
                        setSelectedHairstyle(item.data.bestMatches[0].name);
                      }
                    }}
                    className="flex-shrink-0 bg-zinc-950 border border-white/5 rounded-2xl p-3 text-left w-52 hover:border-yellow-500/30 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[9px] text-zinc-500 font-mono flex items-center justify-between mb-1">
                        <span>{item.timestamp}</span>
                        <span className="text-yellow-500">Restore</span>
                      </div>
                      <div className="text-[10px] text-white font-bold group-hover:text-yellow-400 truncate">
                        "{item.request || 'Symmetry Scan'}"
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-1">
                        {item.data.detectedFeatures?.faceShape} | {item.data.detectedFeatures?.hairDensity}
                      </div>
                    </div>
                    {item.image && (
                      <img src={item.image} alt="History scan" className="w-full h-12 object-cover rounded-lg mt-2 border border-white/5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* CONSULT - STYLE CHATBOT (Preserved) */
        <div className="p-4 flex flex-col h-[480px]">
          <div className="flex-1 overflow-y-auto space-y-4 p-2 min-h-0 bg-zinc-950/40 rounded-2xl mb-3 border border-white/5">
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-yellow-500 text-zinc-950 font-bold rounded-tr-none' 
                    : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="p-4 rounded-2xl text-xs bg-zinc-900 border border-white/15 text-zinc-400 italic flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-500" /> Consulting styling matrices...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Stylist: 'Recommendation for diamond shape' or 'Product for texturizing'..."
              className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-yellow-500/50 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 text-zinc-950 rounded-xl font-bold hover:opacity-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer max-w-[100px]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-full p-2.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={fullscreenImage} alt="Reference photo" className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl" />
          <p className="text-zinc-400 text-xs mt-3 uppercase tracking-widest font-mono">Reference Style Model</p>
        </div>
      )}
    </div>
  );
}
