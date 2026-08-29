import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Upload, Bot, Send, RefreshCw, UserCheck, 
  CheckCircle2, Star, Download, Maximize2, Share2, ArrowLeftRight, 
  AlertCircle, Info, Zap, X, Trash2, Heart, Sliders, Palette, MapPin
} from 'lucide-react';
import { supabase, isDemoMode } from '../supabase';

interface AiStylingAssistantProps {
  onAnalyzeComplete: (report: string) => void;
  walletBalance: number;
  onFindNearbySalons?: (hairstyle: string) => void;
  theme?: 'dark' | 'light';
}

import { HAIR_COLORS } from '../utils/hairLibrary';

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

export default function AiStylingAssistant({ 
  onAnalyzeComplete, 
  walletBalance, 
  onFindNearbySalons,
  theme = 'dark'
}: AiStylingAssistantProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'scan' | 'consult'>('scan');

  // Input states & analysis data
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState('');
  
  // Mandatory profiling fields
  const [faceShape, setFaceShape] = useState<string>('');
  const [hairDensity, setHairDensity] = useState<string>('');
  const [hairLength, setHairLength] = useState<string>('');
  const [hasBeard, setHasBeard] = useState<string>('');
  const [previews, setPreviews] = useState<any[]>([]);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [cancelRequested, setCancelRequested] = useState(false);

  // Remote AI Generation state
  const [hfGeneratedImage, setHfGeneratedImage] = useState<string | null>(null);
  const [hfProviderStatus, setHfProviderStatus] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingVariation, setIsGeneratingVariation] = useState<boolean>(false);
  const [variationsList, setVariationsList] = useState<Array<{ style: string; image: string; timestamp: string }>>([]);

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

          // Face oval guide
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2, w * 0.28, h * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      if (progress < 1) {
        animId = requestAnimationFrame(drawScan);
      } else {
        setIsScanning(false);
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

  // Full Refresh Scanner: Removes image, face analysis, results, generated previews, selections, and goal
  const handleRefreshScanner = () => {
    setCapturedImage(null);
    setDetectedFeatures(null);
    setHairGuide(null);
    setBestMatches([]);
    setGoodOptions([]);
    setLessRecommended([]);
    setPreviews([]);
    setAnalysisSummary('');
    setFaceShape('');
    setHairDensity('');
    setHairLength('');
    setHasBeard('');
    setCustomRequest('');
    setHfGeneratedImage(null);
    setHfProviderStatus(null);
    setGenerationError(null);
    setVariationsList([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Main Generation Handler (Initial 1 image generated via Hugging Face to conserve free credits)
  const handleRunAiAnalysis = async (customVal?: string) => {
    if (!capturedImage || !faceShape || !hairDensity || !hairLength || !hasBeard || (!customRequest.trim() && !customVal?.trim())) return;

    setAnalyzing(true);
    setCancelRequested(false);
    setGenerationError(null);

    const activeGoal = customVal !== undefined ? customVal : customRequest;

    try {
      setLoadingStep("Reading Visual Pixels...");
      await new Promise(r => setTimeout(r, 400));
      if (cancelRequested) return;

      setLoadingStep("Detecting Facial Landmarks & Bone Structure...");
      await new Promise(r => setTimeout(r, 400));
      if (cancelRequested) return;

      setLoadingStep("Synthesizing Hairstyle Strategy & Symmetry...");
      const stylingRes = await fetch('/api/ai/virtual-hairstylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          faceShape,
          hairDensity,
          hairLength,
          hasBeard,
          customRequest: activeGoal
        })
      });

      if (!stylingRes.ok) {
        throw new Error('Hairstylist analysis service returned status: ' + stylingRes.status);
      }

      const stylingData = await stylingRes.json();
      if (cancelRequested) return;

      // Unpack structured diagnostic data
      setDetectedFeatures(stylingData.detectedFeatures);
      setHairGuide(stylingData.hairGuide);
      setBestMatches(stylingData.bestMatches || []);
      setGoodOptions(stylingData.goodOptions || []);
      setLessRecommended(stylingData.lessRecommended || []);
      setAnalysisSummary(stylingData.analysisSummary || '');

      let chosenStyle = selectedHairstyle;
      if (stylingData.bestMatches && stylingData.bestMatches.length > 0) {
        chosenStyle = stylingData.bestMatches[0].name;
        setSelectedHairstyle(chosenStyle);
      } else if (stylingData.previews && stylingData.previews.length > 0) {
        chosenStyle = stylingData.previews[0].name;
        setSelectedHairstyle(chosenStyle);
      }

      // Initial single image generation to conserve free credits
      setLoadingStep("Generating your hairstyle...");
      let remoteImgUrl: string | null = null;

      try {
        const hfRes = await fetch('/api/generate-hairstyle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: capturedImage,
            faceShape,
            hairDensity,
            hairLength,
            hasBeard,
            customRequest: activeGoal,
            specificHairstyle: chosenStyle,
            hairstyleRequest: chosenStyle || activeGoal
          })
        });

        const hfData = await hfRes.json();

        if (hfRes.ok && hfData.success && hfData.generatedImage) {
          remoteImgUrl = hfData.generatedImage;
          setHfGeneratedImage(remoteImgUrl);
          setHfProviderStatus("ONLINE");
          setGenerationError(null);
          setVariationsList([{
            style: chosenStyle,
            image: remoteImgUrl,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else {
          console.warn("Hugging Face remote response error:", hfData);
          setGenerationError(hfData.error || "AI hairstyle generation is temporarily unavailable. Please try again.");
          setHfProviderStatus("UNAVAILABLE");
        }
      } catch (hfErr: any) {
        console.error("Remote Hugging Face fetch error:", hfErr);
        setGenerationError("AI hairstyle generation is temporarily unavailable. Please try again.");
      }

      // If remote image succeeded, update preview image for the chosen style
      let updatedPreviews = (stylingData.previews || []).map((p: any) => {
        if (p.name === chosenStyle && remoteImgUrl) {
          return { ...p, image: remoteImgUrl };
        }
        return p;
      });
      setPreviews(updatedPreviews);

      // Add to Cache History
      const newHistoryItem = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        request: activeGoal,
        image: remoteImgUrl || capturedImage,
        data: {
          ...stylingData,
          previews: updatedPreviews
        }
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);

      onAnalyzeComplete(stylingData.analysisSummary || 'Analysis generated successfully.');
    } catch (err: any) {
      console.error('Styling generation error:', err);
      setGenerationError(err?.message || "Failed to generate AI recommendations. Please check parameters and try again.");
    } finally {
      setAnalyzing(false);
      setLoadingStep('');
    }
  };

  // Generate on-demand additional variation for current hairstyle without regenerating 10 images
  const handleGenerateAnotherVariation = async (targetStyle?: string) => {
    if (!capturedImage || isGeneratingVariation) return;
    const styleToUse = targetStyle || selectedHairstyle;

    setIsGeneratingVariation(true);
    setGenerationError(null);

    try {
      const hfRes = await fetch('/api/generate-hairstyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          faceShape,
          hairDensity,
          hairLength,
          hasBeard,
          customRequest: customRequest.trim() || styleToUse,
          specificHairstyle: styleToUse,
          hairstyleRequest: styleToUse,
          skipCache: true
        })
      });

      const hfData = await hfRes.json();

      if (hfRes.ok && hfData.success && hfData.generatedImage) {
        const newImg = hfData.generatedImage;
        setHfGeneratedImage(newImg);
        setHfProviderStatus("ONLINE");
        setGenerationError(null);

        // Update variations list
        setVariationsList(prev => [
          ...prev,
          {
            style: styleToUse,
            image: newImg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // Update previews list
        setPreviews(prev => prev.map(p => p.name === styleToUse ? { ...p, image: newImg } : p));
      } else {
        setGenerationError(hfData.error || "AI hairstyle generation is temporarily unavailable. Please try again.");
      }
    } catch (err) {
      console.error("Generate variation error:", err);
      setGenerationError("AI hairstyle generation is temporarily unavailable. Please try again.");
    } finally {
      setIsGeneratingVariation(false);
    }
  };

  // Refresh ONLY the single specific hairstyle
  const handleRefreshHairstyle = async (styleName: string) => {
    setSelectedHairstyle(styleName);
    await handleGenerateAnotherVariation(styleName);
  };

  // Download generated try-on image
  const handleDownloadTryOn = () => {
    const imgUrl = hfGeneratedImage || previews.find(p => p.name === selectedHairstyle)?.image || capturedImage;
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `styleslot-hairstyle-${selectedHairstyle.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // Clean photorealistic hairstyle model card
  const HairStyleModelCard = ({ styleName, sizeClass = "h-28", imageUrl }: { styleName: string, sizeClass?: string, imageUrl?: string }) => {
    const fallbackImg = previews.find(p => p.name === styleName)?.image || "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600";
    const src = imageUrl || fallbackImg;

    return (
      <div className={`relative w-full ${sizeClass} rounded-xl overflow-hidden bg-zinc-950 border ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
        <img src={src} alt={styleName} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-mono text-zinc-200">
          Studio Reference
        </div>
      </div>
    );
  };

  const isLight = theme === 'light';

  return (
    <div className={`${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/60' : 'bg-zinc-900/60 backdrop-blur-xl border-white/10 text-white shadow-2xl'} border rounded-3xl overflow-hidden relative transition-all duration-300`}>
      {/* Golden accent glow at top */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-500/10 blur-[50px] pointer-events-none rounded-full" />
      
      {/* Tabs */}
      <div className={`flex border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-black/30'}`}>
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'scan' 
              ? (isLight ? 'bg-amber-500/15 text-amber-800 border-b-2 border-amber-600 font-extrabold shadow-sm' : 'bg-yellow-500/15 text-yellow-400 border-b-2 border-yellow-500') 
              : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <Camera className="w-4 h-4" /> Hairstyle Analysis Studio
        </button>
        <button
          onClick={() => setActiveTab('consult')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'consult' 
              ? (isLight ? 'bg-amber-500/15 text-amber-800 border-b-2 border-amber-600 font-extrabold shadow-sm' : 'bg-yellow-500/15 text-yellow-400 border-b-2 border-yellow-500') 
              : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <Bot className="w-4 h-4" /> AI Grooming Chat
        </button>
      </div>

      {activeTab === 'scan' ? (
        <div className="p-6 space-y-8">

          {/* Remote AI Engine Indicator */}
          <div className={`border ${isLight ? 'border-amber-200 bg-amber-50/50 text-slate-700' : 'border-yellow-500/20 bg-zinc-950/60 text-zinc-400'} rounded-2xl p-3 flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">StyleSlot AI Engine:</span>
              <span className="text-[10px] font-mono text-amber-500 font-semibold">Qwen-Image-Edit-2511 Remote Inference</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Cloud Active</span>
          </div>
          
          {/* Top Title: HAIRSTYLE ANALYSIS */}
          <div className="text-center max-w-xl mx-auto space-y-2 pb-2">
            <span className={`text-[10px] font-mono tracking-widest ${isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/10'} uppercase font-extrabold px-3 py-1 rounded-full border`}>
              Premium AI Lab
            </span>
            <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight uppercase mt-1`}>
              Hairstyle Analysis
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Personalized For You &bull; Custom Face Structure Mapping
            </p>
          </div>

          {/* Prompt custom request entry */}
          <div className={`${isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-zinc-950/60 border-white/5'} border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3`}>
            <div className="relative flex-1 w-full">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input
                type="text"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="I want a Modern Mullet / Korean Wolf Cut / Buzz Cut..."
                className={`w-full ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500' : 'bg-zinc-900/60 border-white/5 text-white placeholder:text-zinc-500 focus:border-yellow-500/50'} border rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none shadow-sm`}
              />
            </div>
            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={analyzing || !capturedImage || !faceShape || !hairDensity || !hairLength || !hasBeard || !customRequest.trim()}
              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-30 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} /> Apply Style Request
            </button>
          </div>

          {/* Loader status */}
          {analyzing && (
            <div className={`${isLight ? 'bg-slate-50 border-amber-300 shadow-lg' : 'bg-zinc-950/80 border-yellow-500/25'} border rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 py-10 shadow-yellow-500/5`}>
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <div className="text-center space-y-1">
                <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>{loadingStep}</p>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Analyzing facial proportions, landmarks & hairstyles...</p>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className={`relative w-full h-80 rounded-2xl overflow-hidden border ${isLight ? 'border-amber-400/40 bg-slate-900' : 'border-yellow-500/20 bg-zinc-950'}`}>
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
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Photo Upload Area */}
              <div className={`border ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-zinc-950/40'} rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm`}>
                {capturedImage ? (
                  <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-amber-500/40 group shadow-md">
                    <img src={capturedImage} alt="Uploaded face" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setCapturedImage(null)}
                      className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold text-xs transition-opacity cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full ${isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white/5 border-white/10 text-zinc-400'} border flex items-center justify-center mx-auto shadow-sm`}>
                    <Upload className="w-7 h-7 text-amber-500" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className={`text-md font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {capturedImage ? "Photo Uploaded" : "Step 1: Upload Your Portrait"}
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {capturedImage ? "Define your profile below to unlock recommendations." : "Capture from camera or browse files to load your face."}
                  </p>
                </div>
                
                {!capturedImage && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={startCamera}
                      className={`${isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700'} border text-xs font-semibold rounded-xl px-5 py-3 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm`}
                    >
                      <Camera className="w-4 h-4 text-amber-500" /> Start Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 text-xs font-bold rounded-xl px-6 py-3 transition cursor-pointer shadow-sm"
                    >
                      Browse Folders
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Mandatory Selections Form */}
              {capturedImage && (
                <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/60 border-white/5'} border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm`}>
                  <h3 className={`text-sm font-black ${isLight ? 'text-amber-800 border-slate-200' : 'text-yellow-500 border-white/5'} uppercase tracking-wider border-b pb-3`}>
                    Step 2: Define Grooming Profile Parameters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Face Shape */}
                    <div className="space-y-3">
                      <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'} block`}>Face Shape Selection *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Oval', 'Square', 'Round', 'Heart', 'Diamond', 'Oblong'].map(shape => (
                          <button
                            key={shape}
                            onClick={() => setFaceShape(shape)}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                              faceShape === shape 
                                ? (isLight ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-bold shadow-sm' : 'bg-yellow-500/10 border-yellow-500 text-yellow-400') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white')
                            }`}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hair Density */}
                    <div className="space-y-3">
                      <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'} block`}>Hair Density *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(density => (
                          <button
                            key={density}
                            onClick={() => setHairDensity(density)}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                              hairDensity === density 
                                ? (isLight ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-bold shadow-sm' : 'bg-yellow-500/10 border-yellow-500 text-yellow-400') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white')
                            }`}
                          >
                            {density}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hair Length */}
                    <div className="space-y-3">
                      <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'} block`}>Hair Length *</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['Buzz', 'Very Short', 'Short', 'Medium', 'Long'].map(len => (
                          <button
                            key={len}
                            onClick={() => setHairLength(len)}
                            className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all truncate text-center cursor-pointer ${
                              hairLength === len 
                                ? (isLight ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-bold shadow-sm' : 'bg-yellow-500/10 border-yellow-500 text-yellow-400') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white')
                            }`}
                          >
                            {len}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Beard Contouring */}
                    <div className="space-y-3">
                      <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'} block`}>Beard Contouring *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Yes', 'No'].map(beard => (
                          <button
                            key={beard}
                            onClick={() => setHasBeard(beard)}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                              hasBeard === beard 
                                ? (isLight ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-bold shadow-sm' : 'bg-yellow-500/10 border-yellow-500 text-yellow-400') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white')
                            }`}
                          >
                            {beard === 'Yes' ? 'Beard Contouring' : 'Clean Shaven'}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Custom Request / Aesthetic Goal */}
                  <div className="space-y-3">
                    <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-zinc-300'} block`}>Custom Aesthetic Goal / User Prompt *</label>
                    <textarea
                      value={customRequest}
                      onChange={(e) => setCustomRequest(e.target.value)}
                      placeholder="Explain your desired hairstyle profile, e.g., 'I want a textured curtains haircut', 'A high fade mullet with red dye highlights', 'Keep it professional and clean'"
                      rows={3}
                      className={`w-full ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500' : 'bg-zinc-900 border-white/5 text-white placeholder:text-zinc-500 focus:border-yellow-500/50'} border rounded-xl p-3 text-xs focus:outline-none shadow-sm`}
                    />
                  </div>

                  {/* Validation feedback checklist */}
                  <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-white/5'} border rounded-2xl p-4 space-y-2`}>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'} uppercase tracking-widest block font-bold`}>Mandatory Verification Checklist:</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${capturedImage ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{capturedImage ? '✓' : '✗'}</span> Image Uploaded
                      </div>
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${faceShape ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{faceShape ? '✓' : '✗'}</span> Face Shape Selected
                      </div>
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${hairDensity ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{hairDensity ? '✓' : '✗'}</span> Hair Density Selected
                      </div>
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${hairLength ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{hairLength ? '✓' : '✗'}</span> Hair Length Selected
                      </div>
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${hasBeard ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{hasBeard ? '✓' : '✗'}</span> Beard Contouring Selected
                      </div>
                      <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${customRequest.trim() ? (isLight ? 'text-emerald-700' : 'text-green-400') : (isLight ? 'text-rose-600' : 'text-red-400')}`}>
                        <span>{customRequest.trim() ? '✓' : '✗'}</span> Aesthetic Goal Entered
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={() => handleRunAiAnalysis()}
                    disabled={!capturedImage || !faceShape || !hairDensity || !hairLength || !hasBeard || !customRequest.trim()}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 disabled:opacity-30 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-950" /> Generate AI Grooming Recommendations
                  </button>

                </div>
              )}
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

              {/* Error / Quota Notice Banner */}
              {generationError && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300 shadow-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold uppercase tracking-wider">AI Generation Status</p>
                    <p className="text-xs leading-relaxed font-sans">{generationError}</p>
                  </div>
                </div>
              )}
              
              {/* Row 1: Left original and interactive try-on Arena / Right Best Matches */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Flat AI Try-On Arena */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'} uppercase font-bold`}>Try-On Arena (Active Image)</span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                        FLUX.1-Kontext-dev
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateAnotherVariation()}
                        disabled={isGeneratingVariation}
                        className="text-[11px] bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        title="Generate another variation of the current hairstyle"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingVariation ? 'animate-spin' : ''}`} />
                        {isGeneratingVariation ? "Generating..." : "Generate Another Variation"}
                      </button>

                      <button
                        onClick={handleRefreshScanner}
                        className="text-[11px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Reset scanner and upload another photo"
                      >
                        <span>🔄</span> Refresh Scanner
                      </button>
                    </div>
                  </div>

                  {/* Flat composited image container */}
                  <div className={`relative w-full h-[400px] rounded-3xl overflow-hidden border ${isLight ? 'border-slate-200 bg-slate-100 shadow-md' : 'border-white/10 bg-zinc-950'}`}>
                    <img 
                      src={hfGeneratedImage || previews.find(p => p.name === selectedHairstyle)?.image || capturedImage!} 
                      alt="AI Try-On Result" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Custom try-on label overlay */}
                    <div className="absolute top-4 left-4 bg-black/75 backdrop-blur px-3 py-1 rounded-full text-[9px] font-mono text-zinc-300 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {hfGeneratedImage ? "FLUX.1 Remote Edit" : "AI Generated Try-On"}
                    </div>

                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold px-3.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider shadow-lg">
                      {selectedHairstyle}
                    </div>

                    {/* Quick Variation Switcher Bar */}
                    {variationsList.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl z-20">
                        <span className="text-[9px] font-mono text-zinc-400 uppercase">Variations:</span>
                        {variationsList.map((v, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setHfGeneratedImage(v.image);
                              setSelectedHairstyle(v.style);
                            }}
                            className={`w-5 h-5 rounded-full text-[9px] font-bold font-mono transition flex items-center justify-center cursor-pointer ${
                              hfGeneratedImage === v.image ? 'bg-yellow-400 text-zinc-950 shadow' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Best Matches */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'} uppercase font-bold`}>Best Matches (Recommended)</span>
                    <span className={`text-[9px] ${isLight ? 'text-amber-800 bg-amber-100 border border-amber-300' : 'text-yellow-500 bg-yellow-500/10'} font-bold px-2 py-0.5 rounded`}>Top Matches</span>
                  </div>

                  <div className="space-y-4">
                    {bestMatches.map((style) => {
                      const isSel = selectedHairstyle === style.name;
                      const previewImg = previews.find(p => p.name === style.name)?.image;
                      return (
                        <div 
                          key={style.name}
                          onClick={() => setSelectedHairstyle(style.name)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${
                            isSel 
                              ? (isLight ? 'bg-amber-500/15 border-amber-500 shadow-md' : 'bg-yellow-500/10 border-yellow-500/50 shadow-lg')
                              : (isLight ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm text-slate-900' : 'bg-zinc-950/80 border-white/5 hover:border-white/10 text-white')
                          }`}
                        >
                          <div className="w-24 shrink-0 relative group">
                            {previewImg ? (
                              <img 
                                src={previewImg} 
                                alt={style.name} 
                                className={`w-full h-24 object-cover rounded-xl border ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/5 bg-zinc-900'}`} 
                              />
                            ) : (
                              <HairStyleModelCard styleName={style.name} sizeClass="h-24" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshHairstyle(style.name);
                              }}
                              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-yellow-400 rounded-xl transition"
                              title="Regenerate only this hairstyle"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                            </button>
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>{style.name}</h4>
                              <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-amber-700' : 'text-yellow-400'} shrink-0`}>
                                {style.compatibility}% Match
                              </span>
                            </div>
                            
                            {/* Rating and Stars */}
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                              <span>{style.rating}</span>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < Math.floor(style.rating) ? 'fill-amber-400 text-amber-400' : (isLight ? 'text-slate-300' : 'text-zinc-700')}`} 
                                  />
                                ))}
                              </div>
                            </div>

                            <p className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-zinc-400'} leading-normal line-clamp-2`}>
                              {style.reason}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT PANEL - Hair Guide */}
                  {hairGuide && (
                    <div className={`border ${isLight ? 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm' : 'border-white/10 bg-zinc-950/80 text-white shadow-lg'} rounded-3xl p-5 space-y-4`}>
                      <div className={`border-b ${isLight ? 'border-slate-200' : 'border-white/5'} pb-2`}>
                        <h3 className={`text-xs font-black ${isLight ? 'text-amber-800' : 'text-white'} uppercase tracking-wider`}>Hair Guide</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Hair Type</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.hairType}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Hair Density</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.hairDensity}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Hair Texture</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.hairTexture}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Hair Length</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.hairLength}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Face Shape</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.faceShape}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Hairline</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.hairline}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Forehead</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.forehead}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Jawline</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.jawline}</span>
                        </div>
                        <div className={`space-y-0.5 col-span-2 border-t ${isLight ? 'border-slate-200' : 'border-white/5'} pt-2`}>
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Ideal Hair Volume</span>
                          <span className={`${isLight ? 'text-amber-700' : 'text-yellow-400'} font-sans font-bold`}>{hairGuide.idealHairVolume}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Recommended Finish</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold`}>{hairGuide.recommendedFinish}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} block uppercase text-[8px] font-bold`}>Recommended Products</span>
                          <span className={`${isLight ? 'text-slate-900' : 'text-white'} font-sans font-semibold truncate block`}>{hairGuide.recommendedStylingProducts}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* SECOND ROW: Good Options */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between border-b ${isLight ? 'border-slate-200' : 'border-white/5'} pb-2`}>
                  <span className={`text-[10px] font-mono tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'} uppercase font-bold`}>Good Options (Secondary Candidates)</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-500'} font-mono`}>4 Variations</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {goodOptions.map((style) => {
                    const isSel = selectedHairstyle === style.name;
                    const previewImg = previews.find(p => p.name === style.name)?.image;
                    return (
                      <div 
                        key={style.name}
                        onClick={() => setSelectedHairstyle(style.name)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                          isSel 
                            ? (isLight ? 'bg-amber-500/15 border-amber-500 shadow-md' : 'bg-yellow-500/10 border-yellow-500/40') 
                            : (isLight ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm text-slate-900' : 'bg-zinc-950/80 border-white/5 hover:border-white/10 text-white')
                        }`}
                      >
                        <div className="relative group rounded-xl overflow-hidden">
                          {previewImg ? (
                            <img 
                              src={previewImg} 
                              alt={style.name} 
                              className={`w-full h-28 object-cover rounded-xl border ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/5 bg-zinc-900'}`} 
                            />
                          ) : (
                            <HairStyleModelCard styleName={style.name} sizeClass="h-28" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshHairstyle(style.name);
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-yellow-400 rounded-xl transition"
                            title="Regenerate only this hairstyle"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                          </button>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>{style.name}</h5>
                            <span className={`text-[9px] ${isLight ? 'text-amber-700' : 'text-yellow-400'} font-mono font-bold shrink-0`}>{style.compatibility}%</span>
                          </div>
                          <p className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-zinc-400'} line-clamp-2 leading-tight`}>
                            {style.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* THIRD ROW: Less Recommended */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between border-b ${isLight ? 'border-slate-200' : 'border-white/5'} pb-2`}>
                  <span className={`text-[10px] font-mono tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'} uppercase font-bold`}>Less Recommended Styles</span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-500'} font-mono`}>Avoid/Alter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lessRecommended.map((style) => {
                    const isSel = selectedHairstyle === style.name;
                    const previewImg = previews.find(p => p.name === style.name)?.image;
                    return (
                      <div 
                        key={style.name}
                        onClick={() => setSelectedHairstyle(style.name)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${
                          isSel 
                            ? (isLight ? 'bg-amber-500/15 border-amber-500 shadow-md' : 'bg-yellow-500/10 border-yellow-500/40') 
                            : (isLight ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm text-slate-900' : 'bg-zinc-950/60 border-white/5 hover:border-white/10 text-white')
                        }`}
                      >
                        <div className="w-16 shrink-0">
                          <HairStyleModelCard styleName={style.name} sizeClass="h-16" imageUrl={previewImg} />
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <h5 className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>{style.name}</h5>
                          <p className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-zinc-400'} leading-tight`}>
                            {style.explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM: Analysis Summary */}
              <div className={`border ${isLight ? 'border-slate-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/20 shadow-sm' : 'border-white/5 bg-zinc-950/60'} rounded-3xl p-6 space-y-3`}>
                <div className={`flex items-center gap-2 ${isLight ? 'text-amber-800' : 'text-yellow-500'} font-black tracking-wider text-xs`}>
                  <Bot className="w-4 h-4" /> ANALYSIS SUMMARY & STRUCTURAL WHY
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-zinc-300'} leading-relaxed font-sans`}>
                  {analysisSummary}
                </p>
              </div>

              {/* Find Nearby Salons Prompt Banner */}
              <div className={`bg-gradient-to-br ${isLight ? 'from-amber-100/70 via-white to-amber-50 border-amber-200 shadow-md' : 'from-yellow-500/15 via-zinc-950 to-zinc-950 border-yellow-500/30'} border rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div className="space-y-1 text-center md:text-left">
                  <h4 className={`text-xs uppercase font-mono tracking-widest ${isLight ? 'text-amber-800' : 'text-yellow-500'} font-bold flex items-center justify-center md:justify-start gap-1.5`}>
                    <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-yellow-400'}`} /> Style Selection Complete
                  </h4>
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} mt-1`}>Ready to book this style?</h3>
                  <p className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Find nearby hair salons and barber shops that can execute the <span className={`${isLight ? 'text-amber-800' : 'text-yellow-400'} font-bold`}>"{selectedHairstyle}"</span> style.</p>
                </div>
                <button
                  onClick={() => onFindNearbySalons && onFindNearbySalons(selectedHairstyle)}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <MapPin className="w-4 h-4 text-zinc-950" /> Find Nearby Salons
                </button>
              </div>

              {/* BOTTOM GALLERY: Display all generated hairstyle images */}
              <div className={`space-y-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                <div className={`border-b ${isLight ? 'border-slate-200' : 'border-white/5'} pb-2 flex justify-between items-center`}>
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>Grooming Portfolio & Try-On Controls</span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Professional Studio Gallery</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {previews.map((preview) => {
                    const isSel = selectedHairstyle === preview.name;
                    return (
                      <div 
                        key={preview.name}
                        onClick={() => setSelectedHairstyle(preview.name)}
                        className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                          isSel 
                            ? (isLight ? 'border-amber-500 bg-white shadow-md' : 'border-yellow-500 bg-zinc-950 scale-95') 
                            : (isLight ? 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm' : 'border-white/5 bg-zinc-950/80 hover:border-white/10')
                        }`}
                      >
                        {/* AI Generated Styled Photo Preview */}
                        <div className={`relative w-full h-32 rounded-xl overflow-hidden ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-white/5'} border`}>
                          <img src={preview.image} alt={preview.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 px-2 py-0.5 rounded text-[8px] font-bold shadow">
                            {preview.compatibility}% Match
                          </div>
                        </div>
                        
                        <div className={`p-3 ${isLight ? 'bg-white' : 'bg-zinc-950'}`}>
                          <h6 className={`text-[10px] font-bold ${isLight ? 'text-slate-900 group-hover:text-amber-700' : 'text-zinc-200 group-hover:text-yellow-400'} truncate transition`}>{preview.name}</h6>
                          
                          {/* Mini control icons */}
                          <div className={`flex items-center justify-between gap-1.5 mt-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'} pt-2`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHairstyle(preview.name);
                                handleDownloadTryOn();
                              }}
                              className={`${isLight ? 'text-slate-400 hover:text-amber-600' : 'text-zinc-500 hover:text-yellow-400'} transition cursor-pointer`}
                              title="Download combination"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHairstyle(preview.name);
                                setFullscreenImage(preview.image);
                              }}
                              className={`${isLight ? 'text-slate-400 hover:text-amber-600' : 'text-zinc-500 hover:text-yellow-400'} transition cursor-pointer`}
                              title="Show fullscreen preview"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(preview.name);
                              }}
                              className={`${isLight ? 'text-slate-400 hover:text-red-500' : 'text-zinc-500 hover:text-yellow-400'} transition cursor-pointer`}
                              title="Favorite"
                            >
                              <Heart className={`w-3 h-3 ${favorites.includes(preview.name) ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHairstyle(preview.name);
                                handleShare();
                              }}
                              className={`${isLight ? 'text-slate-400 hover:text-amber-600' : 'text-zinc-500 hover:text-yellow-400'} transition cursor-pointer`}
                              title="Share"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshHairstyle(preview.name);
                              }}
                              className={`${isLight ? 'text-amber-700 hover:text-amber-800' : 'text-zinc-500 hover:text-yellow-400'} transition text-[8px] font-bold tracking-widest shrink-0 uppercase cursor-pointer flex items-center gap-1`}
                              title="Regenerate only this style variation"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Refresh
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* History Panel */}
          {history.length > 0 && (
            <div className={`border-t ${isLight ? 'border-slate-200' : 'border-white/5'} pt-4 space-y-3`}>
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider flex items-center gap-1`}>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> Generation History log
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
                      setPreviews(item.data.previews || []);
                      setAnalysisSummary(item.data.analysisSummary || '');
                      if (item.data.previews && item.data.previews.length > 0) {
                        setSelectedHairstyle(item.data.previews[0].name);
                      } else if (item.data.bestMatches && item.data.bestMatches.length > 0) {
                        setSelectedHairstyle(item.data.bestMatches[0].name);
                      }
                    }}
                    className={`flex-shrink-0 ${isLight ? 'bg-white border-slate-200 hover:border-amber-400 shadow-sm' : 'bg-zinc-950 border-white/5 hover:border-yellow-500/30'} border rounded-2xl p-3 text-left w-52 transition group flex flex-col justify-between cursor-pointer`}
                  >
                    <div>
                      <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-500'} font-mono flex items-center justify-between mb-1`}>
                        <span>{item.timestamp}</span>
                        <span className="text-amber-500 font-bold">Restore</span>
                      </div>
                      <div className={`text-[10px] ${isLight ? 'text-slate-900 group-hover:text-amber-700' : 'text-white group-hover:text-yellow-400'} font-bold truncate`}>
                        "{item.request || 'Symmetry Scan'}"
                      </div>
                      <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-zinc-400'} mt-1`}>
                        {item.data.detectedFeatures?.faceShape} | {item.data.detectedFeatures?.hairDensity}
                      </div>
                    </div>
                    {item.image && (
                      <img src={item.image} alt="History scan" className={`w-full h-12 object-cover rounded-lg mt-2 border ${isLight ? 'border-slate-200' : 'border-white/5'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* CONSULT - STYLE CHATBOT */
        <div className="p-4 sm:p-6 flex flex-col h-[520px]">
          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 shrink-0">
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'} uppercase font-bold shrink-0 flex items-center gap-1`}>
              <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
            </span>
            {[
              "Best style for round face shape",
              "How to style a textured quiff",
              "Low maintenance taper fade tips",
              "Recommended products for thick hair"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatInput(prompt);
                }}
                className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 transition cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50' 
                    : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-yellow-500/50 hover:bg-zinc-900'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className={`flex-1 overflow-y-auto space-y-4 p-3.5 min-h-0 ${isLight ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-zinc-950/40 border-white/5'} rounded-2xl mb-3 border`}>
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full ${isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400'} border flex items-center justify-center shrink-0 shadow-sm`}>
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-bold rounded-tr-none shadow-md shadow-amber-500/15' 
                    : (isLight ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm' : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none')
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className={`w-8 h-8 rounded-full ${isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400'} border flex items-center justify-center shrink-0`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className={`p-3.5 rounded-2xl text-xs ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-zinc-900 border-white/15 text-zinc-400'} border italic flex items-center gap-2 shadow-sm`}>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> Consulting styling matrices...
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
              className={`flex-1 ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-sm' : 'bg-zinc-950 border-white/10 text-white placeholder:text-zinc-600 focus:border-yellow-500/50'} border rounded-xl px-4 py-2.5 text-xs focus:outline-none`}
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
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
