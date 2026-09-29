import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Loader2,
  Droplets,
  Search,
  Sparkles,
  BookOpen,
  X,
  Check,
  ArrowUpRight,
  AlertCircle,
  LogIn,
  LogOut,
  Navigation,
  CloudRain,
  CloudLightning,
  AlertTriangle,
  MapPin,
  Mic,
} from 'lucide-react';
import {
  PlantSpecimen,
  SpecimenHistoryPoint,
  getSpecimenHistory,
  ChatMessage,
  ChatModelId,
  GpsAgroReport,
  HeavyRainAlertStatus,
  INITIAL_HERBARIUM_SPECIMENS,
  HERO_CONSERVATORY_IMAGE,
} from './types/botany';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { BotanicalImage } from './components/BotanicalImage';
import { SpecimenMonograph } from './components/SpecimenMonograph';
import { BotanistChat } from './components/BotanistChat';
import { GpsMeteorologyHub, evaluate24hHeavyRainAlert } from './components/GpsMeteorologyHub';
import { AgroServicesDirectory } from './components/AgroServicesDirectory';
import { ArchiveGrowthAnalytics } from './components/ArchiveGrowthAnalytics';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  User,
  saveSpecimenToFirestore,
  updateSpecimenWateringInFirestore,
  saveFieldReportToFirestore,
  deleteFieldReportFromFirestore,
  subscribeToUserFieldReports,
  SavedFieldReportDoc,
} from './lib/firebase';

type ActiveSection = 'identify' | 'meteorology' | 'services' | 'botanist' | 'herbarium';

const STORAGE_KEY_SPECIMENS = 'agrismart_specimens_v1';
const STORAGE_KEY_CHAT = 'agrismart_chat_v1';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('identify');

  // Firebase Auth & Cloud Firestore state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [savedCloudReports, setSavedCloudReports] = useState<SavedFieldReportDoc[]>([]);

  // GPS Coordinates & Meteorological Report state
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; label: string }>({
    latitude: -0.3031,
    longitude: 36.08,
    label: 'Rift Valley Agricultural Sector',
  });
  const [agroReport, setAgroReport] = useState<GpsAgroReport | null>(null);
  const [isLoadingAgroReport, setIsLoadingAgroReport] = useState<boolean>(false);
  const [agroReportError, setAgroReportError] = useState<string | null>(null);
  const [heavyRainAlert, setHeavyRainAlert] = useState<HeavyRainAlertStatus | null>(null);
  const [isRainBannerDismissed, setIsRainBannerDismissed] = useState<boolean>(false);

  // Herbarium collection state persisted in localStorage + synced to Firestore
  const [collection, setCollection] = useState<PlantSpecimen[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPECIMENS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_HERBARIUM_SPECIMENS;
  });

  const [activeSpecimen, setActiveSpecimen] = useState<PlantSpecimen>(
    () => collection[0] || INITIAL_HERBARIUM_SPECIMENS[0]
  );

  // Image Upload / Analysis State
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [fieldNotes, setFieldNotes] = useState<string>('');
  const [locationLabel, setLocationLabel] = useState<string>('North Plot / Conservatory Sector');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastUsedModel, setLastUsedModel] = useState<string | null>(null);

  // Camera capture modal state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monographAnchorRef = useRef<HTMLDivElement>(null);

  // Herbarium search & filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Multi-turn AgriSmart AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-msg-1',
        role: 'model',
        text: 'Welcome to AgriSmart AI. You can speak with me in real time using the Live Voice button above, upload photos of crops, leaves, or soil for immediate pathological diagnosis, or ask about expected rain windows, planting dates, soil pH amendments, and nearby agrovets.',
        timestamp: '08:00',
      },
    ];
  });
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to user's saved GPS Field Reports in Firestore when authenticated
  useEffect(() => {
    if (!authReady || !currentUser) {
      setSavedCloudReports([]);
      return;
    }
    const unsub = subscribeToUserFieldReports(currentUser.uid, (reports) => {
      setSavedCloudReports(reports);
    });
    return () => unsub();
  }, [authReady, currentUser]);

  // Fetch initial GPS meteorological & geological report on mount (trying live browser GPS first)
  const fetchGpsAgroReport = async (lat: number, lon: number, label = '') => {
    setIsLoadingAgroReport(true);
    setAgroReportError(null);
    try {
      const res = await fetch('/api/gps-agro-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          locationLabel: label,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not retrieve meteorological report.');
      }
      setAgroReport(data);
      const evaluatedAlert = evaluate24hHeavyRainAlert(data, 10.0, 75);
      setHeavyRainAlert(evaluatedAlert);
      if (evaluatedAlert?.isActive) {
        setIsRainBannerDismissed(false);
      }
      if (data.locationName) {
        setGpsCoords({ latitude: lat, longitude: lon, label: data.locationName });
      }
    } catch (err: any) {
      setAgroReportError(err?.message || 'Error retrieving GPS meteorological report.');
    } finally {
      setIsLoadingAgroReport(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          setGpsCoords({ latitude: lat, longitude: lon, label: 'Live GPS Sector' });
          fetchGpsAgroReport(lat, lon, '');
        },
        () => {
          fetchGpsAgroReport(gpsCoords.latitude, gpsCoords.longitude, gpsCoords.label);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      fetchGpsAgroReport(gpsCoords.latitude, gpsCoords.longitude, gpsCoords.label);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPECIMENS, JSON.stringify(collection));
    } catch {
      // ignore quota errors
    }
  }, [collection]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatMessages));
    } catch {
      // ignore
    }
  }, [chatMessages]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError(
        err?.message || 'Camera access was declined or is unavailable. Please use the Upload Photo button instead.'
      );
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setUploadedPreview(dataUrl);
      setUploadedMimeType('image/jpeg');
    }
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPreview(reader.result);
        setUploadedMimeType(file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async (customImagePath?: string, customTitle?: string) => {
    if (!uploadedPreview && !customImagePath) {
      setAnalysisError('Please select or capture a plant photograph first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: customImagePath ? undefined : uploadedPreview,
          imagePath: customImagePath,
          mimeType: uploadedMimeType,
          userNotes: fieldNotes || (customTitle ? `Inspecting specimen: ${customTitle}` : ''),
          model: 'gemini-3.5-flash',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.analysis) {
        throw new Error(data.error || 'Failed to analyze plant specimen.');
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

      const newSpecimen: PlantSpecimen = {
        id: `spec_${Date.now()}`,
        accessionNumber: `ACC. 2026.${String(collection.length + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`,
        dateCataloged: formattedDate,
        imageUrl: customImagePath || uploadedPreview || HERO_CONSERVATORY_IMAGE,
        locationInHome: locationLabel || gpsCoords.label,
        lastWateredDate: todayStr,
        nextWateringDueDays: 7,
        analysis: data.analysis,
      };

      setLastUsedModel(data.modelUsed || 'gemini-3.5-flash');
      setActiveSpecimen(newSpecimen);
      setCollection((prev) => [newSpecimen, ...prev]);

      if (currentUser) {
        await saveSpecimenToFirestore(newSpecimen);
      }

      setTimeout(() => {
        monographAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setAnalysisError(err?.message || 'Could not complete plant identification. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToCollection = async (specimen: PlantSpecimen) => {
    if (!collection.some((item) => item.id === specimen.id)) {
      setCollection((prev) => [specimen, ...prev]);
    }
    if (currentUser) {
      await saveSpecimenToFirestore(specimen);
      setStatusNotice(`Saved ${specimen.analysis.commonName} to your Cloud Firestore Farm Archive.`);
    } else {
      setStatusNotice(`Saved ${specimen.analysis.commonName} to local Farm Archive.`);
    }
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleLogWatering = async (specimenId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const bumpWaterHistory = (spec: PlantSpecimen): PlantSpecimen => {
      const baseHistory = [...getSpecimenHistory(spec)];
      if (baseHistory.length > 0) {
        const lastIdx = baseHistory.length - 1;
        baseHistory[lastIdx] = {
          ...baseHistory[lastIdx],
          wateringsPerMonth: baseHistory[lastIdx].wateringsPerMonth + 1,
          waterVolumeMl: baseHistory[lastIdx].waterVolumeMl + 450,
        };
      }
      return {
        ...spec,
        lastWateredDate: today,
        nextWateringDueDays: 8,
        growthHistory: baseHistory,
      };
    };

    setCollection((prev) =>
      prev.map((item) => (item.id === specimenId ? bumpWaterHistory(item) : item))
    );
    if (activeSpecimen.id === specimenId) {
      setActiveSpecimen((prev) => bumpWaterHistory(prev));
    }
    const target = collection.find((c) => c.id === specimenId) || activeSpecimen;
    if (currentUser) {
      try {
        await saveSpecimenToFirestore({ ...target, lastWateredDate: today, nextWateringDueDays: 8 });
        await updateSpecimenWateringInFirestore(specimenId, today, 8);
      } catch {
        // handled inside firebase helper
      }
    }
    setStatusNotice(`Recorded irrigation (+450 mL) for ${target.analysis.commonName} on ${today}.`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleAppendHistoryPoint = (specimenId: string, point: SpecimenHistoryPoint) => {
    setCollection((prev) =>
      prev.map((item) => {
        if (item.id !== specimenId) return item;
        const currentHist = getSpecimenHistory(item);
        return {
          ...item,
          growthHistory: [...currentHist, point],
        };
      })
    );
    if (activeSpecimen.id === specimenId) {
      setActiveSpecimen((prev) => ({
        ...prev,
        growthHistory: [...getSpecimenHistory(prev), point],
      }));
    }
    setStatusNotice(`Logged ${point.period} growth phase (${point.heightCm} cm · ${point.waterVolumeMl} mL) to Recharts analytics.`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleSaveReportToCloud = async () => {
    if (!agroReport || !currentUser) return;
    const peakRain = agroReport.dailyForecast?.[0];
    await saveFieldReportToFirestore({
      locationName: agroReport.locationName,
      latitude: agroReport.latitude,
      longitude: agroReport.longitude,
      altitudeMeters: agroReport.altitudeMeters,
      estimatedSoilPh: 'pH 5.8 - 6.8 (Verified Regional Profile)',
      rainWindow: peakRain
        ? `${peakRain.date}: ${peakRain.rainProbPct}% chance (${peakRain.rainSumMm} mm)`
        : '7-day forecast logged',
      plantingWindow: `Optimal window for ${agroReport.altitudeMeters}m elevation`,
      advisoryNotes: agroReport.advisoryMarkdown,
    });
    setStatusNotice(`Saved ${agroReport.locationName} meteorological report to Cloud Firestore.`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleSendChatMessage = async (
    text: string,
    model: ChatModelId,
    imageBase64?: string,
    mimeType?: string,
    useSearchGrounding = true
  ) => {
    const nowTime = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: nowTime,
      imagePreview: imageBase64,
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsChatSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          activeSpecimen: activeSpecimen.analysis,
          gpsContext: agroReport,
          useSearchGrounding,
          messages: updatedHistory.map((m) => ({
            role: m.role,
            text: m.text,
            imageBase64: m.imagePreview,
            mimeType: mimeType || 'image/jpeg',
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Consultation request failed.');
      }

      const replyTime = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: replyTime,
        modelUsed: data.modelUsed,
        searchLinks: data.searchLinks,
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `AgriSmart AI encountered an interruption: ${err?.message || 'Unknown error'}. Please resend your inquiry.`,
        timestamp: nowTime,
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleAskBotanistFromMonograph = (specimen: PlantSpecimen, initialQuestion?: string) => {
    setActiveSpecimen(specimen);
    setActiveSection('botanist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (initialQuestion) {
      handleSendChatMessage(initialQuestion, 'gemini-3.5-flash');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (currentUser) {
        await signOutUser();
        setStatusNotice('Signed out of AgriSmart Cloud.');
      } else {
        const user = await signInWithGoogle();
        setStatusNotice(`Signed in as ${user.displayName || user.email}. Cloud Firestore sync active.`);
      }
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      setStatusNotice(`Sign-in notice: ${err?.message || 'Could not complete Google Sign-In.'}`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const uniqueFamilies = Array.from(new Set(collection.map((s) => s.analysis.family)));
  const filteredSpecimens = collection.filter((item) => {
    const matchesSearch =
      item.analysis.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.analysis.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.analysis.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationInHome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = familyFilter === 'all' || item.analysis.family === familyFilter;
    return matchesSearch && matchesFamily;
  });

  const isActiveSaved = collection.some((c) => c.id === activeSpecimen.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <OfflineIndicator />

      {/* STRICT 3-ZONE TOP BAR CONTRACT — PROMINENT, IMMEDIATELY RECOGNIZABLE AGRISMART NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-xs border-b-2 border-[#14532D]">
        {/* HIGH-VISIBILITY 24-HOUR HEAVY RAINFALL ALERT BANNER IN HEADER */}
        {heavyRainAlert?.isActive && !isRainBannerDismissed && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-[#7F1D1D] text-[#FBF9F5] border-b-2 border-[#F59E0B] px-4 sm:px-8 py-3"
          >
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-xs bg-[#991B1B] border border-[#FCA5A5]/40 shrink-0 mt-0.5 sm:mt-0">
                  <CloudLightning className="w-5 h-5 text-[#FDE68A]" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-sans-ui uppercase tracking-widest font-bold text-[#FDE68A]">
                    <span>24-Hour Heavy Rainfall Warning</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {heavyRainAlert.expectedRainMm.toFixed(1)} mm Expected ({heavyRainAlert.rainProbabilityPct}% Prob)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{heavyRainAlert.onsetWindow}</span>
                  </div>
                  <p className="text-sm sm:text-base font-display font-bold text-[#FBF9F5] leading-snug">
                    {heavyRainAlert.headline} —{' '}
                    <span className="font-serif-prose font-normal text-[#FEE2E2]">
                      Suspend foliar spraying & soluble nitrogen top-dressing; clear plot drainage channels immediately.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSection('meteorology')}
                  className="px-3.5 py-1.5 text-xs font-sans-ui font-bold uppercase tracking-wider bg-[#FDE68A] hover:bg-[#FCD34D] text-[#1C1917] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  Inspect 24h Rain Forecast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('botanist');
                    handleSendChatMessage(
                      `Heavy rainfall (${heavyRainAlert.expectedRainMm} mm, ${heavyRainAlert.rainProbabilityPct}% probability) is predicted within the next 24 hours in ${heavyRainAlert.locationName}. What immediate drainage, crop protection, and fertilizer leaching precautions should I take for my crops, especially ${activeSpecimen.analysis.commonName}?`,
                      'gemini-3.5-flash'
                    );
                  }}
                  className="px-3.5 py-1.5 text-xs font-sans-ui font-semibold bg-[#991B1B] hover:bg-[#B91C1C] text-[#FBF9F5] border border-[#FCA5A5]/50 rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  Ask AgriSmart AI Action Plan
                </button>
                <button
                  type="button"
                  onClick={() => setIsRainBannerDismissed(true)}
                  className="p-1.5 text-[#FECACA] hover:text-[#FBF9F5] cursor-pointer"
                  aria-label="Dismiss heavy rainfall alert banner"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('identify');
            }}
            className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#14532D] whitespace-nowrap shrink-0"
          >
            AgriSmart
          </a>

          {/* Zone 2: 5 Easily Recognizable Text Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-base font-sans-ui font-semibold text-[#292524]"
          >
            <button
              type="button"
              onClick={() => setActiveSection('identify')}
              className={`py-2 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeSection === 'identify'
                  ? 'text-[#14532D] border-[#14532D]'
                  : 'border-transparent hover:text-[#14532D]'
              }`}
            >
              Identify & Diagnose
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('meteorology')}
              className={`py-2 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeSection === 'meteorology'
                  ? 'text-[#14532D] border-[#14532D]'
                  : 'border-transparent hover:text-[#14532D]'
              }`}
            >
              GPS Weather & Soil
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('services')}
              className={`py-2 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeSection === 'services'
                  ? 'text-[#14532D] border-[#14532D]'
                  : 'border-transparent hover:text-[#14532D]'
              }`}
            >
              Agrovets & Vets
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('botanist')}
              className={`py-2 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeSection === 'botanist'
                  ? 'text-[#14532D] border-[#14532D]'
                  : 'border-transparent hover:text-[#14532D]'
              }`}
            >
              AgriSmart AI & Voice
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('herbarium')}
              className={`py-2 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeSection === 'herbarium'
                  ? 'text-[#14532D] border-[#14532D]'
                  : 'border-transparent hover:text-[#14532D]'
              }`}
            >
              Farm Archive ({collection.length})
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Install App + Google Sign-In) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {currentUser ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">
                    {currentUser.displayName?.split(' ')[0] || 'Sign Out'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Farmer Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recognizable Mobile / Tablet Navigation Bar */}
        <div className="flex lg:hidden items-center justify-start sm:justify-around overflow-x-auto border-t border-[#D6CEBE] bg-[#F3EFE6] px-3 py-2 gap-2 text-xs font-sans-ui font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('identify')}
            className={`px-3 py-1.5 rounded-xs whitespace-nowrap cursor-pointer ${
              activeSection === 'identify' ? 'bg-[#14532D] text-[#FBF9F5]' : 'text-[#1C1917]'
            }`}
          >
            Identify Crop
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('meteorology')}
            className={`px-3 py-1.5 rounded-xs whitespace-nowrap cursor-pointer ${
              activeSection === 'meteorology' ? 'bg-[#14532D] text-[#FBF9F5]' : 'text-[#1C1917]'
            }`}
          >
            GPS Weather & Soil
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('services')}
            className={`px-3 py-1.5 rounded-xs whitespace-nowrap cursor-pointer ${
              activeSection === 'services' ? 'bg-[#14532D] text-[#FBF9F5]' : 'text-[#1C1917]'
            }`}
          >
            Agrovets & Vets
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('botanist')}
            className={`px-3 py-1.5 rounded-xs whitespace-nowrap cursor-pointer ${
              activeSection === 'botanist' ? 'bg-[#14532D] text-[#FBF9F5]' : 'text-[#1C1917]'
            }`}
          >
            AI & Live Voice
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('herbarium')}
            className={`px-3 py-1.5 rounded-xs whitespace-nowrap cursor-pointer ${
              activeSection === 'herbarium' ? 'bg-[#14532D] text-[#FBF9F5]' : 'text-[#1C1917]'
            }`}
          >
            Archive ({collection.length})
          </button>
        </div>
      </header>

      {/* Operational GPS & Weather Telemetry Ribbon */}
      <div className="bg-[#F3EFE6] border-b border-[#D6CEBE] text-xs sm:text-sm font-sans-ui text-[#57534E]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-[#14532D]">
              GPS Sector: {agroReport?.locationName || gpsCoords.label}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Lat {gpsCoords.latitude.toFixed(3)}°, Lon {gpsCoords.longitude.toFixed(3)}°
            </span>
            {agroReport && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular font-semibold text-[#1C1917]">
                  Altitude: {agroReport.altitudeMeters}m ASL
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  Air: {agroReport.currentWeather.temperatureC}°C · Humidity: {agroReport.currentWeather.humidityPct}%
                </span>
              </>
            )}
          </div>

          {statusNotice ? (
            <div className="flex items-center gap-2 text-[#14532D] font-semibold">
              <Check className="w-4 h-4" />
              <span>{statusNotice}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              {heavyRainAlert?.isActive && isRainBannerDismissed && (
                <button
                  type="button"
                  onClick={() => setIsRainBannerDismissed(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-sans-ui font-bold text-[#991B1B] hover:underline cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Show 24h Heavy Rain Alert ({heavyRainAlert.expectedRainMm} mm)</span>
                </button>
              )}
              {!heavyRainAlert?.isActive && (
                <button
                  type="button"
                  onClick={() => {
                    const loc = agroReport?.locationName || gpsCoords.label || 'Active GPS Sector';
                    const dateStr = agroReport?.dailyForecast?.[0]?.date || new Date().toISOString().split('T')[0];
                    setIsRainBannerDismissed(false);
                    setHeavyRainAlert({
                      isActive: true,
                      locationName: loc,
                      forecastDate: dateStr,
                      expectedRainMm: 34.8,
                      rainProbabilityPct: 92,
                      severity: 'extreme',
                      onsetWindow: `Within Next 24 Hours (${dateStr})`,
                      headline: `HEAVY RAINFALL WARNING (NEXT 24H): 34.8 mm (92% probability) predicted across ${loc}`,
                      agronomicImpact:
                        'Severe risk of surface runoff, root-zone waterlogging, and wash-off of newly applied foliar nutrients or fungicides.',
                      recommendedActions: [
                        'Suspend all foliar chemical or organic spraying and nitrogen top-dressing for the next 24 hours.',
                        'Clear perimeter drainage ditches and reinforce soil ridges on sloped plots before storm onset.',
                        'Secure greenhouse vents and harvest ripe field produce immediately.',
                      ],
                      isSimulated: true,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-sans-ui font-semibold text-[#78350F] hover:text-[#991B1B] hover:underline cursor-pointer"
                >
                  <CloudLightning className="w-3.5 h-3.5" />
                  <span>Simulate 24h Heavy Rain Alert</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveSection('meteorology')}
                className="text-xs font-sans-ui font-semibold text-[#14532D] hover:underline cursor-pointer"
              >
                View Rain & Planting Forecast →
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('services')}
                className="text-xs font-sans-ui font-semibold text-[#1C1917] hover:underline cursor-pointer"
              >
                Find Nearby Agrovets & Vets →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* VIEW 1: IDENTIFY & DIAGNOSE + QUICK GPS DASHBOARD CARDS */}
        {activeSection === 'identify' && (
          <div className="space-y-14">
            {/* Hero & Photo Identification Bench */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* Left 7 Columns: Real Conservatory Photography Banner with Measured Scrim */}
              <div className="lg:col-span-7 relative rounded-md overflow-hidden border border-[#D6CEBE] min-h-[460px] flex flex-col justify-end">
                <div className="absolute inset-0">
                  <BotanicalImage
                    src={HERO_CONSERVATORY_IMAGE}
                    alt="Sunlit agricultural glasshouse conservatory with crops and botanical specimens"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
                </div>

                <div className="relative z-10 p-6 sm:p-10 text-[#FBF9F5] space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-sans-ui uppercase tracking-widest text-[#D6CEBE]">
                    <span>AgriSmart Intelligence</span>
                    <span aria-hidden="true">·</span>
                    <span>GPS Meteorology & Soil pH</span>
                    <span aria-hidden="true">·</span>
                    <span>Live Voice & Vision AI</span>
                  </div>
                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.06] text-[#FBF9F5]"
                    style={{ textWrap: 'balance' }}
                  >
                    Precision Crop Identification, GPS Weather & Farmer Advisory.
                  </h1>
                  <p className="text-lg sm:text-xl font-serif-prose text-[#EBE6DF] max-w-2xl leading-relaxed">
                    Identify plants and crop diseases from a photo, track GPS altitude, soil pH, and expected rain windows, converse with AgriSmart Live Voice AI, and locate nearby veterinary clinics and agrovets.
                  </p>

                  {/* Fast Navigation Action Strip inside Hero */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('meteorology')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold bg-[#14532D] hover:bg-[#0F3F22] text-[#FBF9F5] rounded-md transition-colors cursor-pointer"
                    >
                      <CloudRain className="w-4 h-4" />
                      <span>GPS Rain & Planting Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('services')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold bg-[#FBF9F5]/95 hover:bg-[#FBF9F5] text-[#1C1917] rounded-md transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#14532D]" />
                      <span>Nearby Agrovets & Veterinaries</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('botanist')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold bg-black/70 hover:bg-black/85 text-[#FBF9F5] border border-[#D6CEBE]/40 rounded-md transition-colors cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Talk to Live Voice AI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Photographic Specimen Examination Bench */}
              <div className="lg:col-span-5 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-2 border-b border-[#D6CEBE] pb-4">
                  <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                    AgriSmart Optical Diagnostics
                  </span>
                  <h2 className="text-3xl font-display font-semibold text-[#1C1917]">
                    Identify Plant or Crop From Photo
                  </h2>
                  <p className="text-base font-serif-prose text-[#57534E]">
                    Upload or snap a photo of any leaf, crop, or plant to receive a full care monograph, soil pH target, and disease diagnosis.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadedPreview ? (
                  <div className="space-y-4">
                    <div className="relative aspect-4/3 w-full rounded-xs overflow-hidden border border-[#C8BFA8] bg-[#EBE6DF]">
                      <img
                        src={uploadedPreview}
                        alt="Uploaded crop or plant preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedPreview(null)}
                        className="absolute top-3 right-3 px-3 py-1.5 text-xs font-sans-ui font-semibold bg-black/75 text-[#FBF9F5] rounded-xs hover:bg-black cursor-pointer"
                      >
                        Replace Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#C8BFA8] hover:border-[#14532D] bg-[#FBF9F5] rounded-md p-6 text-center cursor-pointer transition-colors space-y-3"
                  >
                    <Upload className="w-8 h-8 text-[#14532D] mx-auto" />
                    <div>
                      <p className="text-xl font-display font-semibold text-[#1C1917]">
                        Upload Crop or Plant Photograph
                      </p>
                      <p className="text-sm font-sans-ui text-[#57534E] mt-0.5">
                        JPEG, PNG, or WebP of foliage, stem, fruit, or soil
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="specimen-location"
                      className="block text-xs font-sans-ui font-semibold uppercase tracking-wider text-[#57534E] mb-1"
                    >
                      Farm Plot / Location
                    </label>
                    <input
                      id="specimen-location"
                      type="text"
                      value={locationLabel}
                      onChange={(e) => setLocationLabel(e.target.value)}
                      placeholder="e.g. Plot B / Greenhouse"
                      className="w-full px-3.5 py-2.5 text-sm font-sans-ui bg-[#FBF9F5] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="specimen-notes"
                      className="block text-xs font-sans-ui font-semibold uppercase tracking-wider text-[#57534E] mb-1"
                    >
                      Observed Symptoms (Optional)
                    </label>
                    <input
                      id="specimen-notes"
                      type="text"
                      value={fieldNotes}
                      onChange={(e) => setFieldNotes(e.target.value)}
                      placeholder="e.g. Yellowing margins, spots"
                      className="w-full px-3.5 py-2.5 text-sm font-sans-ui bg-[#FBF9F5] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
                    />
                  </div>
                </div>

                {analysisError && (
                  <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xs flex items-start gap-2.5 text-sm font-sans-ui text-[#991B1B]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{analysisError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isAnalyzing || !uploadedPreview}
                    onClick={() => handleAnalyzePhoto()}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Specimen...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Identify & Diagnose Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4 text-[#14532D]" />
                    <span>Use Camera</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Reference Botanical Plates */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D6CEBE] pb-4">
                <div>
                  <span className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
                    Verified Reference Plates · Instant Monograph & Vision Test
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-display font-semibold text-[#1C1917] mt-1">
                    Agricultural & Botanical Reference Specimens
                  </h2>
                </div>
                <p className="text-base font-serif-prose italic text-[#57534E]">
                  Click any real specimen photograph below to view its cultivation monograph or run a live AI vision analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {INITIAL_HERBARIUM_SPECIMENS.map((item) => {
                  const isSelected = activeSpecimen.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`group flex flex-col justify-between rounded-md border transition-colors p-4 ${
                        isSelected
                          ? 'bg-[#F3EFE6] border-[#14532D]'
                          : 'bg-[#FBF9F5] border-[#D6CEBE] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <div>
                        <div
                          onClick={() => {
                            setActiveSpecimen(item);
                            monographAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="aspect-4/3 w-full overflow-hidden rounded-xs border border-[#D6CEBE] cursor-pointer"
                        >
                          <BotanicalImage
                            src={item.imageUrl}
                            alt={item.analysis.commonName}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-sans-ui text-[#57534E] mt-3">
                          <span className="font-mono-tabular">{item.accessionNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.analysis.family}</span>
                        </div>

                        <h3 className="text-2xl font-display font-semibold text-[#1C1917] mt-1">
                          {item.analysis.commonName}
                        </h3>
                        <p className="text-base font-serif-prose italic text-[#57534E]">
                          {item.analysis.scientificName}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D6CEBE] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSpecimen(item);
                            monographAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-xs font-sans-ui font-semibold text-[#14532D] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Read Care Guide
                        </button>
                        <button
                          type="button"
                          disabled={isAnalyzing}
                          onClick={() => handleAnalyzePhoto(item.imageUrl, item.analysis.commonName)}
                          className="inline-flex items-center gap-1 text-xs font-sans-ui font-medium text-[#292524] hover:text-[#1C1917] cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          <span>Analyze Photo</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Active Botanical Monograph View */}
            <div ref={monographAnchorRef}>
              {lastUsedModel && (
                <div className="mb-4 text-xs font-sans-ui text-[#57534E] flex items-center gap-2">
                  <span>Latest Vision Analysis Completed</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">Engine: {lastUsedModel}</span>
                </div>
              )}
              <SpecimenMonograph
                specimen={activeSpecimen}
                isSavedInCollection={isActiveSaved}
                onSaveToCollection={handleSaveToCollection}
                onLogWatering={handleLogWatering}
                onAskBotanist={handleAskBotanistFromMonograph}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: GPS METEOROLOGY, SOIL pH, ALTITUDE & PLANTING ADVISORY */}
        {activeSection === 'meteorology' && (
          <GpsMeteorologyHub
            gpsCoords={gpsCoords}
            onUpdateCoords={(lat, lon, label) => setGpsCoords({ latitude: lat, longitude: lon, label })}
            agroReport={agroReport}
            isLoadingReport={isLoadingAgroReport}
            reportError={agroReportError}
            onFetchReport={fetchGpsAgroReport}
            onSaveReportToCloud={handleSaveReportToCloud}
            savedReports={savedCloudReports}
            onDeleteSavedReport={deleteFieldReportFromFirestore}
            isAuthenticated={!!currentUser}
            heavyRainAlert={heavyRainAlert}
            onTriggerHeavyRainAlert={(alert) => {
              setHeavyRainAlert(alert);
              if (alert?.isActive) {
                setIsRainBannerDismissed(false);
              }
            }}
          />
        )}

        {/* VIEW 3: GPS AGROVETS, VETERINARIES & AGRICULTURAL INSTITUTIONS (GOOGLE MAPS GROUNDING) */}
        {activeSection === 'services' && (
          <AgroServicesDirectory
            gpsCoords={gpsCoords}
            onUpdateCoords={(lat, lon, label) => setGpsCoords({ latitude: lat, longitude: lon, label })}
          />
        )}

        {/* VIEW 4: AGRISMART AI CONSULTATION & LIVE VOICE (GEMINI 3.8 LIVE + MULTIMODAL CHAT) */}
        {activeSection === 'botanist' && (
          <BotanistChat
            activeSpecimen={activeSpecimen}
            gpsReport={agroReport}
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            onClearChat={() =>
              setChatMessages([
                {
                  id: `welcome-${Date.now()}`,
                  role: 'model',
                  text: `Consultation thread reset. How can AgriSmart AI assist you with ${activeSpecimen.analysis.commonName}, your GPS weather outlook, or soil pH management today?`,
                  timestamp: 'Now',
                },
              ])
            }
            isSending={isChatSending}
          />
        )}

        {/* VIEW 5: FARM SPECIMEN ARCHIVE & IRRIGATION LEDGER */}
        {activeSection === 'herbarium' && (
          <section className="space-y-12">
            <div className="border-b border-[#1C1917] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                  Cloud Firestore Synced · Farm Specimen Catalog & Irrigation Ledger
                </p>
                <h1 className="text-4xl sm:text-5xl font-display font-semibold text-[#1C1917] mt-1">
                  Farm Herbarium & Irrigation Schedule
                </h1>
                <p className="text-lg font-serif-prose text-[#57534E] mt-2 max-w-2xl">
                  Manage your identified plants and crops, record watering dates, and inspect soil pH and humidity requirements across your farm plots.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search crop, species, plot..."
                    className="pl-10 pr-4 py-2.5 text-sm font-sans-ui bg-[#F3EFE6] border border-[#C8BFA8] rounded-md text-[#1C1917]"
                  />
                </div>

                <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] border border-[#D6CEBE] rounded-md">
                  <button
                    type="button"
                    onClick={() => setFamilyFilter('all')}
                    className={`px-3 py-1.5 text-xs font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                      familyFilter === 'all'
                        ? 'bg-[#14532D] text-[#FBF9F5]'
                        : 'text-[#292524] hover:text-[#1C1917]'
                    }`}
                  >
                    All ({collection.length})
                  </button>
                  {uniqueFamilies.map((fam) => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => setFamilyFilter(fam)}
                      className={`px-3 py-1.5 text-xs font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                        familyFilter === fam
                          ? 'bg-[#14532D] text-[#FBF9F5]'
                          : 'text-[#292524] hover:text-[#1C1917]'
                      }`}
                    >
                      {fam}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recharts Historical Plant Growth Phases & Water Usage Frequency Line Graph */}
            <ArchiveGrowthAnalytics
              specimens={collection}
              selectedSpecimenId={activeSpecimen.id}
              onSelectSpecimen={(spec) => setActiveSpecimen(spec)}
              onAppendHistoryPoint={handleAppendHistoryPoint}
              onConsultAI={handleAskBotanistFromMonograph}
            />

            {filteredSpecimens.length === 0 ? (
              <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-12 text-center space-y-4">
                <BookOpen className="w-10 h-10 text-[#14532D] mx-auto opacity-80" />
                <h2 className="text-2xl font-display font-semibold text-[#1C1917]">
                  No Matching Specimens Found
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFamilyFilter('all');
                  }}
                  className="px-5 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] rounded-md cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredSpecimens.map((spec) => (
                  <article
                    key={spec.id}
                    className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 flex flex-col justify-between gap-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                      <div className="sm:col-span-5 aspect-4/3 w-full overflow-hidden rounded-xs border border-[#C8BFA8]">
                        <BotanicalImage
                          src={spec.imageUrl}
                          alt={spec.analysis.commonName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="sm:col-span-7 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-sans-ui text-[#57534E]">
                          <span className="font-mono-tabular font-semibold text-[#1C1917]">
                            {spec.accessionNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{spec.analysis.family}</span>
                          <span aria-hidden="true">·</span>
                          <span>{spec.locationInHome}</span>
                        </div>

                        <h2 className="text-3xl font-display font-semibold text-[#1C1917]">
                          {spec.analysis.commonName}
                        </h2>
                        <p className="text-lg font-serif-prose italic text-[#57534E]">
                          {spec.analysis.scientificName}
                        </p>

                        <p className="text-base font-serif-prose text-[#292524] line-clamp-3 leading-relaxed">
                          {spec.analysis.editorialSummary}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#D6CEBE] flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs font-mono-tabular text-[#57534E]">
                        <span>Last Irrigated: {spec.lastWateredDate}</span>
                        <span className="mx-2">·</span>
                        <span>Soil pH: {spec.analysis.careInstructions.soilAndSubstrate.pHRange}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleLogWatering(spec.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Droplets className="w-3.5 h-3.5 text-[#14532D]" />
                          <span>Log Watering</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveSpecimen(spec);
                            setActiveSection('identify');
                            setTimeout(() => {
                              monographAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }, 80);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>Full Monograph</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Quantitative Irrigation & Soil pH Ledger Table */}
            <div className="overflow-x-auto border border-[#D6CEBE] rounded-md bg-[#FBF9F5]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F3EFE6] border-b border-[#D6CEBE] text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                    <th className="py-4 px-5">Specimen & Taxon</th>
                    <th className="py-4 px-4">Farm Plot</th>
                    <th className="py-4 px-4 text-right">Target Soil pH</th>
                    <th className="py-4 px-4 text-right">Humidity</th>
                    <th className="py-4 px-4 text-right">Last Watered</th>
                    <th className="py-4 px-4 text-right">Next Due</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6CEBE] text-base">
                  {collection.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F3EFE6]/70 transition-colors">
                      <td className="py-4 px-5">
                        <span className="text-lg font-display font-semibold text-[#1C1917] block">
                          {item.analysis.commonName}
                        </span>
                        <span className="text-xs font-serif-prose italic text-[#57534E]">
                          {item.analysis.scientificName}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-sans-ui text-sm text-[#292524]">
                        {item.locationInHome}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular text-sm text-[#1C1917]">
                        {item.analysis.careInstructions.soilAndSubstrate.pHRange.split(' ')[0]}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular text-sm text-[#1C1917]">
                        {item.analysis.careInstructions.humidityAndTemp.idealHumidityPct.replace('Relative Humidity', '')}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular text-sm text-[#57534E]">
                        {item.lastWateredDate}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular text-sm font-semibold text-[#14532D]">
                        In {item.nextWateringDueDays} {item.nextWateringDueDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleLogWatering(item.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Droplets className="w-3.5 h-3.5" />
                          <span>Mark Watered</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* CAMERA VIEWFINDER MODAL */}
      {isCameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-modal-title"
        >
          <div className="w-full max-w-2xl rounded-md bg-[#FBF9F5] border border-[#D6CEBE] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#D6CEBE] pb-4">
              <div>
                <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                  Live Optical Viewfinder
                </span>
                <h3 id="camera-modal-title" className="text-2xl font-display font-semibold text-[#1C1917]">
                  Capture Crop or Plant Specimen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setIsCameraOpen(false);
                }}
                className="p-2 text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                aria-label="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-6 bg-[#F3EFE6] border border-[#D6CEBE] rounded-xs text-center space-y-4">
                <p className="text-base font-serif-prose text-[#292524]">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setIsCameraOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] rounded-md cursor-pointer"
                >
                  Select Photo From Device Instead
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-4/3 w-full bg-black rounded-xs overflow-hidden border border-[#C8BFA8]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setIsCameraOpen(false);
                    }}
                    className="px-4 py-2.5 text-sm font-sans-ui font-medium text-[#1C1917] bg-[#EBE6DF] rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Specimen Plate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDITORIAL FOOTER */}
      <footer className="border-t border-[#D6CEBE] bg-[#F3EFE6] mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-sans-ui text-[#57534E]">
          <div>
            <strong className="font-display text-xl text-[#14532D] font-bold">AgriSmart</strong>
            <span className="mx-2">·</span>
            <span>Botanical Identification, GPS Meteorology, Soil pH & Agricultural Extension Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveSection('identify')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Identify & Diagnose
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('meteorology')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              GPS Weather & Soil
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('services')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Agrovets & Vets
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('botanist')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              AgriSmart AI & Voice
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
