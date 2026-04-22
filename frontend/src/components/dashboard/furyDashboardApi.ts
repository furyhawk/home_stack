import axios from "axios"

const furyApi = axios.create({
  baseURL: "/fury-api",
  timeout: 15_000,
})

export const DAY_IN_MS = 24 * 60 * 60 * 1000

export type FuryRange = "24h" | "1w" | "1m" | "3m" | "1y" | "3y"

export const rangeToMultiplier: Record<FuryRange, number> = {
  "24h": 1,
  "1w": 7,
  "1m": 30,
  "3m": 90,
  "1y": 365,
  "3y": 365 * 3,
}

const metricConfig = {
  humidity: {
    description: "Indoor moisture trend",
    field: "humidity",
    label: "Humidity",
    path: "/humidity/search",
    unit: "%",
  },
  pressure: {
    description: "Barometric pressure trend",
    field: "pressure",
    label: "Pressure",
    path: "/pressure/search",
    unit: "hPa",
  },
  temperature: {
    description: "Ambient temperature trend",
    field: "temperature",
    label: "Temperature",
    path: "/temperature/search",
    unit: "C",
  },
} as const

export type FuryMetricKey = keyof typeof metricConfig

type MetricField = (typeof metricConfig)[FuryMetricKey]["field"]

interface FuryApiItem {
  id: number
  humidity?: string
  pressure?: string
  temperature?: string
  update_time: string
}

export interface FuryReading {
  id: number
  rawValue: string
  updateTime: string
  value: number
}

interface FurySummary {
  average: number | null
  count: number
  max: number | null
  min: number | null
}

export interface FuryMetricSnapshot {
  description: string
  key: FuryMetricKey
  label: string
  latest: FuryReading | null
  previous: FuryReading | null
  readings: FuryReading[]
  summary: FurySummary
  // total number of items fetched from the upstream API (before client-side filtering)
  totalFetched?: number
  unit: string
}

export interface FuryRecentSample {
  humidity: string | null
  pressure: string | null
  temperature: string | null
  updateTime: string
}

export interface FuryDashboardData {
  generatedAt: string
  metrics: Record<FuryMetricKey, FuryMetricSnapshot>
  recentSamples: FuryRecentSample[]
}

const parseMeasurement = (rawValue: string) => {
  const match = rawValue.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : Number.NaN
}

const calculateSummary = (readings: FuryReading[], sinceMs: number) => {
  const since = Date.now() - sinceMs
  const recentValues = readings
    .filter((reading) => new Date(reading.updateTime).getTime() >= since)
    .map((reading) => reading.value)
    .filter((value) => Number.isFinite(value))

  if (recentValues.length === 0) {
    return {
      average: null,
      count: 0,
      max: null,
      min: null,
    }
  }

  const total = recentValues.reduce((sum, value) => sum + value, 0)

  return {
    average: total / recentValues.length,
    count: recentValues.length,
    max: Math.max(...recentValues),
    min: Math.min(...recentValues),
  }
}

const toReadings = (items: FuryApiItem[], field: MetricField) => {
  return items
    .map((item) => {
      const rawValue = item[field]

      if (!rawValue) {
        return null
      }

      return {
        id: item.id,
        rawValue,
        updateTime: item.update_time,
        value: parseMeasurement(rawValue),
      }
    })
    .filter((item): item is FuryReading => item !== null)
}

// Per-metric cache so frequent refreshes (60s) only fetch the latest samples
// and reuse previously fetched data for the rest of the range.
const metricCache: Partial<Record<FuryMetricKey, { items: FuryApiItem[]; lastFetchMs: number }>> = {}

const fetchMetric = async <TMetricKey extends FuryMetricKey>(
  metric: TMetricKey,
  summarySinceMs = DAY_IN_MS,
): Promise<FuryMetricSnapshot> => {
  const config = metricConfig[metric]

  const endMs = Date.now()
  const startMs = Math.max(0, endMs - summarySinceMs)

  // batch size: daily for short ranges, weekly for longer ranges
  const batchMs = summarySinceMs <= DAY_IN_MS * 7 ? DAY_IN_MS : DAY_IN_MS * 7
  const maxIterations = 200

  const cache = metricCache[metric] ?? { items: [], lastFetchMs: 0 }

  const allItems: FuryApiItem[] = []

  // If we have a recent cache (within the last 90s), perform an incremental
  // fetch only for the window since the last cached timestamp. Otherwise
  // perform a full batched fetch for the requested range.
  const now = endMs
  const lastFetchMs = cache.lastFetchMs || 0
  const recentThreshold = 90_000

  if (cache.items.length > 0 && now - lastFetchMs <= recentThreshold) {
    // incremental fetch from lastFetchMs -> now
    try {
      const params = {
        start_date: new Date(lastFetchMs).toISOString(),
        end_date: new Date(now).toISOString(),
        limit: 1000,
      }
      const response = await furyApi.get<FuryApiItem[]>(config.path, { params })
      if (response.data && response.data.length > 0) {
        // merge and dedupe by id
        const map = new Map<number, FuryApiItem>()
        for (const it of cache.items) map.set(it.id, it)
        for (const it of response.data) map.set(it.id, it)
        allItems.push(...Array.from(map.values()))
      } else {
        allItems.push(...cache.items)
      }
      cache.lastFetchMs = now
    } catch (err) {
      // on failure, fall back to cached items
      allItems.push(...cache.items)
    }
  } else {
    // full batched fetch over the requested range
    let currentEndMs = endMs
    let iterations = 0

    while (currentEndMs > startMs && iterations < maxIterations) {
      const currentStartMs = Math.max(startMs, currentEndMs - batchMs)
      const params = {
        start_date: new Date(currentStartMs).toISOString(),
        end_date: new Date(currentEndMs).toISOString(),
        limit: 1000,
      }

      try {
        const response = await furyApi.get<FuryApiItem[]>(config.path, { params })
        if (response.data && response.data.length > 0) {
          allItems.push(...response.data)
        }
      } catch (err) {
        break
      }

      currentEndMs = currentStartMs
      iterations += 1
    }

    // update cache with full fetch
    cache.items = allItems.slice()
    cache.lastFetchMs = now
  }

  // ensure cache stored
  metricCache[metric] = cache

  // normalize, convert and sort
  const readings = toReadings(allItems.length ? allItems : cache.items, config.field).sort(
    (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime(),
  )

  // client-side filter to the requested start time in case upstream ignored params
  const filteredReadings = readings.filter((r) => new Date(r.updateTime).getTime() >= startMs)

  return {
    description: config.description,
    key: metric,
    label: config.label,
    latest: filteredReadings[0] ?? null,
    previous: filteredReadings[1] ?? null,
    readings: filteredReadings,
    totalFetched: (allItems.length ? allItems.length : cache.items.length) || 0,
    summary: calculateSummary(filteredReadings, summarySinceMs),
    unit: config.unit,
  }
}

const buildRecentSamples = (
  temperature: FuryReading[],
  humidity: FuryReading[],
  pressure: FuryReading[],
) => {
  const sampleCount = Math.min(temperature.length, humidity.length, pressure.length, 8)

  return Array.from({ length: sampleCount }, (_, index) => ({
    humidity: humidity[index]?.rawValue ?? null,
    pressure: pressure[index]?.rawValue ?? null,
    temperature: temperature[index]?.rawValue ?? null,
    updateTime:
      temperature[index]?.updateTime ||
      humidity[index]?.updateTime ||
      pressure[index]?.updateTime ||
      new Date().toISOString(),
  }))
}

export const fetchFuryDashboard = async (
  range: FuryRange = "24h",
): Promise<FuryDashboardData> => {
  const multiplier = rangeToMultiplier[range] ?? 1
  const summarySinceMs = DAY_IN_MS * multiplier

  const [temperature, humidity, pressure] = await Promise.all([
    fetchMetric("temperature", summarySinceMs),
    fetchMetric("humidity", summarySinceMs),
    fetchMetric("pressure", summarySinceMs),
  ])

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      humidity,
      pressure,
      temperature,
    },
    recentSamples: buildRecentSamples(
      temperature.readings,
      humidity.readings,
      pressure.readings,
    ),
  }
}