/**
 * lib/geocoding.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FRONTEND-FIRST hybrid geocoding engine: Photon (OSM, free) + Mapbox (paid).
 *
 * Architecture: "Frontend-First"
 * ────────────────────────────────
 * ZERO backend dependency. Every geocoding operation completes entirely in the
 * browser. The store receives a backend-ready object instantly — no network
 * round-trip to our server required.
 *
 * Design: "Dynamic Proximity Biasing"
 * ────────────────────────────────────
 * Every search receives a `currentBias` object ({ lng, lat }) representing
 * exactly what the user has visible on the map. Both APIs use this as their
 * proximity anchor so results are always contextually relevant — no country
 * restriction, works globally.
 *
 * Decision tree
 * ─────────────
 * 1. Always fire Photon (zero quota, ~150 ms).
 * 2. If the query contains digits → fire Mapbox IN PARALLEL immediately
 *    (numbers = the user wants a specific address number).
 * 3. After Photon responds: if its best result is type 'house' | 'street' |
 *    'address' → the coords are only block-level → fire Mapbox to upgrade.
 * 4. Photon "place" results (park, stadium, amenity) are centroid-precise
 *    → keep them, skip Mapbox.
 *
 * Both fetchers accept an AbortSignal to support request cancellation from
 * the components (typing fast = cancel in-flight request instantly).
 */

// ─── Public types ─────────────────────────────────────────────────────────────

/** Represents the current map viewport center — injected into every search. */
export interface GeocodingBias {
  lng: number;
  lat: number;
}

export type GeoResultSource = "photon" | "mapbox";
export type GeoResultKind = "address" | "place";

/**
 * Backend-ready geocoding result.
 * Every field is constructed entirely in the frontend — no server needed.
 */
export interface GeoResult {
  /** Full human-readable address (e.g. "Carrera 43 #84-10, El Poblado, Barranquilla") */
  fullAddress: string;
  /** Street component only (e.g. "Carrera 43 #84-10") */
  street: string;
  /** Neighborhood / barrio (e.g. "El Poblado") — empty string if unavailable */
  neighborhood: string;
  /** High-precision [lng, lat] coordinates — ready for the backend */
  coords: [number, number];
  /** API that produced this result */
  source: GeoResultSource;
  /** Broad category */
  kind: GeoResultKind;
  /** Specific place type (e.g. "house", "park", "stadium", "address") */
  placeType: string;

  // ── Aliases for backward compat with existing components ────────────────
  /** @alias street */
  streetName: string;
  /** @alias neighborhood + city */
  subtitle: string;
  /** @alias coords */
  exactCoords: [number, number];
}

// ─── Photon internals ─────────────────────────────────────────────────────────

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    /** OSM element type: "house" | "street" | "city" | "amenity" | "leisure" … */
    type?: string;
    /** OSM tag value: "park" | "stadium" | "restaurant" | "attraction" … */
    osm_value?: string;
    /** District / neighborhood */
    district?: string;
  };
}

/**
 * Types that signal Photon coordinates are only street/block level.
 * These need a Mapbox upgrade for house-number precision.
 */
const PHOTON_NEEDS_UPGRADE = new Set(["house", "street", "address"]);

/** Types for named places — Photon's centroid is already correct. */
const PHOTON_PLACE_TYPES = new Set([
  "amenity",
  "leisure",
  "tourism",
  "shop",
  "sport",
  "natural",
  "city",
  "district",
  "locality",
]);

function photonNeedsUpgrade(f: PhotonFeature): boolean {
  return PHOTON_NEEDS_UPGRADE.has(f.properties.type ?? "");
}

function photonIsGeneralPlace(f: PhotonFeature): boolean {
  return PHOTON_PLACE_TYPES.has(f.properties.type ?? "");
}

function photonPlaceType(f: PhotonFeature): string {
  return f.properties.osm_value || f.properties.type || "unknown";
}

/** Build a rich GeoResult from a Photon feature — entirely in the browser. */
function photonToResult(f: PhotonFeature): GeoResult {
  const p = f.properties;

  // ── Construct street ────────────────────────────────────────────────────
  const streetParts = [p.street, p.housenumber].filter(Boolean);
  const street = p.name || streetParts.join(" ") || "Sin nombre";

  // ── Neighborhood ────────────────────────────────────────────────────────
  const neighborhood = p.district || "";

  // ── Subtitle (city, state) ──────────────────────────────────────────────
  const subtitle = [p.city, p.state, p.country].filter(Boolean).join(", ");

  // ── Full address: street + neighborhood + city ──────────────────────────
  const fullAddress = [street, neighborhood, p.city]
    .filter(Boolean)
    .join(", ");

  const kind: GeoResultKind = photonIsGeneralPlace(f) ? "place" : "address";
  const coords = f.geometry.coordinates;

  return {
    fullAddress,
    street,
    neighborhood,
    coords,
    source: "photon",
    kind,
    placeType: photonPlaceType(f),
    // Backward compat aliases
    streetName: street,
    subtitle,
    exactCoords: coords,
  };
}

async function fetchPhoton(
  query: string,
  bias: GeocodingBias,
  limit: number,
  signal: AbortSignal
): Promise<PhotonFeature[]> {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("lat", String(bias.lat));
    url.searchParams.set("lon", String(bias.lng));
    url.searchParams.set("zoom", "14");
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features as PhotonFeature[]) ?? [];
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return [];
    return [];
  }
}

// ─── Mapbox internals ─────────────────────────────────────────────────────────

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  center: [number, number]; // [lng, lat]
  context?: { id: string; text: string }[];
  address?: string; // house number
  properties?: {
    address?: string;
  };
}

function mapboxPlaceType(f: MapboxFeature): string {
  return f.place_type[0] ?? "address";
}

/** Build a rich GeoResult from a Mapbox feature — entirely in the browser. */
function mapboxToResult(f: MapboxFeature): GeoResult {
  // ── Extract context pieces ──────────────────────────────────────────────
  const contextNeighborhood =
    f.context?.find((c) => c.id.startsWith("neighborhood"))?.text ?? "";
  const contextCity =
    f.context?.find((c) => c.id.startsWith("place"))?.text ?? "";
  const contextRegion =
    f.context?.find((c) => c.id.startsWith("region"))?.text ?? "";

  // ── Construct street ────────────────────────────────────────────────────
  // Mapbox `text` = street name, `address` = house number
  const houseNumber = f.address || f.properties?.address || "";
  const streetBase = f.text || "";
  const street = houseNumber
    ? `${streetBase} #${houseNumber}`
    : streetBase || f.place_name.split(",")[0];

  // ── Neighborhood / barrio ───────────────────────────────────────────────
  const neighborhood = contextNeighborhood;

  // ── Subtitle ────────────────────────────────────────────────────────────
  const subtitle = [contextCity, contextRegion].filter(Boolean).join(", ");

  // ── Full address ────────────────────────────────────────────────────────
  const fullAddress = [street, neighborhood, contextCity]
    .filter(Boolean)
    .join(", ");

  const isPoi = f.place_type[0] === "poi";
  const coords = f.center;

  return {
    fullAddress,
    street,
    neighborhood,
    coords,
    source: "mapbox",
    kind: isPoi ? "place" : "address",
    placeType: mapboxPlaceType(f),
    // Backward compat aliases
    streetName: street,
    subtitle: subtitle || f.place_name,
    exactCoords: coords,
  };
}

async function fetchMapbox(
  query: string,
  bias: GeocodingBias,
  limit: number,
  signal: AbortSignal
): Promise<MapboxFeature[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return [];
  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    );
    url.searchParams.set("access_token", token);
    url.searchParams.set("proximity", `${bias.lng},${bias.lat}`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("language", "es");
    url.searchParams.set("types", "address,poi,neighborhood");
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features as MapboxFeature[]) ?? [];
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return [];
    return [];
  }
}

// ─── Colombian address normalization ─────────────────────────────────────────

/**
 * Robust mapping of Colombian street abbreviations → canonical names.
 * Order matters: longer prefixes first so "Trans" matches before "Tv".
 * Each regex is case-insensitive and matches word boundaries.
 */
const COLOMBIAN_ABBREVIATIONS: [RegExp, string][] = [
  // Carrera variants (most common abbreviation confusion)
  [/\b(?:kra|cra|cr|k)\b\.?\s*/gi, "Carrera "],
  // Calle variants
  [/\b(?:cll|cl|cle)\b\.?\s*/gi, "Calle "],
  // Diagonal variants
  [/\b(?:diag|dg)\b\.?\s*/gi, "Diagonal "],
  // Transversal variants
  [/\b(?:trans|tv|tr)\b\.?\s*/gi, "Transversal "],
  // Avenida variants
  [/\b(?:av|avda)\b\.?\s*/gi, "Avenida "],
  // Circular
  [/\b(?:circ|cir)\b\.?\s*/gi, "Circular "],
  // Manzana
  [/\b(?:mz|mza)\b\.?\s*/gi, "Manzana "],
  // Barrio
  [/\b(?:bº|bo|brio|b\/)\b\.?\s*/gi, "Barrio "],
];

/**
 * Expands Colombian street abbreviations into their full names and
 * strips the '#' separator so both Photon and Mapbox understand the query.
 *
 * Examples:
 *   "Cra 43 Cll 84"    → "Carrera 43 Calle 84"
 *   "Kra 15 # 88-64"   → "Carrera 15 88-64"
 *   "Cra 19 # 21 88"   → "Carrera 19 21 88"
 *   "Dg 40 Tv 20"      → "Diagonal 40 Transversal 20"
 *   "Av Circunvalar"    → "Avenida Circunvalar"
 */
export function normalizeColombianAddress(query: string): string {
  let normalized = query;
  // Remove '#' — Mapbox chokes on it (422) and understands "Carrera 19 21 88" fine
  normalized = normalized.replace(/#/g, "");
  for (const [pattern, replacement] of COLOMBIAN_ABBREVIATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  // Collapse multiple spaces and trim
  return normalized.replace(/\s{2,}/g, " ").trim();
}

// ─── Query Router ─────────────────────────────────────────────────────────────

/**
 * Query classification for the Photon-vs-Mapbox router.
 *
 *   EXACT   → Query has nomenclature markers (#, -, two+ number groups).
 *             User wants a house-level address → Mapbox immediately.
 *             Examples: "Cra 43 # 72-15", "Calle 84 45-20", "53 72 15"
 *
 *   SIMPLE  → Query has a single number (just a street reference).
 *             User is browsing, not pin-pointing → Photon only.
 *             Examples: "Carrera 53", "Calle 72", "Avenida 30"
 *
 *   TEXTUAL → No numbers at all → pure place name → Photon only.
 *             Examples: "Barrio Abajo", "Estadio Metropolitano"
 */
export type QueryIntent = "EXACT" | "SIMPLE" | "TEXTUAL";

export function classifyQuery(query: string): QueryIntent {
  const trimmed = query.trim();

  // Has nomenclature markers → EXACT (needs Mapbox)
  if (/#/.test(trimmed)) return "EXACT";

  // Has dash between numbers (ej: "72-15") → EXACT
  if (/\d+\s*-\s*\d+/.test(trimmed)) return "EXACT";

  // Count separate number groups (ej: "53 72" = 2 groups)
  const numberGroups = trimmed.match(/\d+/g);
  if (numberGroups && numberGroups.length >= 2) return "EXACT";

  // Has a single number → SIMPLE (Photon is sufficient)
  if (numberGroups && numberGroups.length === 1) return "SIMPLE";

  // No numbers at all → TEXTUAL
  return "TEXTUAL";
}

/** Legacy compat — true when the query needs Mapbox precision */
export function queryHasNumbers(query: string): boolean {
  return classifyQuery(query) === "EXACT";
}

// ─── Reverse geocoding ────────────────────────────────────────────────────────

/**
 * Given a [lng, lat] coordinate, returns a human-readable street address.
 * Used when the user clicks on the map to add a waypoint.
 *
 * FRONTEND-FIRST: No backend dependency. Tries Mapbox → Photon → coords.
 */
export async function reverseGeocode(
  lngLat: [number, number]
): Promise<string | null> {
  const [lng, lat] = lngLat;

  // ── Try Mapbox first ──────────────────────────────────────────────────────
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    try {
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
      );
      url.searchParams.set("access_token", token);
      url.searchParams.set("types", "address,poi,neighborhood");
      url.searchParams.set("language", "es");
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const feature = data.features?.[0];
        if (feature) {
          const houseNum = feature.address || "";
          const street = feature.text || "";
          const neighborhood =
            feature.context?.find(
              (c: { id: string }) =>
                c.id.startsWith("neighborhood") || c.id.startsWith("place")
            )?.text ?? "";
          const label = [
            houseNum ? `${street} #${houseNum}` : street,
            neighborhood,
          ]
            .filter(Boolean)
            .join(", ");
          if (label) return label;
        }
      }
    } catch {
      // Timeout or network error — fall through to Photon silently
    }
  }

  // ── Fallback: Photon reverse geocoding ───────────────────────────────────
  try {
    const url = new URL("https://photon.komoot.io/reverse/");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const props = data.features?.[0]?.properties;
      if (props) {
        const street =
          props.name ||
          [props.street, props.housenumber].filter(Boolean).join(" ");
        const neighborhood = props.district || "";
        const label = [street, neighborhood].filter(Boolean).join(", ");
        if (label) return label;
      }
    }
  } catch {
    // Both APIs failed — caller falls back to coords display
  }

  return null;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Collapse-normalizer for deduplication only (NOT for API queries).
 * Reduces all Colombian street types to short canonical forms so that
 * "Carrera 43" and "Cra 43" compare as equal.
 */
function normalizeCoDedupe(address: string): string {
  return address
    .toLowerCase()
    .replace(/\bcarrera\b|\bcra\b|\bkra\b|\bcr\b/g, "cr")
    .replace(/\bcalle\b|\bcll\b|\bcle\b|\bcl\b/g, "cl")
    .replace(/\bavenida\b|\bavda\b|\bav\b/g, "av")
    .replace(/\bdiagonal\b|\bdiag\b|\bdg\b/g, "dg")
    .replace(/\btransversal\b|\btrans\b|\btv\b/g, "tv")
    .replace(/[#.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Relevance ranking ───────────────────────────────────────────────────────

/**
 * Strict relevance scoring:
 *
 *   +100  — Street name STARTS with the user's normalized query
 *           (e.g. query "Calle 17" → "Calle 17 #45-20" gets +100,
 *            but "Calle 14 #17" does NOT)
 *
 *    +10  — Per matching number group found anywhere in the result
 *           (e.g. query "17 45" → result containing "17" gets +10,
 *            result containing both "17" and "45" gets +20)
 *
 *   +0.1  — Mapbox source bonus (tiebreaker: higher precision nomenclature)
 *
 * This ensures text relevance beats geographic proximity.
 */
export function rankByRelevance(
  results: GeoResult[],
  originalQuery: string
): GeoResult[] {
  if (!results.length) return results;

  // Normalize the query for prefix matching (collapse abbreviations)
  const normalizedQuery = originalQuery
    .toLowerCase()
    .replace(/\bcarrera\b|\bcra\b|\bkra\b|\bcr\b/g, "cr")
    .replace(/\bcalle\b|\bcll\b|\bcle\b|\bcl\b/g, "cl")
    .replace(/\bavenida\b|\bavda\b|\bav\b/g, "av")
    .replace(/\bdiagonal\b|\bdiag\b|\bdg\b/g, "dg")
    .replace(/\btransversal\b|\btrans\b|\btv\b/g, "tv")
    .replace(/[#.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const queryNumbers = originalQuery.match(/\d+/g);

  const scored = results.map((r) => {
    let score = 0;

    // ── +100: strict prefix match on street name ──────────────────────────
    const normalizedStreet = r.street
      .toLowerCase()
      .replace(/\bcarrera\b|\bcra\b|\bkra\b|\bcr\b/g, "cr")
      .replace(/\bcalle\b|\bcll\b|\bcle\b|\bcl\b/g, "cl")
      .replace(/\bavenida\b|\bavda\b|\bav\b/g, "av")
      .replace(/\bdiagonal\b|\bdiag\b|\bdg\b/g, "dg")
      .replace(/\btransversal\b|\btrans\b|\btv\b/g, "tv")
      .replace(/[#.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (normalizedStreet.startsWith(normalizedQuery)) {
      score += 100;
    }

    // ── +10 per matching number ───────────────────────────────────────────
    if (queryNumbers) {
      const text = `${r.street} ${r.fullAddress}`;
      for (const n of queryNumbers) {
        // Match as full number (avoid "17" matching inside "170")
        if (new RegExp(`\\b${n}\\b`).test(text)) {
          score += 10;
        }
      }
    }

    // ── +0.1: Mapbox tiebreaker ──────────────────────────────────────────
    if (r.source === "mapbox") score += 0.1;

    return { result: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.result);
}

/**
 * Two-layer deduplication:
 *  1. Coordinates within ~10 m → keep the first (Mapbox, higher precision).
 *  2. Normalized text match → keep the first (Mapbox nomenclature is cleaner).
 *
 * Because Mapbox results are always prepended before Photon in the merge
 * array, the first-seen result is always the Mapbox one.
 */
function deduplicateResults(results: GeoResult[]): GeoResult[] {
  const COORD_THRESHOLD = 0.0001; // ~10 m at equatorial latitudes
  const kept: GeoResult[] = [];
  const seenTexts = new Set<string>();

  for (const r of results) {
    // Layer 1: coordinate proximity
    const isCoordDupe = kept.some(
      (k) =>
        Math.abs(k.coords[0] - r.coords[0]) < COORD_THRESHOLD &&
        Math.abs(k.coords[1] - r.coords[1]) < COORD_THRESHOLD
    );
    if (isCoordDupe) continue;

    // Layer 2: normalized text match (catches "Carrera 43" vs "Cra 43")
    const normalizedText = normalizeCoDedupe(r.street);
    if (seenTexts.has(normalizedText)) continue;
    seenTexts.add(normalizedText);

    kept.push(r);
  }
  return kept;
}

// ─── Zoom intelligence ───────────────────────────────────────────────────────

/**
 * Returns the optimal zoom level for a flyTo animation based on the result type.
 *   - address / poi  → 18 (house-level detail)
 *   - neighborhood / street → 15.5 (zone context)
 *   - fallback → 16
 */
export function zoomForPlaceType(placeType: string): number {
  switch (placeType) {
    case "address":
    case "house":
    case "poi":
      return 18;
    case "neighborhood":
    case "street":
    case "district":
    case "locality":
      return 15.5;
    default:
      return 16;
  }
}

// ─── Local cache (localStorage) ──────────────────────────────────────────────

const CACHE_KEY = "geocode_cache";
const CACHE_MAX = 20;

interface CacheEntry {
  results: GeoResult[];
  ts: number; // timestamp ms
}

function getCacheStore(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCacheStore(store: Record<string, CacheEntry>): void {
  try {
    // LRU eviction: keep only the newest CACHE_MAX entries
    const entries = Object.entries(store).sort(
      ([, a], [, b]) => b.ts - a.ts
    );
    const trimmed = Object.fromEntries(entries.slice(0, CACHE_MAX));
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — non-critical, silently ignore
  }
}

function cacheGet(key: string): GeoResult[] | null {
  const store = getCacheStore();
  const entry = store[key];
  if (!entry) return null;
  // Entries older than 5 minutes are treated as stale (still returned, but refreshed)
  return entry.results;
}

function cacheSet(key: string, results: GeoResult[]): void {
  const store = getCacheStore();
  store[key] = { results, ts: Date.now() };
  setCacheStore(store);
}

/** Returns true if the cached entry is older than 5 minutes */
function cacheIsStale(key: string): boolean {
  const store = getCacheStore();
  const entry = store[key];
  if (!entry) return true;
  return Date.now() - entry.ts > 5 * 60 * 1000;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * hybridGeocode — main entry point.
 *
 * FRONTEND-FIRST: Every operation is local. The returned GeoResult[] are
 * backend-ready objects with { fullAddress, street, neighborhood, coords }.
 *
 * Query Router:
 *  - EXACT  (has #, -, 2+ numbers) → Photon + Mapbox in parallel
 *  - SIMPLE (single number)        → Photon only (saves Mapbox credits)
 *  - TEXTUAL (no numbers)          → Photon only
 *
 * Cache: localStorage (max 20 entries, stale-while-revalidate, smart invalidation)
 */
export async function hybridGeocode(
  query: string,
  currentBias: GeocodingBias,
  signal: AbortSignal,
  limit = 6
): Promise<GeoResult[]> {
  const normalized = normalizeColombianAddress(query);
  const intent = classifyQuery(normalized);

  // ── Cache check ─────────────────────────────────────────────────────────
  const cacheKey = normalizeCoDedupe(normalized);
  const cached = cacheGet(cacheKey);

  if (cached && cached.length > 0) {
    // Smart invalidation: if the query is now EXACT but cached results are
    // all from Photon, the user added a placa/number → need Mapbox precision
    const allPhoton = cached.every((r) => r.source === "photon");
    if (intent === "EXACT" && allPhoton) {
      console.log(`[Geocoding] Cache invalidated: "${query}" upgraded to EXACT`);
      // Fall through to fresh fetch
    } else {
      console.log(`[Geocoding] Cache Hit: "${query}" (${intent})`);
      if (cacheIsStale(cacheKey)) {
        fetchFreshResults(normalized, currentBias, limit, cacheKey, intent).catch(
          () => {}
        );
      }
      return cached.slice(0, limit);
    }
  }

  // ── Cache miss or invalidated: fetch fresh ──────────────────────────────
  return fetchFreshResults(normalized, currentBias, limit, cacheKey, intent, signal);
}

/**
 * Internal: fetch from Photon+Mapbox based on query intent, deduplicate, cache.
 *
 * Router logic:
 *   EXACT   → Photon + Mapbox in parallel (user wants house-level precision)
 *   SIMPLE  → Photon only; Mapbox only if Photon needs upgrade
 *   TEXTUAL → Photon only; no Mapbox
 */
async function fetchFreshResults(
  normalized: string,
  currentBias: GeocodingBias,
  limit: number,
  cacheKey: string,
  intent: QueryIntent,
  signal?: AbortSignal
): Promise<GeoResult[]> {
  const effectiveSignal = signal ?? new AbortController().signal;

  // Always fire Photon (free, fast)
  const photonPromise = fetchPhoton(normalized, currentBias, limit, effectiveSignal);
  let mapboxPromise: Promise<MapboxFeature[]> = Promise.resolve([]);

  if (intent === "EXACT") {
    // EXACT: fire Mapbox in parallel immediately — user needs house-level coords
    console.log(`[Geocoding] Route: EXACT → Photon + Mapbox parallel`);
    mapboxPromise = fetchMapbox(normalized, currentBias, limit, effectiveSignal);
  } else {
    console.log(`[Geocoding] Route: ${intent} → Photon only (saving Mapbox credits)`);
  }

  const photonFeatures = await photonPromise;

  // For SIMPLE queries: if Photon returns a street/house type, upgrade via Mapbox
  if (intent === "SIMPLE" && photonFeatures.length > 0) {
    if (photonNeedsUpgrade(photonFeatures[0])) {
      console.log(`[Geocoding] Photon upgrade needed → firing Mapbox`);
      mapboxPromise = fetchMapbox(normalized, currentBias, limit, effectiveSignal);
    }
  }
  // TEXTUAL: never fire Mapbox — place names are precise enough from Photon

  const mapboxFeatures = await mapboxPromise;

  const photonResults = photonFeatures.map(photonToResult);
  const mapboxResults = mapboxFeatures.map(mapboxToResult);

  // Merge: Mapbox first (higher precision), then Photon
  const merged: GeoResult[] = [...mapboxResults, ...photonResults];
  const final = deduplicateResults(merged).slice(0, limit);

  cacheSet(cacheKey, final);

  return final;
}
