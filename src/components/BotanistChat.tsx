import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, Trash2, Loader2, CornerDownLeft, Globe, ExternalLink } from 'lucide-react';
import { ChatMessage, ChatModelId, PlantSpecimen, GpsAgroReport } from '../types/botany';
import { BotanicalImage } from './BotanicalImage';
import { LiveVoiceAssistant } from './LiveVoiceAssistant';

interface BotanistChatProps {
  activeSpecimen: PlantSpecimen;
  gpsReport: GpsAgroReport | null;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    model: ChatModelId,
    imageBase64?: string,
    mimeType?: string,
    useSearchGrounding?: boolean
  ) => Promise<void>;
  onClearChat: () => void;
  isSending: boolean;
}

const MODEL_OPTIONS: { id: ChatModelId; label: string; description: string }[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'AgriSmart Standard (Flash 3.8)',
    description: 'Search-grounded agronomic advice, rain & planting calendars, and soil pH guidance.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Deep Pathology & Soil Science (Pro 3.1)',
    description: 'Complex crop disease diagnosis, soil nutrient chemistry, and image consultations.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Fast Field Check (Flash Lite 3.1)',
    description: 'Rapid answers for quick seed spacing, fertilizer rates, and livestock/crop checks.',
  },
];

export const BotanistChat: React.FC<BotanistChatProps> = ({
  activeSpecimen,
  gpsReport,
  messages,
  onSendMessage,
  onClearChat,
  isSending,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModelId>('gemini-3.8-flash');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage({
          base64: reader.result,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    const textToSend =
      trimmed ||
      `Please inspect this uploaded photograph and provide a complete agronomic diagnosis, soil pH recommendation, and treatment protocol.`;
    const imgData = attachedImage?.base64;
    const imgMime = attachedImage?.mimeType;

    setInput('');
    setAttachedImage(null);
    await onSendMessage(textToSend, selectedModel, imgData, imgMime, useSearchGrounding);
  };

  const suggestedQuestions = [
    `Based on my GPS altitude (${gpsReport?.altitudeMeters ?? 1450}m) and upcoming rain forecast, what crops should I plant this week?`,
    `How do I correct acidic soil pH for maximum yield, and how many kg/acre of agricultural lime should I apply?`,
    `Why are the lower leaves on my ${activeSpecimen.analysis.commonName} yellowing, and what NPK fertilizer ratio does it need?`,
    `What organic and agrovet-approved remedies control fall armyworm, blight, and spider mites?`,
  ];

  return (
    <section aria-labelledby="agrismart-ai-heading" className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
            AgriSmart AI · Multimodal Vision, Search Grounding & Live Voice
          </p>
          <h1
            id="agrismart-ai-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-[#1C1917] mt-1 leading-[1.08]"
          >
            AgriSmart AI Agronomist & Live Voice Desk
          </h1>
          <p className="text-lg sm:text-xl font-serif-prose text-[#57534E] mt-2 max-w-3xl leading-relaxed">
            Converse by live voice or text, upload photos of crops, leaves, soil, or livestock for instant consultation, and receive recommendations grounded in your GPS meteorological and soil data.
          </p>
        </div>

        {/* Interactive Model Mode Selector */}
        <div className="flex flex-col sm:items-end gap-2">
          <span className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
            AI Consultation Engine
          </span>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] border border-[#D6CEBE] rounded-md">
            {MODEL_OPTIONS.map((option) => {
              const active = selectedModel === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedModel(option.id)}
                  className={`px-3 py-2 text-xs sm:text-sm font-sans-ui font-medium rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#14532D] text-[#FBF9F5]'
                      : 'text-[#292524] hover:text-[#1C1917] hover:bg-[#E2DBD0]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Voice Conversation Panel (gemini-3.8-live) */}
      <LiveVoiceAssistant
        activeCropName={`${activeSpecimen.analysis.commonName} (${activeSpecimen.analysis.scientificName})`}
        gpsLocationLabel={
          gpsReport
            ? `${gpsReport.locationName} (Altitude ${gpsReport.altitudeMeters}m, Temp ${gpsReport.currentWeather.temperatureC}°C)`
            : 'Main Agricultural Sector'
        }
      />

      {/* Multi-Turn Image & Text Consultation Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Columns: Active Farm Context & Curated Inquiries */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5 space-y-4">
            <div className="aspect-4/3 w-full overflow-hidden rounded-xs border border-[#D6CEBE]">
              <BotanicalImage
                src={activeSpecimen.imageUrl}
                alt={activeSpecimen.analysis.commonName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-mono-tabular text-[#57534E]">
                ACTIVE CROP SUBJECT · {activeSpecimen.accessionNumber}
              </span>
              <h2 className="text-2xl font-display font-semibold text-[#1C1917] mt-0.5">
                {activeSpecimen.analysis.commonName}
              </h2>
              <p className="text-base font-serif-prose italic text-[#57534E]">
                {activeSpecimen.analysis.scientificName}
              </p>
            </div>
            <dl className="pt-3 border-t border-[#D6CEBE] space-y-2 text-sm font-sans-ui">
              <div className="flex justify-between gap-2">
                <dt className="text-[#57534E]">GPS Sector:</dt>
                <dd className="font-medium text-[#1C1917] text-right">
                  {gpsReport ? `${gpsReport.locationName} (${gpsReport.altitudeMeters}m)` : 'Ready'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#57534E]">Target Soil pH:</dt>
                <dd className="font-mono-tabular text-[#1C1917] text-right">
                  {activeSpecimen.analysis.careInstructions.soilAndSubstrate.pHRange}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#57534E]">NPK Formula:</dt>
                <dd className="font-mono-tabular text-[#14532D] font-semibold text-right">
                  {activeSpecimen.analysis.careInstructions.fertilizer.npkRatio.split(' ')[0]}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E] font-semibold">
                Farmer Consultation Prompts
              </h3>
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={onClearChat}
                  className="inline-flex items-center gap-1.5 text-xs font-sans-ui text-[#78350F] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Thread</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSending}
                  onClick={() => onSendMessage(q, selectedModel, undefined, undefined, useSearchGrounding)}
                  className="w-full text-left p-3.5 text-base font-serif-prose text-[#1C1917] bg-[#F3EFE6] hover:bg-[#EBE6DF] border border-[#D6CEBE] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  “{q}”
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 8 Columns: Scrollable Correspondence Thread & Image/Text Composer */}
        <div className="lg:col-span-8 flex flex-col bg-[#F3EFE6] border border-[#D6CEBE] rounded-md overflow-hidden">
          <div className="h-[560px] overflow-y-auto p-6 sm:p-8 space-y-6">
            {messages.map((msg) => {
              const isCurator = msg.role === 'model';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurator ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-sans-ui text-[#57534E] mb-1.5 px-1">
                    <span className="font-semibold text-[#1C1917]">
                      {isCurator ? 'AgriSmart AI Agronomist' : 'Farmer Consultation'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{msg.modelUsed}</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`max-w-2xl rounded-md p-5 sm:p-6 ${
                      isCurator
                        ? 'bg-[#FBF9F5] border border-[#D6CEBE] text-[#1C1917]'
                        : 'bg-[#14532D] text-[#FBF9F5]'
                    }`}
                  >
                    {msg.imagePreview && (
                      <div className="mb-4 max-w-xs overflow-hidden rounded-xs border border-[#D6CEBE]">
                        <img
                          src={msg.imagePreview}
                          alt="Uploaded crop or soil specimen for consultation"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    <div className="text-lg font-serif-prose leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {msg.searchLinks && msg.searchLinks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#D6CEBE] space-y-1.5">
                        <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold">
                          Google Search Grounded References:
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {msg.searchLinks.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-sans-ui font-medium text-[#14532D] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{link.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex flex-col items-start">
                <div className="text-xs font-sans-ui text-[#57534E] mb-1.5 px-1">
                  AgriSmart AI · Synthesizing agronomic & meteorological telemetry...
                </div>
                <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-md p-5 flex items-center gap-3 text-base font-serif-prose italic text-[#57534E]">
                  <Loader2 className="w-5 h-5 text-[#14532D] animate-spin shrink-0" />
                  <span>Analyzing photo and regional field parameters...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Footer */}
          <form onSubmit={handleSubmit} className="border-t border-[#D6CEBE] bg-[#FBF9F5] p-4 sm:p-5 space-y-3">
            {attachedImage && (
              <div className="flex items-center justify-between bg-[#F3EFE6] border border-[#D6CEBE] px-3.5 py-2 rounded-md">
                <div className="flex items-center gap-3">
                  <img
                    src={attachedImage.base64}
                    alt="Attachment preview"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-xs border border-[#C8BFA8]"
                  />
                  <span className="text-sm font-sans-ui text-[#1C1917] font-medium">
                    Photograph Attached for AI Visual Consultation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="text-xs font-sans-ui font-medium text-[#78350F] hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload crop, leaf, pest, or soil photo for consultation"
                className="inline-flex items-center gap-2 px-3.5 py-3 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors cursor-pointer shrink-0"
              >
                <ImagePlus className="w-5 h-5 text-[#14532D]" />
                <span className="hidden sm:inline">Upload Photo</span>
              </button>

              <div className="flex-1">
                <label htmlFor="agrismart-chat-input" className="sr-only">
                  Ask AgriSmart AI
                </label>
                <textarea
                  id="agrismart-chat-input"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about planting times, expected rain, soil pH, crop diseases, or upload a photo for consultation..."
                  className="w-full px-4 py-3 text-lg font-serif-prose text-[#1C1917] bg-[#F3EFE6] border border-[#C8BFA8] rounded-md focus:outline-2 focus:outline-[#14532D] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || (!input.trim() && !attachedImage)}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Consult AI</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans-ui text-[#57534E]">
              <button
                type="button"
                onClick={() => setUseSearchGrounding((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border cursor-pointer transition-colors ${
                  useSearchGrounding
                    ? 'bg-[#F3EFE6] border-[#14532D] text-[#14532D] font-semibold'
                    : 'border-[#D6CEBE] text-[#57534E]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Search Grounding: {useSearchGrounding ? 'Enabled' : 'Off'}</span>
              </button>

              <span className="hidden sm:inline-flex items-center gap-1">
                <CornerDownLeft className="w-3.5 h-3.5" /> Press Enter to send · Upload photos anytime
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
