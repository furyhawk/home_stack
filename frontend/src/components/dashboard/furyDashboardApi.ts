import axios from "axios"

const furyApi = axios.create({
  baseURL: "/fury-api",
  timeout: 15_000,
})

const SENSOR_LIMIT = 288
const DAY_IN_MS = 24 * 60 * 60 * 1000

export type FuryRange = "24h" | "1w" | "1m" | "3m" | "1y" | "3y"

const rangeToMultiplier: Record<FuryRange, number> = {
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

const fetchMetric = async <TMetricKey extends FuryMetricKey>(
  metric: TMetricKey,
  limit = SENSOR_LIMIT,
  summarySinceMs = DAY_IN_MS,
): Promise<FuryMetricSnapshot> => {
  const config = metricConfig[metric]
  const response = await furyApi.get<FuryApiItem[]>(config.path, {
    params: { limit },
  })
  const readings = toReadings(response.data, config.field)

  return {
    description: config.description,
    key: metric,
    label: config.label,
    latest: readings[0] ?? null,
    previous: readings[1] ?? null,
    readings,
    summary: calculateSummary(readings, summarySinceMs),
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
  const limit = Math.max(1, Math.floor(SENSOR_LIMIT * multiplier))
  const summarySinceMs = DAY_IN_MS * multiplier

  const [temperature, humidity, pressure] = await Promise.all([
    fetchMetric("temperature", limit, summarySinceMs),
    fetchMetric("humidity", limit, summarySinceMs),
    fetchMetric("pressure", limit, summarySinceMs),
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