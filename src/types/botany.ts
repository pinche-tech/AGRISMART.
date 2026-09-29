export interface DiagnosticAssessment {
  overallHealth: string;
  observedSymptoms: string;
  immediateActions: string[];
}

export interface CareInstructions {
  light: {
    exposure: string;
    placement: string;
  };
  watering: {
    intervalDays: string;
    soilMoistureRule: string;
    waterQuality: string;
  };
  humidityAndTemp: {
    idealHumidityPct: string;
    tempRange: string;
    hardinessAndDrafts: string;
  };
  soilAndSubstrate: {
    pHRange: string;
    mixFormula: string;
    repottingCadence: string;
  };
  fertilizer: {
    npkRatio: string;
    schedule: string;
  };
  pruningAndPropagation: {
    method: string;
    pruningGuide: string;
  };
  toxicity: {
    status: string;
    compounds: string;
  };
}

export interface SeasonalEntry {
  season: string;
  focus: string;
  instructions: string;
}

export interface PlantAnalysis {
  commonName: string;
  scientificName: string;
  family: string;
  cultivarOrVariety: string;
  origin: string;
  confidenceNote: string;
  editorialSummary: string;
  diagnosticAssessment: DiagnosticAssessment;
  careInstructions: CareInstructions;
  seasonalCalendar: SeasonalEntry[];
}

export interface SpecimenHistoryPoint {
  period: string;
  phase: string;
  heightCm: number;
  leafCount: number;
  wateringsPerMonth: number;
  waterVolumeMl: number;
}

export interface PlantSpecimen {
  id: string;
  accessionNumber: string;
  dateCataloged: string;
  imageUrl: string;
  locationInHome: string;
  lastWateredDate: string;
  nextWateringDueDays: number;
  analysis: PlantAnalysis;
  growthHistory?: SpecimenHistoryPoint[];
}

export function getSpecimenHistory(specimen: PlantSpecimen): SpecimenHistoryPoint[] {
  if (specimen.growthHistory && specimen.growthHistory.length > 0) {
    return specimen.growthHistory;
  }

  const presets: Record<string, SpecimenHistoryPoint[]> = {
    'spec-monstera-01': [
      { period: 'Apr 2026', phase: 'Root Establishment', heightCm: 54, leafCount: 6, wateringsPerMonth: 3, waterVolumeMl: 1800 },
      { period: 'May 2026', phase: 'Early Vegetative', heightCm: 61, leafCount: 8, wateringsPerMonth: 4, waterVolumeMl: 2400 },
      { period: 'Jun 2026', phase: 'Primary Fenestration', heightCm: 70, leafCount: 10, wateringsPerMonth: 4, waterVolumeMl: 2850 },
      { period: 'Jul 2026', phase: 'Peak Canopy Flush', heightCm: 82, leafCount: 13, wateringsPerMonth: 5, waterVolumeMl: 3400 },
      { period: 'Aug 2026', phase: 'Aerial Root Anchoring', heightCm: 91, leafCount: 15, wateringsPerMonth: 4, waterVolumeMl: 3100 },
      { period: 'Sep 2026', phase: 'Lamina Maturation', heightCm: 96, leafCount: 16, wateringsPerMonth: 3, waterVolumeMl: 2500 },
    ],
    'spec-ficus-02': [
      { period: 'Apr 2026', phase: 'Apical Bud Swell', heightCm: 110, leafCount: 18, wateringsPerMonth: 3, waterVolumeMl: 2100 },
      { period: 'May 2026', phase: 'Spring Leaf Flush', heightCm: 118, leafCount: 21, wateringsPerMonth: 4, waterVolumeMl: 2700 },
      { period: 'Jun 2026', phase: 'Lateral Branching', heightCm: 127, leafCount: 25, wateringsPerMonth: 4, waterVolumeMl: 3000 },
      { period: 'Jul 2026', phase: ' Vigorous Canopy', heightCm: 136, leafCount: 28, wateringsPerMonth: 5, waterVolumeMl: 3500 },
      { period: 'Aug 2026', phase: 'Trunk Lignification', heightCm: 142, leafCount: 30, wateringsPerMonth: 4, waterVolumeMl: 2900 },
      { period: 'Sep 2026', phase: 'Autumn Hardening', heightCm: 145, leafCount: 31, wateringsPerMonth: 3, waterVolumeMl: 2300 },
    ],
    'spec-olea-03': [
      { period: 'Apr 2026', phase: 'Vernal Shoot Break', heightCm: 95, leafCount: 120, wateringsPerMonth: 2, waterVolumeMl: 1400 },
      { period: 'May 2026', phase: 'Panicle Emergence', heightCm: 101, leafCount: 145, wateringsPerMonth: 3, waterVolumeMl: 1900 },
      { period: 'Jun 2026', phase: 'Early Drupe Set', heightCm: 108, leafCount: 170, wateringsPerMonth: 4, waterVolumeMl: 2500 },
      { period: 'Jul 2026', phase: 'Sclerophyll Expansion', heightCm: 114, leafCount: 195, wateringsPerMonth: 4, waterVolumeMl: 2700 },
      { period: 'Aug 2026', phase: 'Wood Maturation', heightCm: 118, leafCount: 210, wateringsPerMonth: 3, waterVolumeMl: 2100 },
      { period: 'Sep 2026', phase: 'Pre-Dormancy Rest', heightCm: 120, leafCount: 215, wateringsPerMonth: 2, waterVolumeMl: 1500 },
    ],
    'spec-calathea-04': [
      { period: 'Apr 2026', phase: 'Rhizome Division', heightCm: 32, leafCount: 9, wateringsPerMonth: 4, waterVolumeMl: 1200 },
      { period: 'May 2026', phase: 'Culm Emergence', heightCm: 37, leafCount: 12, wateringsPerMonth: 5, waterVolumeMl: 1550 },
      { period: 'Jun 2026', phase: 'Orbicular Unfurling', heightCm: 43, leafCount: 15, wateringsPerMonth: 6, waterVolumeMl: 1850 },
      { period: 'Jul 2026', phase: 'Peak Humidity Flush', heightCm: 49, leafCount: 19, wateringsPerMonth: 6, waterVolumeMl: 2050 },
      { period: 'Aug 2026', phase: 'Crown Densification', heightCm: 53, leafCount: 22, wateringsPerMonth: 5, waterVolumeMl: 1750 },
      { period: 'Sep 2026', phase: 'Equinox Equilibrium', heightCm: 55, leafCount: 24, wateringsPerMonth: 4, waterVolumeMl: 1450 },
    ],
  };

  return (
    presets[specimen.id] || [
      { period: 'Apr 2026', phase: 'Seedling / Acclimation', heightCm: 28, leafCount: 5, wateringsPerMonth: 3, waterVolumeMl: 1100 },
      { period: 'May 2026', phase: 'Root Proliferation', heightCm: 36, leafCount: 8, wateringsPerMonth: 4, waterVolumeMl: 1500 },
      { period: 'Jun 2026', phase: 'Vegetative Expansion', heightCm: 47, leafCount: 12, wateringsPerMonth: 5, waterVolumeMl: 2100 },
      { period: 'Jul 2026', phase: 'Peak Canopy Growth', heightCm: 58, leafCount: 16, wateringsPerMonth: 5, waterVolumeMl: 2450 },
      { period: 'Aug 2026', phase: 'Structural Maturation', heightCm: 65, leafCount: 19, wateringsPerMonth: 4, waterVolumeMl: 2000 },
      { period: 'Sep 2026', phase: 'Seasonal Stabilization', heightCm: 69, leafCount: 21, wateringsPerMonth: 3, waterVolumeMl: 1650 },
    ]
  );
}

export type ChatModelId = 'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

export interface SearchCitationLink {
  title: string;
  uri: string;
}

export interface MapsGroundedPlace {
  title: string;
  uri: string;
  reviewSnippets: string[];
}

export interface DailyForecastItem {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  rainSumMm: number;
  rainProbPct: number;
  et0Mm: number;
}

export interface HeavyRainAlertStatus {
  isActive: boolean;
  locationName: string;
  forecastDate: string;
  expectedRainMm: number;
  rainProbabilityPct: number;
  severity: 'extreme' | 'heavy' | 'moderate' | 'normal';
  onsetWindow: string;
  headline: string;
  agronomicImpact: string;
  recommendedActions: string[];
  isSimulated?: boolean;
}

export interface GpsAgroReport {
  locationName: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  currentWeather: {
    temperatureC: number;
    humidityPct: number;
    windSpeedKmh: number;
    pressureHpa: number;
    soilTempC: number;
    soilMoistureVol: number;
  };
  next24hRainMm?: number;
  next24hRainProbPct?: number;
  dailyForecast: DailyForecastItem[];
  advisoryMarkdown: string;
  searchLinks: SearchCitationLink[];
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  imagePreview?: string;
  searchLinks?: SearchCitationLink[];
}

export const HERO_CONSERVATORY_IMAGE = '/src/assets/images/hero_botanical_conservatory_1790663577676.jpg';

export const INITIAL_HERBARIUM_SPECIMENS: PlantSpecimen[] = [
  {
    id: 'spec-monstera-01',
    accessionNumber: 'ACC. 2026.01.14',
    dateCataloged: '14 March 2026',
    imageUrl: '/src/assets/images/specimen_monstera_deliciosa_1790663591348.jpg',
    locationInHome: 'South-East Drawing Room Window',
    lastWateredDate: '2026-09-22',
    nextWateringDueDays: 3,
    analysis: {
      commonName: 'Swiss Cheese Plant',
      scientificName: 'Monstera deliciosa',
      family: 'Araceae',
      cultivarOrVariety: 'Large-Form Borsigiana Selection',
      origin: 'Montane cloud forests of Southern Mexico to Panama',
      confidenceNote: 'Verified by deep pinnatifid leaf fenestrations, geniculum petiolar swelling, and sub-woody internodal habit.',
      editorialSummary:
        'A hemiepiphytic aroid prized for its leathery, deeply fenestrated blades that evolved to withstand tropical downpours and allow filtered canopy shafts to reach lower foliage tiers. In interior cultivation, it forms an architectural centerpiece when supported by a moistened cedar or sphagnum totem.',
      diagnosticAssessment: {
        overallHealth: 'Thriving Mature Specimen',
        observedSymptoms:
          'Deep chlorophyll saturation across mature laminae with symmetrical midrib fenestrations and strong foliar turgor. No necrotic tipping or thrips stippling observed.',
        immediateActions: [
          'Wipe upper leaf surfaces with damp microfiber cloth to maximize stomatal gas exchange and photosynthetic efficiency.',
          'Guide emerging aerial roots toward the terracotta pot substrate rather than trimming them.',
          'Rotate container 90 degrees clockwise this week to maintain balanced phototropic posture.',
        ],
      },
      careInstructions: {
        light: {
          exposure: 'Bright Indirect Light (800 – 1,800 Foot-Candles)',
          placement: 'Set 1.2 to 2.0 meters back from an unobstructed south or east-facing window; shield from harsh midday summer sun.',
        },
        watering: {
          intervalDays: 'Every 8–10 days in active growth; 14–18 days in winter',
          soilMoistureRule: 'Allow top 5–8 cm (2–3 inches) of chunky aroid medium to dry before drenching thoroughly until 15% runoff exits drainage hole.',
          waterQuality: 'Room-temperature filtered or settled tap water (68°F / 20°C).',
        },
        humidityAndTemp: {
          idealHumidityPct: '55% – 75% Relative Humidity',
          tempRange: '65°F – 84°F (18°C – 29°C)',
          hardinessAndDrafts: 'USDA Zones 10–12; growth halts below 55°F (13°C). Keep clear of cold winter window drafts.',
        },
        soilAndSubstrate: {
          pHRange: '5.5 – 6.5 (Slightly Acidic)',
          mixFormula: '35% coarse Douglas fir orchid bark, 30% coco coir, 20% #3 coarse perlite, 10% worm castings, 5% horticultural charcoal.',
          repottingCadence: 'Every 24 months in mid-spring into an unglazed terracotta or breathable stoneware vessel 5 cm wider.',
        },
        fertilizer: {
          npkRatio: '3-1-2 Liquid Foliage Formula with Calcium & Magnesium',
          schedule: 'Dilute to half-strength every second watering from April through September; suspend feeding November to February.',
        },
        pruningAndPropagation: {
          method: 'Single-node stem division bearing at least one dormant axillary bud and aerial root nub.',
          pruningGuide: 'Make sterile 45-degree cuts 2 cm below a swollen node in late spring; callous for 2 hours before rooting in moist sphagnum.',
        },
        toxicity: {
          status: 'Toxic to Cats & Dogs if chewed',
          compounds: 'Contains insoluble calcium oxalate raphides that cause oral irritation and hypersalivation.',
        },
      },
      seasonalCalendar: [
        {
          season: 'Spring',
          focus: 'Structural Repotting & Moss Pole Anchoring',
          instructions: 'Inspect root ball for circling roots, refresh top 5 cm of substrate with worm castings, and resume 3-1-2 feeding.',
        },
        {
          season: 'Summer',
          focus: 'Peak Fenestration & Hydration',
          instructions: 'Check moisture every 7 days; mist aerial roots along support pole to encourage secondary inner leaf perforations.',
        },
        {
          season: 'Autumn',
          focus: 'Photoperiod Transition',
          instructions: 'Move 50 cm closer to window glass as daylight hours shorten; taper liquid fertilizer to once monthly.',
        },
        {
          season: 'Winter',
          focus: 'Dormancy & Root Rot Prevention',
          instructions: 'Extend watering interval to 14–18 days; run a cool-mist humidifier if indoor heating drops RH below 40%.',
        },
      ],
    },
  },
  {
    id: 'spec-ficus-02',
    accessionNumber: 'ACC. 2026.02.08',
    dateCataloged: '08 April 2026',
    imageUrl: '/src/assets/images/specimen_ficus_lyrata_1790663605935.jpg',
    locationInHome: 'Library Tall Casement',
    lastWateredDate: '2026-09-20',
    nextWateringDueDays: 1,
    analysis: {
      commonName: 'Fiddle-Leaf Fig',
      scientificName: 'Ficus lyrata',
      family: 'Moraceae',
      cultivarOrVariety: 'Standard Arborescent Form',
      origin: 'Lowland tropical rainforests of Western Africa (Sierra Leone to Cameroon)',
      confidenceNote: 'Distinguished by panduriform (lyre-shaped) coriaceous leaves up to 45 cm long with prominent pale green venation and wavy margins.',
      editorialSummary:
        'An sculptural broadleaf evergreen tree celebrated for its dramatic violin-shaped foliage and upright woody trunk. While demanding of consistent photon flux and well-oxygenated roots, a settled specimen rewards the attentive grower with rapid spring flushes of bronze-tinted juvenile leaves.',
      diagnosticAssessment: {
        overallHealth: 'Vigorous Apical Growth',
        observedSymptoms:
          'Upright foliar angle above 45 degrees indicating strong turgor pressure; prominent pale veins with clean margins free of bacterial brown spot.',
        immediateActions: [
          'Perform gentle trunk agitation (shaking the main stem for 60 seconds twice weekly) to stimulate lignification and thicker girth.',
          'Check top 6 cm of substrate tomorrow; specimen is due for a measured soak within 24 hours.',
          'Dust broad leaf surfaces monthly so upper palisade cells capture full morning light.',
        ],
      },
      careInstructions: {
        light: {
          exposure: 'High Bright Light with Morning Direct Sun (1,500 – 3,000 Foot-Candles)',
          placement: 'Place directly in front of an east-facing or filtered south-facing window; acclimate over 14 days to direct beams.',
        },
        watering: {
          intervalDays: 'Every 7–9 days in summer; 12–14 days in winter',
          soilMoistureRule: 'Water when top 5–7 cm feels dry to the second knuckle. Never leave container sitting in saucer overflow.',
          waterQuality: 'Tepid filtered water; cold water shocks fine feeder roots and triggers lower leaf abscission.',
        },
        humidityAndTemp: {
          idealHumidityPct: '50% – 65% Relative Humidity',
          tempRange: '65°F – 80°F (18°C – 27°C)',
          hardinessAndDrafts: 'USDA Zones 10–12. Extremely sensitive to sudden HVAC blasts or drafty exterior doors.',
        },
        soilAndSubstrate: {
          pHRange: '6.0 – 7.0 (Neutral to Slightly Acidic)',
          mixFormula: '45% aged pine bark fines, 35% peat or coco coir, 15% coarse pumice, 5% composted humus.',
          repottingCadence: 'Every 18–24 months in late spring; increase pot diameter by no more than 5 cm.',
        },
        fertilizer: {
          npkRatio: '3-1-2 Nitrogen-Forward Woody Plant Formula',
          schedule: 'Feed monthly from March through September; flush substrate with plain water mid-summer to remove mineral salts.',
        },
        pruningAndPropagation: {
          method: 'Apical woody stem cuttings (20 cm with 2–3 leaves halved) or air-layering along mature branches.',
          pruningGuide: 'Notch or pinch the terminal apical bud in May to break apical dominance and induce lateral branching. Wear gloves to avoid white latex sap.',
        },
        toxicity: {
          status: 'Mildly Toxic to Pets',
          compounds: 'Ficin proteolytic enzymes and psoralens in the milky latex sap irritate skin and mucous membranes.',
        },
      },
      seasonalCalendar: [
        {
          season: 'Spring',
          focus: 'Apical Pinching & Bud Break',
          instructions: 'Pinch terminal stipules to encourage lateral bifurcation; begin regular 3-1-2 liquid feeding.',
        },
        {
          season: 'Summer',
          focus: 'Rapid Canopy Expansion',
          instructions: 'Maintain consistent 7-day moisture checks; edema (reddish pinpoint freckling) on new leaves signals uneven watering.',
        },
        {
          season: 'Autumn',
          focus: 'Draft Protection',
          instructions: 'Seal window drafts and keep away from radiator vents before central heating begins.',
        },
        {
          season: 'Winter',
          focus: 'Supplemental Photon Support',
          instructions: 'Supplement with a 4000K full-spectrum horticultural lamp if natural light falls below 600 foot-candles.',
        },
      ],
    },
  },
  {
    id: 'spec-olea-03',
    accessionNumber: 'ACC. 2026.03.21',
    dateCataloged: '21 May 2026',
    imageUrl: '/src/assets/images/specimen_olea_europaea_1790663617435.jpg',
    locationInHome: 'Sunlit Limestone Courtyard / Solarium',
    lastWateredDate: '2026-09-18',
    nextWateringDueDays: 2,
    analysis: {
      commonName: 'Mediterranean Olive Tree',
      scientificName: 'Olea europaea',
      family: 'Oleaceae',
      cultivarOrVariety: 'Arbequina / Compact Container Standard',
      origin: 'Coastal Mediterranean Basin',
      confidenceNote: 'Identified by opposite lanceolate leaves with silvery-stellate abaxial trichomes (scales on leaf undersides) and fissured ash-gray bark.',
      editorialSummary:
        'An ancient evergreen sclerophyllous tree revered for its shimmering silver-green canopy and sculptural gnarled trunk. Unlike tropical foliage plants, Olea europaea demands uninhibited direct solar radiation, sharp mineral drainage, and a cool winter rest period.',
      diagnosticAssessment: {
        overallHealth: 'Healthy Sclerophyllous Canopy',
        observedSymptoms:
          'Dense internodal spacing with reflective silver undersides and firm woody branches. No scale insects or Peacock spot lesions present.',
        immediateActions: [
          'Ensure container receives a minimum of 6 hours of direct unobstructed sunlight daily.',
          'Allow substrate to dry 50% down the pot profile before deep drenching.',
          'Thin inward-crossing twigs in late winter so air circulates freely through the crown.',
        ],
      },
      careInstructions: {
        light: {
          exposure: 'Full Direct Sunlight (3,500 – 8,000+ Foot-Candles)',
          placement: 'Directly beside an unshaded south or west window indoors, or outdoors on a sunny terrace from frost-free spring through autumn.',
        },
        watering: {
          intervalDays: 'Every 10–14 days indoors; 5–7 days outdoors in summer heat',
          soilMoistureRule: 'Allow top 8–10 cm (half the pot depth) to dry completely between deep soakings.',
          waterQuality: 'Tolerates hard mineral tap water well; prefers alkaline-leaning irrigation.',
        },
        humidityAndTemp: {
          idealHumidityPct: '30% – 50% Relative Humidity (Prefers Dry Air)',
          tempRange: '60°F – 85°F (15°C – 29°C) summer; 45°F – 55°F (7°C – 13°C) winter rest',
          hardinessAndDrafts: 'USDA Zones 8–11; requires 6–8 weeks below 55°F (13°C) in winter if flower panicles and fruit set are desired.',
        },
        soilAndSubstrate: {
          pHRange: '6.5 – 7.8 (Neutral to Slightly Alkaline)',
          mixFormula: '40% coarse horticultural grit/pumice, 30% sandy loam, 20% pine bark fines, 10% crushed limestone or oyster shell.',
          repottingCadence: 'Every 2–3 years in early spring into an unglazed terracotta pot with wide drainage holes.',
        },
        fertilizer: {
          npkRatio: 'Balanced 10-10-10 or Organic Citrus/Mediterranean Feed with Boron',
          schedule: 'Apply slow-release organic granules in March and June; avoid late-summer nitrogen which causes tender frost-prone shoots.',
        },
        pruningAndPropagation: {
          method: 'Semi-hardwood heel cuttings taken in late summer and treated with 0.3% IBA rooting hormone.',
          pruningGuide: 'Prune in late winter to an open-center goblet structure so sunlight reaches the interior scaffold branches.',
        },
        toxicity: {
          status: 'Non-Toxic (Pet & Child Safe)',
          compounds: 'Foliage and bark are non-toxic to dogs, cats, and horses according to ASPCA botanical records.',
        },
      },
      seasonalCalendar: [
        {
          season: 'Spring',
          focus: 'Formative Goblet Pruning & Slow-Release Feeding',
          instructions: 'Prune dead or crossing interior shoots prior to bud swell; top-dress with gritty compost and crushed limestone.',
        },
        {
          season: 'Summer',
          focus: 'Maximum Solar Exposure',
          instructions: 'Transition pot outdoors to a sunlit patio if possible; monitor terracotta pots during heatwaves above 90°F (32°C).',
        },
        {
          season: 'Autumn',
          focus: 'Hardening Off',
          instructions: 'Reduce watering frequency as night temperatures cool; bring indoors before hard freezes below 25°F (-4°C).',
        },
        {
          season: 'Winter',
          focus: 'Cool Bright Vernalization',
          instructions: 'Keep in the brightest, coolest room (50°F–60°F) away from dry heating vents; water sparingly once every 2–3 weeks.',
        },
      ],
    },
  },
  {
    id: 'spec-calathea-04',
    accessionNumber: 'ACC. 2026.04.03',
    dateCataloged: '03 June 2026',
    imageUrl: '/src/assets/images/specimen_calathea_orbifolia_1790663630394.jpg',
    locationInHome: 'North-Facing Conservatory Alcove',
    lastWateredDate: '2026-09-26',
    nextWateringDueDays: 4,
    analysis: {
      commonName: 'Round-Leaf Prayer Plant',
      scientificName: 'Goeppertia orbifolia (syn. Calathea orbifolia)',
      family: 'Marantaceae',
      cultivarOrVariety: 'True Species Form',
      origin: 'Humid Atlantic rainforests of Bolivia and Eastern Brazil',
      confidenceNote: 'Characterized by broad, pleated orbicular blades with alternating metallic silver-celadon and deep emerald lateral bands and a basal pulvinus joint.',
      editorialSummary:
        'One of the finest foliage perennials of the Marantaceae family, displaying wide pleated leaves brushed in luminous silver-green bands. Driven by circadian nyctinasty, the specialized motor cells in the leaf stalk (pulvinus) raise the blades vertically at dusk and lower them at dawn.',
      diagnosticAssessment: {
        overallHealth: 'Pristine Humidity-Balanced Foliage',
        observedSymptoms:
          'Crisp silver-and-emerald striping with smooth, uncurled leaf margins and active evening nyctinastic movement. Free of fluoride tip burn.',
        immediateActions: [
          'Irrigate exclusively with distilled, reverse-osmosis, or collected rainwater to prevent brown marginal necrosis.',
          'Maintain ambient relative humidity above 60% around the foliage crown.',
          'Inspect abaxial leaf surfaces biweekly for two-spotted spider mites.',
        ],
      },
      careInstructions: {
        light: {
          exposure: 'Medium to Bright Dappled Shade (400 – 900 Foot-Candles)',
          placement: 'Ideal for north-facing windows or 2.5 meters away from an east window. Direct sun bleaches the silver variegation and curls leaves.',
        },
        watering: {
          intervalDays: 'Every 5–7 days in summer; 9–12 days in winter',
          soilMoistureRule: 'Keep substrate evenly moist like a wrung-out sponge; water as soon as the top 2.5 cm (1 inch) begins to feel dry.',
          waterQuality: 'Strictly distilled, rainwater, or zero-fluoride/chloramine water (EC < 0.2 mS/cm).',
        },
        humidityAndTemp: {
          idealHumidityPct: '65% – 80% Relative Humidity',
          tempRange: '68°F – 78°F (20°C – 26°C)',
          hardinessAndDrafts: 'USDA Zones 11–12. Never expose to temperatures below 60°F (15.5°C).',
        },
        soilAndSubstrate: {
          pHRange: '5.5 – 6.2 (Acidic)',
          mixFormula: '50% coco coir, 20% fine orchid bark, 20% perlite, 10% vermicompost (moisture-retentive yet aerated).',
          repottingCadence: 'Every 18 months in late spring into a glazed ceramic pot that retains even root-zone moisture.',
        },
        fertilizer: {
          npkRatio: '1-1-1 Balanced Organic Seaweed/Humic Feed at 1/4 Strength',
          schedule: 'Feed lightly once a month from May through August; excess mineral salts burn leaf margins immediately.',
        },
        pruningAndPropagation: {
          method: 'Rhizomatous clump division during spring repotting (stem cuttings will not root).',
          pruningGuide: 'Snip senescing outer leaves cleanly at the soil line with sterilized shears; never trim brown leaf edges into living green tissue.',
        },
        toxicity: {
          status: '100% Non-Toxic (Pet & Child Safe)',
          compounds: 'Completely safe for households with cats, dogs, and curious pets.',
        },
      },
      seasonalCalendar: [
        {
          season: 'Spring',
          focus: 'Rhizome Division & Fresh Coir Substrate',
          instructions: 'Divide crowded clumps keeping at least 4–5 culms per division; maintain high humidity for 3 weeks post-division.',
        },
        {
          season: 'Summer',
          focus: 'Consistent Moisture & Mite Prevention',
          instructions: 'Rinse foliage gently with lukewarm distilled water every 2 weeks to deter spider mites.',
        },
        {
          season: 'Autumn',
          focus: 'Humidifier Calibration',
          instructions: 'Position an evaporative or ultrasonic humidifier nearby before indoor heating dries the room air.',
        },
        {
          season: 'Winter',
          focus: 'Thermal Stability',
          instructions: 'Keep away from cold windowpanes at night; maintain root zone above 65°F (18°C).',
        },
      ],
    },
  },
];
