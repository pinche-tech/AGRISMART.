import React, { useState, useEffect } from 'react';
import {
  Navigation,
  CloudRain,
  CloudLightning,
  AlertTriangle,
  BellRing,
  ShieldAlert,
  Mountain,
  Thermometer,
  Droplets,
  Wind,
  Sprout,
  ExternalLink,
  BookmarkPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { GpsAgroReport, HeavyRainAlertStatus } from '../types/botany';
import { SavedFieldReportDoc } from '../lib/firebase';

export function evaluate24hHeavyRainAlert(
  report: GpsAgroReport | null,
  heavyRainThresholdMm = 10.0,
  highProbThresholdPct = 75
): HeavyRainAlertStatus | null {
  if (!report || !report.dailyForecast || report.dailyForecast.length === 0) {
    return null;
  }

  // Next 24 hours is derived from hourly 24h aggregation if present, or Day 0 (today/next 24h) forecast
  const day0 = report.dailyForecast[0];
  const expectedRainMm = Number(
    (report.next24hRainMm !== undefined ? report.next24hRainMm : day0.rainSumMm).toFixed(1)
  );
  const rainProbabilityPct = Math.round(
    report.next24hRainProbPct !== undefined ? report.next24hRainProbPct : day0.rainProbPct
  );

  const isHeavyByVolume = expectedRainMm >= heavyRainThresholdMm;
  const isHeavyByProbAndVolume =
    rainProbabilityPct >= highProbThresholdPct && expectedRainMm >= Math.max(4.0, heavyRainThresholdMm * 0.5);

  const isActive = isHeavyByVolume || isHeavyByProbAndVolume;

  const severity: HeavyRainAlertStatus['severity'] =
    expectedRainMm >= 25 || (expectedRainMm >= 15 && rainProbabilityPct >= 85)
      ? 'extreme'
      : isActive
      ? 'heavy'
      : expectedRainMm >= 3 || rainProbabilityPct >= 50
      ? 'moderate'
      : 'normal';

  return {
    isActive,
    locationName: report.locationName,
    forecastDate: day0.date || 'Next 24 Hours',
    expectedRainMm,
    rainProbabilityPct,
    severity,
    onsetWindow: `Within Next 24 Hours (${day0.date})`,
    headline:
      severity === 'extreme'
        ? `EXTREME 24H RAINFALL ALERT: ${expectedRainMm} mm (${rainProbabilityPct}% probability) expected in ${report.locationName}`
        : `HEAVY 24H RAINFALL ALERT: ${expectedRainMm} mm (${rainProbabilityPct}% probability) predicted within 24 hours`,
    agronomicImpact:
      'High risk of topsoil nutrient leaching, waterlogging in low-lying plots, and wash-off of foliar crop protection sprays.',
    recommendedActions: [
      'Postpone foliar fungicide/pesticide spraying and soluble nitrogen top-dressing until after the 24h rain front passes.',
      'Open furrow drainage trenches and inspect contour bunds to prevent root-zone waterlogging and topsoil erosion.',
      'Harvest mature vegetables or grains immediately and stake tall crops against gusting rain squalls.',
    ],
  };
}

interface GpsMeteorologyHubProps {
  gpsCoords: { latitude: number; longitude: number; label: string };
  onUpdateCoords: (lat: number, lon: number, label: string) => void;
  agroReport: GpsAgroReport | null;
  isLoadingReport: boolean;
  reportError: string | null;
  onFetchReport: (lat: number, lon: number, label?: string) => Promise<void>;
  onSaveReportToCloud: () => Promise<void>;
  savedReports: SavedFieldReportDoc[];
  onDeleteSavedReport: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  heavyRainAlert: HeavyRainAlertStatus | null;
  onTriggerHeavyRainAlert: (alert: HeavyRainAlertStatus | null) => void;
}

const AGRICULTURAL_PRESETS = [
  { label: 'Rift Valley Highlands (Nakuru, Kenya)', lat: -0.3031, lon: 36.08 },
  { label: 'Central Valley Farmland (Fresno, USA)', lat: 36.7378, lon: -119.7871 },
  { label: 'East Anglian Arable Belt (Cambridge, UK)', lat: 52.2053, lon: 0.1218 },
  { label: 'Cerrado Agricultural Plateau (Goiás, Brazil)', lat: -16.6869, lon: -49.2648 },
];

export const GpsMeteorologyHub: React.FC<GpsMeteorologyHubProps> = ({
  gpsCoords,
  onUpdateCoords,
  agroReport,
  isLoadingReport,
  reportError,
  onFetchReport,
  onSaveReportToCloud,
  savedReports,
  onDeleteSavedReport,
  isAuthenticated,
  heavyRainAlert,
  onTriggerHeavyRainAlert,
}) => {
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState<string>(String(gpsCoords.latitude));
  const [manualLon, setManualLon] = useState<string>(String(gpsCoords.longitude));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rainThresholdMm, setRainThresholdMm] = useState<number>(10.0);

  // Monitor retrieved 24-hour rain forecast and synchronize with top header alert banner
  useEffect(() => {
    if (!agroReport) return;
    const evaluated = evaluate24hHeavyRainAlert(agroReport, rainThresholdMm, 75);
    if (evaluated && evaluated.isActive) {
      onTriggerHeavyRainAlert(evaluated);
    } else if (!heavyRainAlert?.isSimulated) {
      onTriggerHeavyRainAlert(evaluated);
    }
  }, [agroReport, rainThresholdMm]);

  const handleSimulateHeavyRain24h = () => {
    const locationName = agroReport?.locationName || gpsCoords.label || 'Active GPS Farm Sector';
    const todayDate = agroReport?.dailyForecast?.[0]?.date || new Date().toISOString().split('T')[0];
    onTriggerHeavyRainAlert({
      isActive: true,
      locationName,
      forecastDate: todayDate,
      expectedRainMm: 34.8,
      rainProbabilityPct: 92,
      severity: 'extreme',
      onsetWindow: `Within Next 24 Hours (${todayDate})`,
      headline: `HEAVY RAINFALL WARNING (NEXT 24H): 34.8 mm (92% probability) predicted across ${locationName}`,
      agronomicImpact:
        'Severe risk of surface runoff, root-zone waterlogging, and wash-off of newly applied foliar nutrients or fungicides.',
      recommendedActions: [
        'Suspend all foliar chemical or organic spraying and nitrogen top-dressing for the next 24 hours.',
        'Clear perimeter drainage ditches and reinforce soil ridges on sloped plots before storm onset.',
        'Secure greenhouse vents and harvest ripe field produce immediately.',
      ],
      isSimulated: true,
    });
  };

  const handleRestoreLiveRainMonitor = () => {
    const evaluated = evaluate24hHeavyRainAlert(agroReport, rainThresholdMm, 75);
    onTriggerHeavyRainAlert(evaluated);
  };

  const handleAcquireLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Browser Geolocation API is unavailable. Select a region preset or enter coordinates below.');
      return;
    }

    setGpsStatus('Acquiring satellite GPS lock for your farm location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lon = Number(position.coords.longitude.toFixed(4));
        const alt = position.coords.altitude ? `${Math.round(position.coords.altitude)}m` : 'telemetry verified';
        setManualLat(String(lat));
        setManualLon(String(lon));
        setGpsStatus(`Live GPS Lock Acquired (${lat}°, ${lon}° · Altitude ${alt}). Generating meteorological & soil report...`);
        onUpdateCoords(lat, lon, 'Live GPS Farm Sector');
        onFetchReport(lat, lon, '');
      },
      (err) => {
        setGpsStatus(
          `GPS permission notice (${err.message}). Running meteorological & geological analysis for selected coordinates (${gpsCoords.latitude.toFixed(4)}°, ${gpsCoords.longitude.toFixed(4)}°)...`
        );
        onFetchReport(gpsCoords.latitude, gpsCoords.longitude, gpsCoords.label);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveCloud = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveReportToCloud();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Identify highest rain probability day for the summary highlight
  const peakRainDay = agroReport?.dailyForecast?.reduce(
    (best, curr) => (curr.rainProbPct > (best?.rainProbPct ?? -1) ? curr : best),
    agroReport.dailyForecast[0]
  );

  return (
    <section className="space-y-12">
      {/* Header & GPS Lock Controls */}
      <div className="border-b border-[#1C1917] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
            Satellite Geolocation · Meteorological & Pedological Intelligence
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-[#1C1917] leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            GPS Meteorological, Soil pH & Planting Advisory
          </h1>
          <p className="text-lg sm:text-xl font-serif-prose text-[#57534E] leading-relaxed">
            Acquire your exact farm coordinates to inspect elevation (altitude), topsoil moisture, 7-day rain windows, regional soil pH, and optimal crop planting calendars grounded with live Google Search data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isLoadingReport}
            onClick={handleAcquireLiveGps}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            {isLoadingReport ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing GPS Sector...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>Access My Live GPS & Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coordinate Inspector & Regional Presets Bar */}
      <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-3">
            <label htmlFor="gps-lat-input" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1.5">
              GPS Latitude (°N/S)
            </label>
            <input
              id="gps-lat-input"
              type="number"
              step="0.0001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base font-mono-tabular bg-[#FBF9F5] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor="gps-lon-input" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1.5">
              GPS Longitude (°E/W)
            </label>
            <input
              id="gps-lon-input"
              type="number"
              step="0.0001"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base font-mono-tabular bg-[#FBF9F5] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
            />
          </div>
          <div className="lg:col-span-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isLoadingReport}
              onClick={() => {
                const lat = parseFloat(manualLat);
                const lon = parseFloat(manualLon);
                if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                  onUpdateCoords(lat, lon, '');
                  onFetchReport(lat, lon, '');
                }
              }}
              className="px-5 py-2.5 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              Generate Report for Coordinates
            </button>
            {agroReport && isAuthenticated && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCloud}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#14532D] bg-[#FBF9F5] hover:bg-[#EBE6DF] border border-[#14532D] rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to Cloud Firestore</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Report to Cloud'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Agricultural Sector Presets */}
        <div className="pt-4 border-t border-[#D6CEBE] flex flex-wrap items-center gap-2">
          <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E] mr-2">
            Agricultural Benchmarks:
          </span>
          {AGRICULTURAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={isLoadingReport}
              onClick={() => {
                setManualLat(String(preset.lat));
                setManualLon(String(preset.lon));
                onUpdateCoords(preset.lat, preset.lon, preset.label);
                onFetchReport(preset.lat, preset.lon, preset.label);
              }}
              className="px-3 py-1.5 text-xs font-sans-ui font-medium text-[#292524] bg-[#FBF9F5] hover:bg-[#EBE6DF] border border-[#D6CEBE] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {gpsStatus && (
          <p className="text-sm font-sans-ui text-[#14532D] font-medium pt-1">
            {gpsStatus}
          </p>
        )}
        {reportError && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xs flex items-start gap-2.5 text-sm font-sans-ui text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{reportError}</span>
          </div>
        )}
      </div>

      {/* Live Telemetry & 7-Day Rain Forecast Display */}
      {agroReport && (
        <div className="space-y-12">
          {/* 24-Hour Heavy Rainfall Forecast Monitor & Header Alert Trigger Panel */}
          <div
            className={`rounded-md border-2 p-6 space-y-4 transition-colors ${
              heavyRainAlert?.isActive
                ? 'bg-[#FEF2F2] border-[#991B1B] text-[#7F1D1D]'
                : 'bg-[#F3EFE6] border-[#14532D] text-[#1C1917]'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-current/15 pb-4">
              <div className="flex items-start gap-3.5">
                {heavyRainAlert?.isActive ? (
                  <CloudLightning className="w-7 h-7 text-[#991B1B] shrink-0 mt-0.5" />
                ) : (
                  <BellRing className="w-7 h-7 text-[#14532D] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-sans-ui uppercase tracking-widest font-bold">
                    <span>24-Hour Precipitation Sentinel</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {heavyRainAlert?.isActive
                        ? 'HIGH-VISIBILITY HEADER ALERT ACTIVE'
                        : 'MONITORING NEXT 24 HOURS — BELOW HEAVY THRESHOLD'}
                    </span>
                    {heavyRainAlert?.isSimulated && (
                      <span className="px-2 py-0.5 bg-[#991B1B] text-[#FBF9F5] rounded-xs text-[11px]">
                        Simulated Storm Drill
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1C1917]">
                    {heavyRainAlert?.isActive
                      ? heavyRainAlert.headline
                      : `Next 24 Hours Forecast: ${(
                          agroReport.next24hRainMm ??
                          agroReport.dailyForecast[0]?.rainSumMm ??
                          0
                        ).toFixed(1)} mm Expected (${
                          agroReport.next24hRainProbPct ??
                          agroReport.dailyForecast[0]?.rainProbPct ??
                          0
                        }% Probability)`}
                  </h2>
                  <p className="text-sm sm:text-base font-serif-prose text-[#292524]">
                    {heavyRainAlert?.isActive
                      ? heavyRainAlert.agronomicImpact
                      : `GpsMeteorologyHub continuously monitors your 24-hour precipitation window (${
                          agroReport.dailyForecast[0]?.date || 'Today'
                        }). If predicted rainfall meets or exceeds ${rainThresholdMm.toFixed(
                          1
                        )} mm (or ≥75% probability with significant accumulation), a high-visibility storm alert banner is automatically triggered in the top application header.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-[#FBF9F5] border border-[#C8BFA8] rounded-xs px-3 py-2">
                  <label
                    htmlFor="rain-threshold-select"
                    className="text-xs font-sans-ui font-semibold uppercase tracking-wider text-[#57534E] whitespace-nowrap"
                  >
                    24h Alert Threshold:
                  </label>
                  <select
                    id="rain-threshold-select"
                    value={rainThresholdMm}
                    onChange={(e) => setRainThresholdMm(Number(e.target.value))}
                    className="text-xs font-mono-tabular font-bold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value={2.0}>2.0 mm (Light Rain Sensitivity)</option>
                    <option value={5.0}>5.0 mm (Moderate Rain Sensitivity)</option>
                    <option value={10.0}>10.0 mm (Standard Heavy Rain)</option>
                    <option value={20.0}>20.0 mm (Severe Storm Only)</option>
                  </select>
                </div>

                {heavyRainAlert?.isActive ? (
                  <button
                    type="button"
                    onClick={handleRestoreLiveRainMonitor}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-sans-ui font-semibold text-[#1C1917] bg-[#FBF9F5] hover:bg-[#EBE6DF] border border-[#C8BFA8] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4 text-[#14532D]" />
                    <span>Reset to Live Telemetry</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateHeavyRain24h}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-sans-ui font-semibold text-[#FBF9F5] bg-[#991B1B] hover:bg-[#7F1D1D] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Test 24h Heavy Rain Header Alert</span>
                  </button>
                )}
              </div>
            </div>

            {heavyRainAlert?.isActive && heavyRainAlert.recommendedActions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {heavyRainAlert.recommendedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FBF9F5] border border-[#FECACA] rounded-xs p-3.5 flex items-start gap-2.5 text-xs sm:text-sm font-sans-ui text-[#1C1917]"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6-Metric Quantitative Instrument Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                <span>Elevation / Altitude</span>
                <Mountain className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-3xl font-display font-bold text-[#1C1917] font-mono-tabular mt-2">
                {agroReport.altitudeMeters} m
              </p>
              <p className="text-xs font-sans-ui text-[#57534E] mt-1 font-mono-tabular">
                {Math.round(agroReport.altitudeMeters * 3.28084)} ft ASL
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                <span>Air Temperature</span>
                <Thermometer className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-3xl font-display font-bold text-[#1C1917] font-mono-tabular mt-2">
                {agroReport.currentWeather.temperatureC}°C
              </p>
              <p className="text-xs font-sans-ui text-[#57534E] mt-1 font-mono-tabular">
                Topsoil: {Number(agroReport.currentWeather.soilTempC).toFixed(1)}°C
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                <span>Relative Humidity</span>
                <Droplets className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-3xl font-display font-bold text-[#1C1917] font-mono-tabular mt-2">
                {agroReport.currentWeather.humidityPct}%
              </p>
              <p className="text-xs font-sans-ui text-[#57534E] mt-1 font-mono-tabular">
                Pressure: {agroReport.currentWeather.pressureHpa} hPa
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                <span>Soil Moisture (0–1cm)</span>
                <Sprout className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-3xl font-display font-bold text-[#1C1917] font-mono-tabular mt-2">
                {agroReport.currentWeather.soilMoistureVol}
              </p>
              <p className="text-xs font-sans-ui text-[#57534E] mt-1">
                Volumetric m³/m³
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                <span>Wind Velocity</span>
                <Wind className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-3xl font-display font-bold text-[#1C1917] font-mono-tabular mt-2">
                {agroReport.currentWeather.windSpeedKmh} km/h
              </p>
              <p className="text-xs font-sans-ui text-[#57534E] mt-1">
                10m Anemometer
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#14532D] rounded-md p-5">
              <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#14532D] font-semibold">
                <span>Peak Rain Window</span>
                <CloudRain className="w-4 h-4 text-[#14532D]" />
              </div>
              <p className="text-2xl font-display font-bold text-[#14532D] font-mono-tabular mt-2">
                {peakRainDay ? `${peakRainDay.rainProbPct}% Prob` : 'Low Rain'}
              </p>
              <p className="text-xs font-sans-ui text-[#292524] mt-1 font-mono-tabular">
                {peakRainDay ? `${peakRainDay.date} (${peakRainDay.rainSumMm} mm)` : 'Dry spell'}
              </p>
            </div>
          </div>

          {/* 7-Day Meteorological & Evapotranspiration Table */}
          {agroReport.dailyForecast.length > 0 && (
            <div className="space-y-4">
              <div className="border-b border-[#1C1917] pb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917]">
                  7-Day Precipitation, Thermal & Evapotranspiration Schedule — {agroReport.locationName}
                </h2>
                <span className="text-xs font-mono-tabular text-[#57534E]">
                  GPS: {agroReport.latitude.toFixed(4)}°, {agroReport.longitude.toFixed(4)}° · Altitude {agroReport.altitudeMeters}m
                </span>
              </div>

              <div className="overflow-x-auto border border-[#D6CEBE] rounded-md bg-[#FBF9F5]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3EFE6] border-b border-[#D6CEBE] text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
                      <th className="py-3.5 px-5">Forecast Date</th>
                      <th className="py-3.5 px-4 text-right">Rain Probability</th>
                      <th className="py-3.5 px-4 text-right">Expected Rainfall (mm)</th>
                      <th className="py-3.5 px-4 text-right">Max / Min Temp</th>
                      <th className="py-3.5 px-4 text-right">FAO Evapotranspiration (ET₀)</th>
                      <th className="py-3.5 px-5">Field Planting / Spraying Outlook</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6CEBE] text-sm sm:text-base">
                    {agroReport.dailyForecast.map((day, idx) => {
                      const isHeavyRain = day.rainSumMm >= rainThresholdMm || (day.rainProbPct >= 75 && day.rainSumMm >= 4.0);
                      const isRainExpected = day.rainProbPct >= 50 || day.rainSumMm >= 2.0;
                      return (
                        <tr
                          key={day.date}
                          className={
                            idx === 0 && (isHeavyRain || heavyRainAlert?.isActive)
                              ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2]/80'
                              : 'hover:bg-[#F3EFE6]/60'
                          }
                        >
                          <td className="py-3.5 px-5 font-mono-tabular font-semibold text-[#1C1917]">
                            <span>{day.date}</span>
                            {idx === 0 && (
                              <span className="ml-2 text-xs font-sans-ui font-bold uppercase tracking-wider text-[#14532D]">
                                (Next 24h)
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-mono-tabular font-semibold ${
                              isHeavyRain ? 'text-[#991B1B]' : 'text-[#14532D]'
                            }`}
                          >
                            {day.rainProbPct}%
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-mono-tabular font-semibold ${
                              isHeavyRain ? 'text-[#991B1B]' : 'text-[#1C1917]'
                            }`}
                          >
                            {day.rainSumMm.toFixed(1)} mm
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular text-[#292524]">
                            {day.tempMaxC.toFixed(1)}°C / {day.tempMinC.toFixed(1)}°C
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular text-[#57534E]">
                            {day.et0Mm.toFixed(2)} mm/day
                          </td>
                          <td className="py-3.5 px-5 font-sans-ui text-xs sm:text-sm text-[#292524]">
                            {isHeavyRain
                              ? 'HEAVY RAIN WARNING — Suspend foliar spraying & soluble top-dressing; inspect plot drainage'
                              : isRainExpected
                              ? 'Rain window expected — Ideal for seed germination & basal top-dressing; avoid foliar spraying'
                              : 'Dry window — Suitable for weeding, foliar nutrient application, or controlled irrigation'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comprehensive Geological, Soil pH & Planting Monograph */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-10 space-y-6">
              <div className="border-b border-[#D6CEBE] pb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
                    Agronomic Monograph · Soil pH, Rain Onset & Planting Windows
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display font-semibold text-[#1C1917] mt-1">
                    Regional Geological & Crop Advisory Report
                  </h3>
                </div>
                {agroReport.modelUsed && (
                  <span className="text-xs font-mono-tabular text-[#57534E]">
                    Grounded via {agroReport.modelUsed}
                  </span>
                )}
              </div>

              <div className="text-lg sm:text-xl font-serif-prose leading-[1.8] text-[#1C1917] whitespace-pre-wrap max-w-prose">
                {agroReport.advisoryMarkdown}
              </div>
            </div>

            {/* Right 4 Columns: Google Search Grounding Sources & Saved Cloud Reports */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 space-y-4">
                <h3 className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold border-b border-[#D6CEBE] pb-3">
                  Verified Google Search Grounding Sources
                </h3>
                {agroReport.searchLinks && agroReport.searchLinks.length > 0 ? (
                  <ul className="space-y-3">
                    {agroReport.searchLinks.map((link, idx) => (
                      <li key={idx} className="text-sm font-sans-ui">
                        <a
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-2 text-[#14532D] hover:underline font-medium break-all"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{link.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-serif-prose italic text-[#57534E]">
                    Meteorological telemetry and regional soil profiles synthesized from live Open-Meteo and agro-ecological zone records.
                  </p>
                )}
              </div>

              {/* Saved Cloud Firestore Reports */}
              {savedReports.length > 0 && (
                <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 space-y-4">
                  <h3 className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E] font-semibold border-b border-[#D6CEBE] pb-3">
                    Saved Cloud Field Reports ({savedReports.length})
                  </h3>
                  <div className="space-y-3">
                    {savedReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3.5 bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateCoords(rep.latitude, rep.longitude, rep.locationName);
                              onFetchReport(rep.latitude, rep.longitude, rep.locationName);
                            }}
                            className="text-base font-display font-semibold text-[#1C1917] hover:text-[#14532D] text-left cursor-pointer"
                          >
                            {rep.locationName}
                          </button>
                          <p className="text-xs font-mono-tabular text-[#57534E] mt-0.5">
                            Alt: {rep.altitudeMeters}m · Lat {rep.latitude.toFixed(2)}°, Lon {rep.longitude.toFixed(2)}°
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedReport(rep.id)}
                          className="text-[#78350F] hover:text-[#991B1B] p-1 cursor-pointer"
                          title="Delete saved report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
