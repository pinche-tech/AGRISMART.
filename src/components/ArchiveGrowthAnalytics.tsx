import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Droplets, Plus, MessageSquare } from 'lucide-react';
import { PlantSpecimen, SpecimenHistoryPoint, getSpecimenHistory } from '../types/botany';

interface ArchiveGrowthAnalyticsProps {
  specimens: PlantSpecimen[];
  selectedSpecimenId: string;
  onSelectSpecimen: (specimen: PlantSpecimen) => void;
  onAppendHistoryPoint: (specimenId: string, point: SpecimenHistoryPoint) => void;
  onConsultAI: (specimen: PlantSpecimen, prompt: string) => void;
}

type ChartMode = 'combined' | 'growth' | 'water';

export const ArchiveGrowthAnalytics: React.FC<ArchiveGrowthAnalyticsProps> = ({
  specimens,
  selectedSpecimenId,
  onSelectSpecimen,
  onAppendHistoryPoint,
  onConsultAI,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('combined');
  const [newPeriod, setNewPeriod] = useState<string>('Oct 2026');
  const [newPhase, setNewPhase] = useState<string>('Autumn Canopy Flush');
  const [newHeightCm, setNewHeightCm] = useState<string>('');
  const [newWaterings, setNewWaterings] = useState<string>('4');
  const [newWaterMl, setNewWaterMl] = useState<string>('2400');

  const activeSpecimen =
    specimens.find((s) => s.id === selectedSpecimenId) || specimens[0];

  if (!activeSpecimen) return null;

  const historyData = getSpecimenHistory(activeSpecimen);
  const firstPoint = historyData[0];
  const latestPoint = historyData[historyData.length - 1];
  const heightGainCm = latestPoint && firstPoint ? latestPoint.heightCm - firstPoint.heightCm : 0;
  const totalWaterMl = historyData.reduce((acc, p) => acc + p.waterVolumeMl, 0);
  const avgMonthlyWaterings =
    historyData.length > 0
      ? (
          historyData.reduce((acc, p) => acc + p.wateringsPerMonth, 0) /
          historyData.length
        ).toFixed(1)
      : '0';

  const handleLogObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHeight = parseFloat(newHeightCm) || (latestPoint ? latestPoint.heightCm + 4 : 50);
    const parsedWaterings = Math.max(1, Math.min(31, parseInt(newWaterings, 10) || 4));
    const parsedWaterMl = Math.max(100, parseInt(newWaterMl, 10) || 2000);

    const point: SpecimenHistoryPoint = {
      period: newPeriod.trim() || 'Oct 2026',
      phase: newPhase.trim() || 'Active Growth Phase',
      heightCm: Math.round(parsedHeight),
      leafCount: (latestPoint?.leafCount || 12) + 2,
      wateringsPerMonth: parsedWaterings,
      waterVolumeMl: parsedWaterMl,
    };

    onAppendHistoryPoint(activeSpecimen.id, point);
    setNewHeightCm('');
  };

  return (
    <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-8 space-y-8">
      {/* Top Bar: Title, Specimen Selector & Chart Mode Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#D6CEBE] pb-6">
        <div className="space-y-1.5">
          <span className="text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
             Longitudinal Phenology & Hydrology Telemetry
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-[#1C1917]">
            Historical Growth Phases & Water Usage Frequency
          </h2>
          <p className="text-base sm:text-lg font-serif-prose text-[#57534E] max-w-2xl">
            Track vegetative height progression (cm), phenological growth stages, monthly irrigation frequency, and cumulative water volume (mL) for each cataloged specimen.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] border border-[#D6CEBE] rounded-md">
            <button
              type="button"
              onClick={() => setChartMode('combined')}
              className={`px-3.5 py-2 text-xs font-sans-ui font-semibold rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'combined'
                  ? 'bg-[#14532D] text-[#FBF9F5]'
                  : 'text-[#292524] hover:text-[#1C1917]'
              }`}
            >
              Growth & Water (Dual Axis)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('growth')}
              className={`px-3.5 py-2 text-xs font-sans-ui font-semibold rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'growth'
                  ? 'bg-[#14532D] text-[#FBF9F5]'
                  : 'text-[#292524] hover:text-[#1C1917]'
              }`}
            >
              Growth Phases (cm & Leaves)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('water')}
              className={`px-3.5 py-2 text-xs font-sans-ui font-semibold rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'water'
                  ? 'bg-[#14532D] text-[#FBF9F5]'
                  : 'text-[#292524] hover:text-[#1C1917]'
              }`}
            >
              Water Usage & Frequency
            </button>
          </div>
        </div>
      </div>

      {/* Specimen Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mr-1">
            Inspect Specimen Curve:
          </span>
          {specimens.map((spec) => {
            const isSelected = spec.id === activeSpecimen.id;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => onSelectSpecimen(spec)}
                className={`px-3.5 py-2 text-sm font-sans-ui font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#14532D] text-[#FBF9F5] border-[#14532D]'
                    : 'bg-[#FBF9F5] text-[#1C1917] border-[#C8BFA8] hover:bg-[#EBE6DF]'
                }`}
              >
                {spec.analysis.commonName}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            onConsultAI(
              activeSpecimen,
              `Please analyze the 6-month growth phase and water usage trajectory for my ${activeSpecimen.analysis.commonName} (${activeSpecimen.analysis.scientificName}): Height progressed from ${firstPoint?.heightCm}cm to ${latestPoint?.heightCm}cm (current phase: ${latestPoint?.phase}) with an average of ${avgMonthlyWaterings} waterings/month (${latestPoint?.waterVolumeMl} mL/month). Are these growth and irrigation rates optimal?`
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-sans-ui font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#292524] rounded-md transition-colors cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Analyze Curve with AgriSmart AI</span>
        </button>
      </div>

      {/* 4 Key Summary KPIs (Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-4">
          <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
            Current Phenological Phase
          </span>
          <p className="text-xl font-display font-bold text-[#14532D] mt-1">
            {latestPoint?.phase || 'Vegetative Maturation'}
          </p>
          <p className="text-xs font-mono-tabular text-[#57534E] mt-1">
            As of {latestPoint?.period}
          </p>
        </div>

        <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-4">
          <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
            <span>Canopy Height & Net Gain</span>
            <TrendingUp className="w-4 h-4 text-[#14532D]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#1C1917] font-mono-tabular mt-1">
            {latestPoint?.heightCm} cm{' '}
            <span className="text-sm font-normal text-[#14532D]">
              (+{heightGainCm} cm)
            </span>
          </p>
          <p className="text-xs font-mono-tabular text-[#57534E] mt-1">
            Active Foliage: {latestPoint?.leafCount} leaves/nodes
          </p>
        </div>

        <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-4">
          <div className="flex items-center justify-between text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
            <span>Water Usage Frequency</span>
            <Droplets className="w-4 h-4 text-[#78350F]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#1C1917] font-mono-tabular mt-1">
            {latestPoint?.wateringsPerMonth}× / month
          </p>
          <p className="text-xs font-mono-tabular text-[#57534E] mt-1">
            6-Month Avg: {avgMonthlyWaterings} irrigations/mo
          </p>
        </div>

        <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-4">
          <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E]">
            Cumulative Irrigation Volume
          </span>
          <p className="text-2xl font-display font-bold text-[#1C1917] font-mono-tabular mt-1">
            {(totalWaterMl / 1000).toFixed(2)} L
          </p>
          <p className="text-xs font-mono-tabular text-[#57534E] mt-1">
            Latest Month: {latestPoint?.waterVolumeMl} mL
          </p>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-md p-4 sm:p-6">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historyData}
              margin={{ top: 16, right: 28, left: 8, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D6CEBE" />
              <XAxis
                dataKey="period"
                stroke="#57534E"
                tick={{ fill: '#1C1917', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#14532D"
                tick={{ fill: '#14532D', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                label={{
                  value: chartMode === 'water' ? 'Waterings / Mo' : 'Height (cm)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#14532D',
                  fontSize: 12,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#78350F"
                tick={{ fill: '#78350F', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                label={{
                  value: chartMode === 'growth' ? 'Leaf Count' : 'Water Volume (mL)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#78350F',
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FBF9F5',
                  borderColor: '#1C1917',
                  borderRadius: '4px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                  color: '#1C1917',
                }}
                formatter={(value: any, name: any, props: any) => {
                  const phaseNote = props?.payload?.phase ? ` (${props.payload.phase})` : '';
                  return [`${value}${phaseNote}`, name];
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '12px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                }}
              />

              {(chartMode === 'combined' || chartMode === 'growth') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="heightCm"
                  name="Plant Height (cm)"
                  stroke="#14532D"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#14532D', strokeWidth: 2, stroke: '#FBF9F5' }}
                  activeDot={{ r: 7 }}
                />
              )}

              {chartMode === 'growth' && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leafCount"
                  name="Active Foliage Nodes / Leaves"
                  stroke="#78350F"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#78350F' }}
                />
              )}

              {chartMode === 'water' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wateringsPerMonth"
                  name="Watering Frequency (Times / Month)"
                  stroke="#14532D"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#14532D', strokeWidth: 2, stroke: '#FBF9F5' }}
                />
              )}

              {(chartMode === 'combined' || chartMode === 'water') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="waterVolumeMl"
                  name="Monthly Water Volume (mL)"
                  stroke="#78350F"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#78350F', strokeWidth: 2, stroke: '#FBF9F5' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Phenological Phase Timeline Strip under Chart */}
        <div className="mt-6 pt-4 border-t border-[#D6CEBE] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {historyData.slice(-6).map((pt, idx) => (
            <div key={idx} className="p-2.5 bg-[#F3EFE6] rounded-xs border border-[#D6CEBE]">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[#57534E]">
                <span>{pt.period}</span>
                <span className="font-semibold text-[#14532D]">{pt.heightCm}cm</span>
              </div>
              <p className="text-xs font-sans-ui font-semibold text-[#1C1917] mt-1 truncate" title={pt.phase}>
                {pt.phase}
              </p>
              <p className="text-[11px] font-mono-tabular text-[#57534E] mt-0.5">
                {pt.wateringsPerMonth}× ({pt.waterVolumeMl} mL)
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Form to Record a New Growth Phase & Water Usage Entry */}
      <form
        onSubmit={handleLogObservation}
        className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-md p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
      >
        <div>
          <label htmlFor="log-period" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1">
            Month / Period
          </label>
          <input
            id="log-period"
            type="text"
            value={newPeriod}
            onChange={(e) => setNewPeriod(e.target.value)}
            placeholder="e.g. Oct 2026"
            className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F3EFE6] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="log-phase" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1">
            Growth Phase Label
          </label>
          <input
            id="log-phase"
            type="text"
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            placeholder="e.g. Autumn Canopy Flush"
            className="w-full px-3 py-2 text-sm font-sans-ui bg-[#F3EFE6] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
          />
        </div>

        <div>
          <label htmlFor="log-height" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1">
            Height (cm)
          </label>
          <input
            id="log-height"
            type="number"
            value={newHeightCm}
            onChange={(e) => setNewHeightCm(e.target.value)}
            placeholder={String((latestPoint?.heightCm || 60) + 4)}
            className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F3EFE6] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
          />
        </div>

        <div>
          <label htmlFor="log-water-ml" className="block text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold mb-1">
            Monthly Water (mL)
          </label>
          <input
            id="log-water-ml"
            type="number"
            step="100"
            value={newWaterMl}
            onChange={(e) => setNewWaterMl(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F3EFE6] border border-[#C8BFA8] rounded-xs text-[#1C1917]"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Point</span>
          </button>
        </div>
      </form>
    </div>
  );
};
