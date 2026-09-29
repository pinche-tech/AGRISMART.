import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Search,
  Building2,
  Stethoscope,
  Store,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MapsGroundedPlace } from '../types/botany';

interface AgroServicesDirectoryProps {
  gpsCoords: { latitude: number; longitude: number; label: string };
  onUpdateCoords: (lat: number, lon: number, label: string) => void;
}

type ServiceCategory = 'all' | 'agrovets' | 'veterinary' | 'institutions';

export const AgroServicesDirectory: React.FC<AgroServicesDirectoryProps> = ({
  gpsCoords,
  onUpdateCoords,
}) => {
  const [category, setCategory] = useState<ServiceCategory>('all');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [markdownReport, setMarkdownReport] = useState<string>('');
  const [mapsPlaces, setMapsPlaces] = useState<MapsGroundedPlace[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyServices = async (
    lat: number,
    lon: number,
    cat: ServiceCategory,
    queryText = ''
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nearby-agro-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          category: cat,
          customQuery: queryText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not locate nearby agricultural services.');
      }
      setMarkdownReport(data.markdownReport || '');
      setMapsPlaces(data.mapsPlaces || []);
      setModelUsed(data.modelUsed || 'gemini-3.5-flash');
    } catch (err: any) {
      setError(err?.message || 'Error fetching Google Maps grounded institutions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, category);
  }, []);

  const handleUseMyGps = () => {
    if (!navigator.geolocation) {
      fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, category, customQuery);
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        onUpdateCoords(lat, lon, 'Live GPS Sector');
        fetchNearbyServices(lat, lon, category, customQuery);
      },
      () => {
        fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, category, customQuery);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <section className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
            Google Maps Grounding · Regional Agricultural Directory
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-[#1C1917] leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            Nearby Veterinaries, Agrovets & Agricultural Institutions
          </h1>
          <p className="text-lg sm:text-xl font-serif-prose text-[#57534E] leading-relaxed">
            Locate verified veterinary officers, certified seed and fertilizer agrovets, soil testing laboratories, and agricultural extension institutes around your GPS coordinates ({gpsCoords.latitude.toFixed(4)}°, {gpsCoords.longitude.toFixed(4)}°).
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleUseMyGps}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap self-start lg:self-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Scanning Nearby GPS Radius...</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              <span>Scan My GPS Radius</span>
            </>
          )}
        </button>
      </div>

      {/* Category Filter Tabs & Custom Search Bar */}
      <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-[#EBE6DF] border border-[#D6CEBE] rounded-md">
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, 'all', customQuery);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              category === 'all'
                ? 'bg-[#14532D] text-[#FBF9F5]'
                : 'text-[#292524] hover:text-[#1C1917]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>All Agro Services</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('agrovets');
              fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, 'agrovets', customQuery);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              category === 'agrovets'
                ? 'bg-[#14532D] text-[#FBF9F5]'
                : 'text-[#292524] hover:text-[#1C1917]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Agrovets & Seed Stores</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('veterinary');
              fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, 'veterinary', customQuery);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              category === 'veterinary'
                ? 'bg-[#14532D] text-[#FBF9F5]'
                : 'text-[#292524] hover:text-[#1C1917]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Veterinary Clinics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('institutions');
              fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, 'institutions', customQuery);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-sans-ui font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
              category === 'institutions'
                ? 'bg-[#14532D] text-[#FBF9F5]'
                : 'text-[#292524] hover:text-[#1C1917]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Agricultural Institutions & Labs</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchNearbyServices(gpsCoords.latitude, gpsCoords.longitude, category, customQuery);
          }}
          className="flex items-center gap-2 flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g. Soil testing lab, poultry vet, NPK dealer..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-sans-ui bg-[#FBF9F5] border border-[#C8BFA8] rounded-md text-[#1C1917]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#292524] rounded-md cursor-pointer whitespace-nowrap"
          >
            Search Maps
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xs flex items-start gap-2.5 text-sm font-sans-ui text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#14532D] animate-spin mx-auto" />
          <p className="text-xl font-display font-semibold text-[#1C1917]">
            Querying Google Maps Grounding around ({gpsCoords.latitude.toFixed(3)}°, {gpsCoords.longitude.toFixed(3)}°)...
          </p>
          <p className="text-base font-serif-prose text-[#57534E]">
            Locating verified veterinary clinics, agrovets, and agricultural extension centers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Detailed Directory Report */}
          <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-10 space-y-6">
            <div className="border-b border-[#D6CEBE] pb-4 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                  Field Directory & Service Guide
                </span>
                <h2 className="text-3xl font-display font-semibold text-[#1C1917] mt-1">
                  Regional Agricultural & Veterinary Facilities
                </h2>
              </div>
              {modelUsed && (
                <span className="text-xs font-mono-tabular text-[#57534E]">
                  Maps Grounded · {modelUsed}
                </span>
              )}
            </div>

            <div className="text-lg sm:text-xl font-serif-prose leading-[1.8] text-[#1C1917] whitespace-pre-wrap max-w-prose">
              {markdownReport || 'Select a category above to search nearby agrovets, veterinaries, and institutions.'}
            </div>
          </div>

          {/* Right 5 Columns: Direct Google Maps Grounded Place Links & Review Snippets */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 space-y-5">
              <div className="border-b border-[#D6CEBE] pb-3">
                <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                  Verified Google Maps Pins
                </span>
                <h3 className="text-2xl font-display font-semibold text-[#1C1917] mt-0.5">
                  Direct Map Locations & Reviews ({mapsPlaces.length})
                </h3>
              </div>

              {mapsPlaces.length > 0 ? (
                <div className="space-y-4">
                  {mapsPlaces.map((place, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xl font-display font-semibold text-[#1C1917]">
                          {place.title}
                        </h4>
                        <a
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-xs whitespace-nowrap shrink-0"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                        <div className="pt-2 border-t border-[#EBE6DF] space-y-1.5">
                          <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                            Farmer & Visitor Reviews:
                          </span>
                          {place.reviewSnippets.map((snippet, sIdx) => (
                            <p
                              key={sIdx}
                              className="text-sm font-serif-prose italic text-[#292524]"
                            >
                              “{snippet}”
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs space-y-3">
                  <p className="text-base font-serif-prose text-[#292524]">
                    Open the surrounding GPS sector directly on Google Maps to view turn-by-turn directions to nearby agrovets and veterinary clinics:
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/agrovet+veterinary+agricultural+institution/@${gpsCoords.latitude},${gpsCoords.longitude},13z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-xs"
                  >
                    <span>Explore Sector on Google Maps</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
