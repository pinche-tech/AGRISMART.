import React from 'react';
import { Droplets, MessageSquare, BookmarkCheck, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { PlantSpecimen } from '../types/botany';
import { BotanicalImage } from './BotanicalImage';

interface SpecimenMonographProps {
  specimen: PlantSpecimen;
  isSavedInCollection: boolean;
  onSaveToCollection: (specimen: PlantSpecimen) => void;
  onLogWatering: (specimenId: string) => void;
  onAskBotanist: (specimen: PlantSpecimen, initialQuestion?: string) => void;
}

export const SpecimenMonograph: React.FC<SpecimenMonographProps> = ({
  specimen,
  isSavedInCollection,
  onSaveToCollection,
  onLogWatering,
  onAskBotanist,
}) => {
  const { analysis } = specimen;

  return (
    <article className="border-t border-[#D6CEBE] pt-10 pb-16">
      {/* Editorial Kicker & Metadata Line (Zero-Pill Discipline) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#D6CEBE]">
        <div className="flex flex-wrap items-center gap-2.5 text-sm font-sans-ui text-[#57534E]">
          <span className="font-mono-tabular font-medium text-[#1C1917]">
            {specimen.accessionNumber}
          </span>
          <span aria-hidden="true">·</span>
          <span>Family {analysis.family}</span>
          <span aria-hidden="true">·</span>
          <span>Cataloged {specimen.dateCataloged}</span>
          <span aria-hidden="true">·</span>
          <span>{specimen.locationInHome}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onLogWatering(specimen.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <Droplets className="w-4 h-4 text-[#14532D]" />
            <span>Record Watering (Last: {specimen.lastWateredDate})</span>
          </button>

          {!isSavedInCollection ? (
            <button
              type="button"
              onClick={() => onSaveToCollection(specimen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>File in Herbarium</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-sans-ui font-medium text-[#14532D] whitespace-nowrap">
              <BookmarkCheck className="w-4 h-4" />
              <span>Filed in Herbarium Archive</span>
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              onAskBotanist(
                specimen,
                `Can you review the current leaf condition and seasonal care plan for my ${analysis.commonName} (${analysis.scientificName})?`
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#292524] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consult Master Botanist</span>
          </button>
        </div>
      </div>

      {/* Primary Two-Column Asymmetric Monograph Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mt-8 items-start">
        {/* Left 5 Columns: Archival Specimen Plate & Accession Definition List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-[#D6CEBE] bg-[#F3EFE6] p-3 rounded-md">
            <div className="aspect-4/3 w-full overflow-hidden rounded-xs">
              <BotanicalImage
                src={specimen.imageUrl}
                alt={`${analysis.commonName} (${analysis.scientificName})`}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-serif-prose italic text-[#57534E] mt-3 px-1">
              Fig. 1 — Photographic plate of <em className="text-[#1C1917]">{analysis.scientificName}</em> ({analysis.cultivarOrVariety}). {analysis.confidenceNote}
            </p>
          </div>

          {/* Museum Accession Definition List (<dl>) */}
          <div className="border-t border-[#D6CEBE]">
            <h3 className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E] py-3 border-b border-[#D6CEBE]">
              Taxonomic & Accession Record
            </h3>
            <dl className="divide-y divide-[#D6CEBE] text-base">
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <dt className="font-sans-ui text-sm font-medium text-[#57534E]">Binomial Taxon</dt>
                <dd className="col-span-2 font-serif-prose italic font-semibold text-[#1C1917]">
                  {analysis.scientificName}
                </dd>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <dt className="font-sans-ui text-sm font-medium text-[#57534E]">Botanical Family</dt>
                <dd className="col-span-2 font-serif-prose text-[#1C1917]">{analysis.family}</dd>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <dt className="font-sans-ui text-sm font-medium text-[#57534E]">Cultivar / Form</dt>
                <dd className="col-span-2 font-serif-prose text-[#1C1917]">{analysis.cultivarOrVariety}</dd>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <dt className="font-sans-ui text-sm font-medium text-[#57534E]">Native Range</dt>
                <dd className="col-span-2 font-serif-prose text-[#1C1917]">{analysis.origin}</dd>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <dt className="font-sans-ui text-sm font-medium text-[#57534E]">Household Safety</dt>
                <dd className="col-span-2 font-serif-prose text-[#1C1917]">
                  <span className="font-semibold">{analysis.careInstructions.toxicity.status}</span> — {analysis.careInstructions.toxicity.compounds}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right 7 Columns: Editorial Monograph Prose, Pathology Diagnosis & Care Parameters */}
        <div className="lg:col-span-7 space-y-10">
          {/* Monumental Title Block */}
          <div>
            <p className="text-sm font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
              Verified Botanical Identification
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-[#1C1917] tracking-tight mt-1 leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              {analysis.commonName}
            </h2>
            <p className="text-2xl sm:text-3xl font-display italic text-[#57534E] mt-1">
              {analysis.scientificName}
            </p>
          </div>

          {/* Drop-Cap Editorial Monograph */}
          <div className="max-w-prose">
            <p className="text-xl font-serif-prose leading-[1.8] text-[#1C1917] first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:leading-none first-letter:text-[#14532D]">
              {analysis.editorialSummary}
            </p>
          </div>

          {/* Specimen Pathology & Vitality Inspection */}
          <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#D6CEBE] pb-4">
              <div>
                <span className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
                  Visual Pathology & Vitality Assessment
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#14532D] mt-0.5">
                  {analysis.diagnosticAssessment.overallHealth}
                </h3>
              </div>
              <span className="text-sm font-mono-tabular text-[#57534E]">
                Next Irrigation Due: {specimen.nextWateringDueDays} {specimen.nextWateringDueDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            <p className="text-lg font-serif-prose leading-relaxed text-[#292524] max-w-prose">
              {analysis.diagnosticAssessment.observedSymptoms}
            </p>

            <div className="pt-2">
              <h4 className="text-sm font-sans-ui font-semibold text-[#1C1917] mb-3">
                Immediate Horticultural Protocol:
              </h4>
              <ul className="space-y-2.5">
                {analysis.diagnosticAssessment.immediateActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3 text-base sm:text-lg font-serif-prose text-[#1C1917]">
                    <CheckCircle2 className="w-5 h-5 text-[#14532D] shrink-0 mt-1" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quantitative Care Ledger (Tabular Numerals & Hairline Grid) */}
          <div className="space-y-6">
            <div className="border-b border-[#1C1917] pb-2 flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917]">
                Cultivation & Environmental Specifications
              </h3>
              <span className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
                Standard Conservatory Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              {/* 01. Solar Radiation & Light */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">01. SOLAR RADIATION</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1 font-mono-tabular">
                  {analysis.careInstructions.light.exposure}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  {analysis.careInstructions.light.placement}
                </p>
              </div>

              {/* 02. Hydration & Irrigation */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">02. IRRIGATION CADENCE</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1 font-mono-tabular">
                  {analysis.careInstructions.watering.intervalDays}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  {analysis.careInstructions.watering.soilMoistureRule}{' '}
                  <span className="italic text-[#57534E]">{analysis.careInstructions.watering.waterQuality}</span>
                </p>
              </div>

              {/* 03. Atmospheric Humidity & Thermal Range */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">03. ATMOSPHERIC & THERMAL</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1 font-mono-tabular">
                  {analysis.careInstructions.humidityAndTemp.tempRange} · {analysis.careInstructions.humidityAndTemp.idealHumidityPct}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  {analysis.careInstructions.humidityAndTemp.hardinessAndDrafts}
                </p>
              </div>

              {/* 04. Pedology & Substrate Chemistry */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">04. SUBSTRATE & SOIL pH</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1 font-mono-tabular">
                  Target pH {analysis.careInstructions.soilAndSubstrate.pHRange}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  <strong>Formula:</strong> {analysis.careInstructions.soilAndSubstrate.mixFormula}{' '}
                  {analysis.careInstructions.soilAndSubstrate.repottingCadence}
                </p>
              </div>

              {/* 05. Mineral Nutrition & NPK */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">05. MINERAL NUTRITION</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1 font-mono-tabular">
                  {analysis.careInstructions.fertilizer.npkRatio}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  {analysis.careInstructions.fertilizer.schedule}
                </p>
              </div>

              {/* 06. Pruning & Vegetative Propagation */}
              <div className="border-t border-[#D6CEBE] pt-4">
                <span className="text-xs font-mono-tabular text-[#57534E]">06. PROPAGATION & PRUNING</span>
                <h4 className="text-xl font-display font-semibold text-[#1C1917] mt-1">
                  {analysis.careInstructions.pruningAndPropagation.method}
                </h4>
                <p className="text-base sm:text-lg font-serif-prose text-[#292524] mt-2 leading-relaxed">
                  {analysis.careInstructions.pruningAndPropagation.pruningGuide}
                </p>
              </div>
            </div>
          </div>

          {/* 4-Season Phenological Care Calendar */}
          <div className="pt-4">
            <div className="border-b border-[#1C1917] pb-2 mb-6 flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917]">
                Seasonal Phenology & Care Regimen
              </h3>
              <span className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
                Annual Cycle
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {analysis.seasonalCalendar.map((item, idx) => (
                <div key={idx} className="border-l-2 border-[#14532D] pl-5 py-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xl font-display font-semibold text-[#1C1917]">
                      0{idx + 1}. {item.season}
                    </h4>
                    <span className="text-xs font-sans-ui font-medium text-[#14532D]">
                      {item.focus}
                    </span>
                  </div>
                  <p className="text-base font-serif-prose text-[#292524] mt-1.5 leading-relaxed">
                    {item.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
