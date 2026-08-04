import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Upload, Bot, Send, RefreshCw, UserCheck, 
  CheckCircle2, Star, Download, Maximize2, Share2, ArrowLeftRight, 
  AlertCircle, Info, Zap, X, Trash2, Heart 
} from 'lucide-react';
import { supabase, isDemoMode } from '../supabase';

interface AiStylingAssistantProps {
  onAnalyzeComplete: (report: string) => void;
  walletBalance: number;
}

export default function AiStylingAssistant({ onAnalyzeComplete, walletBalance }: AiStylingAssistantProps) {
  // Input fields
  const [faceShape, setFaceShape] = useState('');
  const [hairDensity, setHairDensity] = useState('');
  const [hairLength, setHairLength] = useState('');
  const [hasBeard, setHasBeard] = useState(''); // 'Yes' | 'No' | ''
  const [customText, setCustomText] = useState('');
  
  // UI and Status States
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [cancelRequested, setCancelRequested] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'consult'>('scan');
  
  // Report & Image results
  const [reportText, setReportText] = useState('');
  const [recommendedImages, setRecommendedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Camera integration states
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Scanning animation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSuccess, setScanSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Fullscreen Preview Modal
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Chatbot conversation states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Greetings of elegance. I am your StyleSlot VIP aesthetic director. Ask me about custom fades, face symmetry, beard trimming, or styling gels." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Favorites Cache
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('styleslot_favorite_styles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // History Cache
  const [history, setHistory] = useState<Array<{
    timestamp: string;
    params: { faceShape: string; hairDensity: string; hairLength: string; hasBeard: string; customText: string };
    report: string;
    images: string[];
  }>>(() => {
    try {
      const saved = localStorage.getItem('styleslot_generation_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('styleslot_favorite_styles', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('styleslot_generation_history', JSON.stringify(history));
  }, [history]);

  // Face Shape options
  const faceShapes = [
    { name: 'Oval', icon: '👤', desc: 'Balanced vertical ratio' },
    { name: 'Square', icon: '📐', desc: 'Strong, angular jaw' },
    { name: 'Round', icon: '🟡', desc: 'Equal width & height proportion' },
    { name: 'Heart', icon: '💟', desc: 'Wide forehead, pointed chin' },
    { name: 'Diamond', icon: '💎', desc: 'High cheekbones, narrow chin' },
    { name: 'Oblong', icon: '⏳', desc: 'Longer vertical profile' }
  ];

  // Quick Suggestion Style Pills
  const stylePills = [
    "Modern Mullet",
    "Low Taper Fade",
    "Korean Wolf Cut",
    "Messy Textured Fringe",
    "French Crop",
    "Buzz Cut",
    "Classic Pompadour",
    "Curly Undercut"
  ];

  // Future VIP placeholders
  const futureOptions = [
    { label: "Vibrant Hair Highlights", badge: "VIP" },
    { label: "Mustache Styles Generator", badge: "COMING SOON" },
    { label: "Eyeglasses & Accessories", badge: "COMING SOON" },
    { label: "Celebrity Hairstyle Match", badge: "VIP" }
  ];

  // Canvas-based scanning animation loop
  useEffect(() => {
    if (!isScanning) return;
    let animId: number;
    let startTimestamp: number | null = null;
    const duration = 2500; // 2.5 seconds
    
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
          
          // Draw high-tech grid
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
          ctx.lineWidth = 1;
          const gridSize = 20;
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
          
          // Draw laser line
          const scanY = h * (0.15 + 0.7 * Math.sin(timestamp * 0.0025 + Math.PI / 2));
          const scanGlow = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
          scanGlow.addColorStop(0, 'rgba(212, 175, 55, 0)');
          scanGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.55)');
          scanGlow.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.fillStyle = scanGlow;
          ctx.fillRect(0, scanY - 12, w, 24);
          
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();
          
          // Simulated face landmark dots
          const cx = w / 2;
          const cy = h / 2;
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#D4AF37';
          
          const landmarks = [
            // Jaw outline
            {x: cx - 50, y: cy + 45}, {x: cx - 30, y: cy + 60}, {x: cx, y: cy + 68}, {x: cx + 30, y: cy + 60}, {x: cx + 50, y: cy + 45},
            // Left eye
            {x: cx - 25, y: cy - 10}, {x: cx - 15, y: cy - 12}, {x: cx - 10, y: cy - 8},
            // Right eye
            {x: cx + 25, y: cy - 10}, {x: cx + 15, y: cy - 12}, {x: cx + 10, y: cy - 8},
            // Nose bridge & tip
            {x: cx, y: cy - 18}, {x: cx, y: cy + 8}, {x: cx - 8, y: cy + 12}, {x: cx + 8, y: cy + 12},
            // Mouth contours
            {x: cx - 18, y: cy + 32}, {x: cx + 18, y: cy + 32}, {x: cx, y: cy + 38}, {x: cx, y: cy + 28}
          ];
          
          landmarks.forEach((pt, index) => {
            const flicker = 0.4 + 0.6 * Math.sin(timestamp * 0.015 + index);
            ctx.fillStyle = `rgba(212, 175, 55, ${flicker})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw connecting web contour lines
            if (index > 0 && index < 5) {
              ctx.strokeStyle = `rgba(212, 175, 55, ${flicker * 0.25})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(landmarks[index - 1].x, landmarks[index - 1].y);
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
        setScanSuccess(true);
      }
    };
    
    animId = requestAnimationFrame(drawScan);
    return () => cancelAnimationFrame(animId);
  }, [isScanning]);

  // Compress image helper using canvas
  const compressImage = (dataUrl: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
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
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  // Upload image to Supabase storage helper
  const uploadToSupabase = async (base64Str: string): Promise<string> => {
    if (isDemoMode) return base64Str;
    try {
      const res = await fetch(base64Str);
      const blob = await res.blob();
      const filename = `scan-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('hairstyles')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('hairstyles')
        .getPublicUrl(filename);
        
      return publicUrl;
    } catch (err) {
      console.warn("Supabase Storage upload failed, using local base64 fallback:", err);
      return base64Str;
    }
  };

  // Camera integration
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setCapturedImage(null);
      setScanSuccess(false);
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
      
      // Compress and trigger visual scanner
      const compressed = await compressImage(dataUrl);
      setCapturedImage(compressed);
      setIsScanning(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(event.target.result as string);
          setCapturedImage(compressed);
          setScanSuccess(false);
          setIsScanning(true);
        }
      };
      reader.readAsDataURL(file);
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
          setScanSuccess(false);
          setIsScanning(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Generation Handler
  const handleRunAiAnalysis = async () => {
    // Run Validation
    const errors = [];
    if (!capturedImage) errors.push("Please upload your image.");
    if (!faceShape) errors.push("Please select Face Shape.");
    if (!hairDensity) errors.push("Please select Hair Density.");
    if (!hairLength) errors.push("Please choose Hair Length.");
    if (!hasBeard) errors.push("Please select Beard Contouring.");
    if (!customText.trim()) errors.push("Please enter your desired hairstyle.");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setAnalyzing(true);
    setCancelRequested(false);
    setRecommendedImages([]);
    setSelectedImage(null);

    try {
      setLoadingStep("Uploading...");
      if (cancelRequested) return;
      const uploadedUrl = await uploadToSupabase(capturedImage!);

      setLoadingStep("Analyzing Face...");
      await new Promise(r => setTimeout(r, 600));
      if (cancelRequested) return;

      setLoadingStep("Detecting Landmarks...");
      await new Promise(r => setTimeout(r, 600));
      if (cancelRequested) return;

      setLoadingStep("Optimizing Prompt...");
      await new Promise(r => setTimeout(r, 500));
      if (cancelRequested) return;

      setLoadingStep("Generating Hairstyles...");
      const response = await fetch('/api/ai/virtual-hairstylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceShape,
          hairDensity,
          hairLength,
          hasBeard: hasBeard === 'Yes',
          description: customText,
          image: uploadedUrl
        })
      });

      if (!response.ok) {
        throw new Error('Server responded with status: ' + response.status);
      }

      setLoadingStep("Almost Done...");
      await new Promise(r => setTimeout(r, 500));
      const data = await response.json();
      if (cancelRequested) return;

      const generatedReport = data.report;
      setReportText(generatedReport);
      
      const imagesList = data.styledImages || (data.styledImage ? [data.styledImage] : []);
      setRecommendedImages(imagesList);
      if (imagesList.length > 0) {
        setSelectedImage(imagesList[0]);
      }

      // Add to Cache History
      const newHistoryItem = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        params: { faceShape, hairDensity, hairLength, hasBeard, customText },
        report: generatedReport,
        images: imagesList
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // Cap at 10 items

      onAnalyzeComplete(generatedReport);
    } catch (err) {
      console.error('Styling generation error:', err);
      setValidationErrors(["Unable to generate hairstyle. Please try again."]);
    } finally {
      setAnalyzing(false);
      setLoadingStep('');
    }
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

  // Download Image Helper
  const handleDownload = (imgUrl: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `styleslot-style-variation-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Toggle Favorite
  const toggleFavorite = (imgUrl: string) => {
    setFavorites(prev => 
      prev.includes(imgUrl) ? prev.filter(url => url !== imgUrl) : [...prev, imgUrl]
    );
  };

  // Share mock
  const handleShare = () => {
    navigator.clipboard.writeText("Check out my custom AI groom preview from StyleSlot! ✨");
    alert("Share text copied to clipboard!");
  };

  // Before After interactive slider
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Decorative top glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] pointer-events-none rounded-full" />
      
      {/* Header Tabs */}
      <div className="flex border-b border-white/5 bg-black/30">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'scan' ? 'bg-[#D4AF37]/15 text-yellow-400 border-b-2 border-[#D4AF37]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> AI Face-Shape Scan
        </button>
        <button
          onClick={() => setActiveTab('consult')}
          className={`flex-1 py-4 text-center font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'consult' ? 'bg-[#D4AF37]/15 text-yellow-400 border-b-2 border-[#D4AF37]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" /> Style Chat Assistant
        </button>
      </div>

      {activeTab === 'scan' ? (
        <div className="p-6 space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" /> Virtual Hairstylist Studio
            </h3>
            <p className="text-xs text-zinc-400">
              Instant symmetry scanning, personalized multi-variation previews, and matching platform routines.
            </p>
          </div>

          {/* Validation Alert Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Checklist (Incomplete Fields):</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
              {validationErrors.includes("Unable to generate hairstyle. Please try again.") && (
                <button 
                  onClick={handleRunAiAnalysis}
                  className="mt-1 self-start bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Generation
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Capture Console */}
            <div className="space-y-4">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative h-64 border-2 border-dashed border-white/10 rounded-2xl bg-zinc-950/80 flex flex-col items-center justify-center overflow-hidden transition-all group hover:border-[#D4AF37]/40"
              >
                {cameraActive ? (
                  <div className="w-full h-full relative">
                    <video ref={videoRef} className="w-full h-full object-cover rounded-2xl" autoPlay playsInline />
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-semibold rounded-full px-5 py-2 text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition"
                    >
                      <Camera className="w-3.5 h-3.5" /> Capture Frame
                    </button>
                  </div>
                ) : isScanning ? (
                  <div className="w-full h-full relative">
                    {capturedImage && (
                      <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover opacity-60 rounded-2xl" />
                    )}
                    <canvas 
                      ref={canvasRef} 
                      width={320} 
                      height={256} 
                      className="absolute inset-0 w-full h-full z-10"
                    />
                    <div className="absolute inset-0 bg-black/35 z-0" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-[#D4AF37]/30 text-white text-[10px] font-mono px-3.5 py-1.5 rounded-full flex items-center gap-2 z-20 whitespace-nowrap">
                      <RefreshCw className="w-3 h-3 animate-spin text-yellow-500" />
                      <span>Symmetry Scan: {scanProgress}% complete</span>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="w-full h-full relative">
                    <img src={capturedImage} alt="Face scan preview" className="w-full h-full object-cover rounded-2xl" />
                    
                    {scanSuccess ? (
                      <div className="absolute top-3 left-3 bg-emerald-500/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-400/25">
                        <CheckCircle2 className="w-3 h-3 text-white" /> [Symmetry Align Successful]
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-yellow-500/90 text-zinc-950 font-bold font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Info className="w-3 h-3" /> Image Loaded (Unscanned)
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => setIsScanning(true)}
                        className="bg-zinc-900/80 hover:bg-zinc-800 text-white font-semibold rounded-full p-2.5 text-xs transition border border-white/10"
                        title="Re-run Scanner"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          setScanSuccess(false);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full p-2.5 text-xs transition"
                        title="Clear photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-white font-semibold">Upload or capture your face snapshot</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Symmetry scanning is applied instantly</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="bg-zinc-800 border border-white/10 text-white hover:bg-zinc-700 text-[11px] font-semibold rounded-lg px-4 py-2 transition flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-yellow-500" /> Start Camera
                      </button>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500 text-[11px] font-bold rounded-lg px-4 py-2 transition"
                      >
                        Browse Folder
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
              </div>

              {/* Face Shape Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Symmetry Profile / Shape Preset *</label>
                <div className="grid grid-cols-3 gap-2">
                  {faceShapes.map(f => (
                    <button
                      key={f.name}
                      onClick={() => setFaceShape(f.name)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        faceShape === f.name 
                          ? 'bg-[#D4AF37]/25 text-yellow-400 border-yellow-500/60 shadow-lg shadow-yellow-500/5' 
                          : 'bg-zinc-900/60 border-white/5 hover:border-white/15 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{f.icon}</span>
                        <div className="text-[10px] font-bold">{f.name}</div>
                      </div>
                      <div className="text-[8px] text-zinc-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Preferences Tuning */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Hair Density Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Hair Density *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(density => (
                      <button
                        key={density}
                        onClick={() => setHairDensity(density)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          hairDensity === density 
                            ? 'bg-zinc-800 text-yellow-400 border-[#D4AF37]/50 shadow-md shadow-black/40' 
                            : 'bg-zinc-900/50 border-white/5 hover:border-white/10 text-zinc-400'
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Length picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Hair Length Category *</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['Buzz', 'Very Short', 'Short', 'Medium', 'Long'].map(length => (
                      <button
                        key={length}
                        onClick={() => setHairLength(length)}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all text-center ${
                          hairLength === length 
                            ? 'bg-zinc-800 text-yellow-400 border-[#D4AF37]/50 shadow-md shadow-black/40' 
                            : 'bg-zinc-900/50 border-white/5 hover:border-white/10 text-zinc-400'
                        }`}
                      >
                        {length}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beard Toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Beard Contouring *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setHasBeard(opt)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                          hasBeard === opt 
                            ? 'bg-zinc-800 text-yellow-400 border-[#D4AF37]/50 shadow-md shadow-black/40' 
                            : 'bg-zinc-900/50 border-white/5 hover:border-white/10 text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom specifications */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Custom Aesthetic Goals *</label>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Describe your desired look (e.g., 'Modern mullet with textured layers and thin flow', 'Low taper fade with a messy crop')"
                    className="w-full bg-zinc-950/80 border border-white/5 rounded-xl h-20 p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40 placeholder:text-zinc-600 resize-none"
                  />
                  
                  {/* Quick Select pills */}
                  <div className="flex flex-wrap gap-1">
                    {stylePills.map(pill => (
                      <button
                        key={pill}
                        onClick={() => setCustomText(pill)}
                        className="bg-white/5 hover:bg-[#D4AF37]/15 hover:text-yellow-400 border border-white/5 hover:border-yellow-500/25 px-2.5 py-1 rounded-full text-[9px] text-zinc-400 transition"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Future Roadmap / VIP parameters */}
                <div className="border border-white/5 rounded-2xl p-3 bg-zinc-950/40 space-y-2">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#D4AF37]" /> Future Ready Advanced Modifiers (Roadmap)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {futureOptions.map(opt => (
                      <div key={opt.label} className="flex items-center justify-between border border-white/5 bg-zinc-950/70 px-2 py-1.5 rounded-lg text-[9px] text-zinc-500">
                        <span>{opt.label}</span>
                        <span className="text-[7px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-zinc-800 text-yellow-500/70 border border-yellow-500/10">
                          {opt.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic incomplete fields checklist */}
              {(!capturedImage || !faceShape || !hairDensity || !hairLength || !hasBeard || !customText.trim()) && (
                <div className="text-[10px] text-zinc-500 font-mono flex flex-wrap gap-x-3 gap-y-1 items-center bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 justify-center">
                  <span className="text-yellow-500/70 font-bold uppercase tracking-wider text-[8px] mr-1">Missing Inputs:</span>
                  {!capturedImage ? <span className="text-zinc-600 font-sans">✕ Photo</span> : <span className="text-emerald-400 font-sans">✓ Photo</span>}
                  {!faceShape ? <span className="text-zinc-600 font-sans">✕ Shape</span> : <span className="text-emerald-400 font-sans">✓ Shape</span>}
                  {!hairDensity ? <span className="text-zinc-600 font-sans">✕ Density</span> : <span className="text-emerald-400 font-sans">✓ Density</span>}
                  {!hairLength ? <span className="text-zinc-600 font-sans">✕ Length</span> : <span className="text-emerald-400 font-sans">✓ Length</span>}
                  {!hasBeard ? <span className="text-zinc-600 font-sans">✕ Beard</span> : <span className="text-emerald-400 font-sans">✓ Beard</span>}
                  {!customText.trim() ? <span className="text-zinc-600 font-sans">✕ Goal</span> : <span className="text-emerald-400 font-sans">✓ Goal</span>}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleRunAiAnalysis}
                disabled={analyzing || !capturedImage || !faceShape || !hairDensity || !hairLength || !hasBeard || !customText.trim()}
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 text-zinc-950 font-bold py-3.5 px-4 rounded-xl text-xs hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/5 disabled:opacity-40"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing: {loadingStep}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-zinc-950" />
                    <span>Generate AI Grooming Recommendations</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Canceled/Status Panel during generation */}
          {analyzing && (
            <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
                <div className="text-xs">
                  <div className="text-white font-bold">{loadingStep}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Please wait, compiling style matrices...</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCancelRequested(true);
                  setAnalyzing(false);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 hover:text-red-400 text-zinc-400 border border-white/10 px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          )}

          {/* Results Gallery Panel */}
          {recommendedImages.length > 0 && (
            <div className="mt-4 bg-zinc-950 border border-yellow-500/25 rounded-2xl p-5 space-y-6 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-yellow-500">STYLE RESOLUTION REPORT</h4>
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  4 Variations Generated
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Selected Image Editor & Before/After Slider */}
                <div className="space-y-4">
                  {selectedImage && capturedImage && (
                    <div className="space-y-3">
                      {/* Before After Slider Container */}
                      <div 
                        ref={containerRef}
                        onMouseMove={(e) => handleSliderMove(e.clientX)}
                        onTouchMove={(e) => {
                          if (e.touches.length > 0) handleSliderMove(e.touches[0].clientX);
                        }}
                        className="relative w-full h-80 rounded-2xl overflow-hidden select-none cursor-ew-resize border border-white/10 shadow-lg bg-zinc-900"
                      >
                        {/* Before image */}
                        <img 
                          src={capturedImage} 
                          alt="Before scan" 
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-2.5 py-0.5 rounded text-[8px] font-mono font-bold text-white uppercase tracking-widest border border-white/10">
                          Original Profile
                        </div>

                        {/* After image */}
                        <div 
                          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                          style={{ width: `${sliderPos}%` }}
                        >
                          <img 
                            src={selectedImage} 
                            alt="AI style preview" 
                            className="absolute inset-0 w-full h-80 object-cover pointer-events-none max-w-none"
                            style={{ width: containerRef.current?.getBoundingClientRect().width || 400 }}
                          />
                          <div className="absolute top-3 right-3 bg-yellow-500/90 text-zinc-950 font-bold px-2.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase border border-yellow-400/20 whitespace-nowrap">
                            Style Preview
                          </div>
                        </div>

                        {/* Center bar */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_10px_#F59E0B]"
                          style={{ left: `${sliderPos}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-yellow-400 text-zinc-950 border border-zinc-900 flex items-center justify-center shadow-lg pointer-events-none">
                            <ArrowLeftRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>

                      {/* Active Actions */}
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setFullscreenImage(selectedImage)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-semibold rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 transition"
                          title="Fullscreen zoom"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-yellow-500" /> Fullscreen
                        </button>
                        <button
                          onClick={() => handleDownload(selectedImage!)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-semibold rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 transition"
                          title="Download photo"
                        >
                          <Download className="w-3.5 h-3.5 text-yellow-500" /> Download
                        </button>
                        <button
                          onClick={() => toggleFavorite(selectedImage!)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-semibold rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 transition"
                        >
                          <Star className={`w-3.5 h-3.5 ${favorites.includes(selectedImage!) ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-500'}`} />
                          <span>{favorites.includes(selectedImage!) ? 'Favorited' : 'Favorite'}</span>
                        </button>
                        <button
                          onClick={handleShare}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-semibold rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 transition"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5 text-yellow-500" /> Share
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grid Gallery selection & cache report */}
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Style Variations</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {recommendedImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(img)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            selectedImage === img 
                              ? 'border-yellow-500 scale-95 shadow-md shadow-yellow-500/10' 
                              : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <img src={img} alt={`Hairstyle Option ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-white">
                            v{idx + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Report analysis text */}
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-3 max-h-[170px] overflow-y-auto">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> Virtual Styling Director Report
                    </span>
                    <div className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans">
                      {reportText}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* History Panel */}
          {history.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-yellow-500" /> Previous Generated Sessions
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFaceShape(item.params.faceShape);
                      setHairDensity(item.params.hairDensity);
                      setHairLength(item.params.hairLength);
                      setHasBeard(item.params.hasBeard);
                      setCustomText(item.params.customText);
                      setReportText(item.report);
                      setRecommendedImages(item.images);
                      if (item.images.length > 0) {
                        setSelectedImage(item.images[0]);
                      }
                      setValidationErrors([]);
                    }}
                    className="flex-shrink-0 bg-zinc-950 border border-white/5 rounded-2xl p-3 text-left w-52 hover:border-[#D4AF37]/30 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[9px] text-zinc-500 font-mono flex items-center justify-between mb-1">
                        <span>{item.timestamp}</span>
                        <span className="text-yellow-500">Loaded</span>
                      </div>
                      <div className="text-[10px] text-white font-bold group-hover:text-yellow-400 truncate">
                        "{item.params.customText}"
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-1">
                        {item.params.faceShape} | {item.params.hairLength} | {item.params.hasBeard}
                      </div>
                    </div>
                    {item.images.length > 0 && (
                      <img src={item.images[0]} alt="History thumbnail" className="w-full h-12 object-cover rounded-lg mt-2 border border-white/5" />
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
          {/* Chat scroll box */}
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
                    ? 'bg-[#D4AF37]/90 text-zinc-950 font-medium rounded-tr-none' 
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
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-500" /> Analyzing trends...
                </div>
              </div>
            )}
          </div>

          {/* Form sender */}
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Stylist: 'Recommendation for triangle face shape' or 'What is a hot towel shave?'"
              className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-yellow-500/50 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 rounded-xl font-bold hover:opacity-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer max-w-[100px]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-full p-2.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={fullscreenImage} alt="Fullscreen hairstyle preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" />
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleDownload(fullscreenImage)}
              className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" /> Download Style Option
            </button>
            <button
              onClick={() => toggleFavorite(fullscreenImage)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 transition"
            >
              <Star className={`w-4 h-4 ${favorites.includes(fullscreenImage) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}`} />
              <span>{favorites.includes(fullscreenImage) ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
