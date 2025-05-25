import {
  Forecast,
  ForecastPeriod,
  AreaMetadata,
  WeatherResponse,
} from "../client/types.gen"

/**
 * Weather forecast category
 */
export enum WeatherCategory {
  Sunny = "SUNNY",
  Cloudy = "CLOUDY",
  Rainy = "RAINY",
  Thundery = "THUNDERY",
  Windy = "WINDY",
  Misc = "MISC",
}

/**
 * Weather forecast with location data
 */
export interface ForecastWithLocation extends Forecast {
  location?: {
    latitude: number
    longitude: number
  }
}

/**
 * Categorizes a forecast by its description
 */
export function categorizeWeatherForecast(forecast: string): WeatherCategory {
  const lowercaseForecast = forecast.toLowerCase()

  if (
    lowercaseForecast.includes("fair") ||
    lowercaseForecast.includes("sunny")
  ) {
    return WeatherCategory.Sunny
  }

  if (lowercaseForecast.includes("thunder")) {
    return WeatherCategory.Thundery
  }

  if (
    lowercaseForecast.includes("rain") ||
    lowercaseForecast.includes("shower") ||
    lowercaseForecast.includes("drizzle")
  ) {
    return WeatherCategory.Rainy
  }

  if (
    lowercaseForecast.includes("cloudy") ||
    lowercaseForecast.includes("overcast") ||
    lowercaseForecast.includes("hazy")
  ) {
    return WeatherCategory.Cloudy
  }

  if (
    lowercaseForecast.includes("wind") ||
    lowercaseForecast.includes("gust")
  ) {
    return WeatherCategory.Windy
  }

  return WeatherCategory.Misc
}

/**
 * Extract forecasts from the weather response
 */
export function extractForecasts(
  response: WeatherResponse | null | undefined,
): Forecast[] {
  if (!response?.data?.items || response.data.items.length === 0) {
    return []
  }
  return response.data.items[0].forecasts || []
}

/**
 * Extract valid period from the weather response
 */
export function extractValidPeriod(
  response: WeatherResponse | null | undefined,
): ForecastPeriod | null {
  if (!response?.data?.items || response.data.items.length === 0) {
    return null
  }
  return response.data.items[0].valid_period || null
}

/**
 * Extract area metadata from the weather response
 */
export function extractAreaMetadata(
  response: WeatherResponse | null | undefined,
): AreaMetadata[] {
  if (!response?.data?.area_metadata) {
    return []
  }
  return response.data.area_metadata
}

/**
 * Merge location data with forecasts
 */
export function mergeLocationData(
  forecasts: Forecast[],
  areaMetadata: AreaMetadata[],
): ForecastWithLocation[] {
  return forecasts.map((forecast) => {
    const metadata = areaMetadata.find((area) => area.name === forecast.area)
    return {
      ...forecast,
      location: metadata?.label_location,
    }
  })
}

/**
 * Filter forecasts by a specific area
 */
export function filterForecastsByArea(
  forecasts: Forecast[],
  area: string,
): Forecast[] {
  if (!area || area === "All Areas") {
    return forecasts
  }
  return forecasts.filter((forecast) => forecast.area === area)
}

/**
 * Get unique areas from forecast data
 */
export function getUniqueAreas(
  forecasts: Forecast[],
  includeAllAreas: boolean = true,
): string[] {
  const areas = [...new Set(forecasts.map((f) => f.area))].sort()
  return includeAllAreas ? ["All Areas", ...areas] : areas
}

/**
 * Get most common forecast from forecast data
 */
export function getMostCommonForecast(
  forecasts: Forecast[],
): { forecast: string; count: number } | null {
  if (forecasts.length === 0) {
    return null
  }

  const counts: Record<string, number> = {}

  for (const forecast of forecasts) {
    counts[forecast.forecast] = (counts[forecast.forecast] || 0) + 1
  }

  const entries = Object.entries(counts)
  if (entries.length === 0) {
    return null
  }

  const mostCommon = entries.sort((a, b) => b[1] - a[1])[0]
  return { forecast: mostCommon[0], count: mostCommon[1] }
}

/**
 * Format a date for display
 */
export function formatDate(
  timestamp: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  return date.toLocaleString([], options)
}

/**
 * Format a forecast period for display
 */
export function formatForecastPeriod(period: ForecastPeriod): string {
  const start = formatDate(period.start, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  const end = formatDate(period.end, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  return `${start} - ${end}`
}

/**
 * Get forecasts grouped by category
 */
export function getForecastsByCategory(
  forecasts: Forecast[],
): Record<WeatherCategory, Forecast[]> {
  const result: Record<WeatherCategory, Forecast[]> = {
    [WeatherCategory.Sunny]: [],
    [WeatherCategory.Cloudy]: [],
    [WeatherCategory.Rainy]: [],
    [WeatherCategory.Thundery]: [],
    [WeatherCategory.Windy]: [],
    [WeatherCategory.Misc]: [],
  }

  for (const forecast of forecasts) {
    const category = categorizeWeatherForecast(forecast.forecast)
    result[category].push(forecast)
  }

  return result
}

/**
 * Calculate weather statistics for dashboard display
 */
export function calculateWeatherStatistics(forecasts: Forecast[]) {
  const forecastsByCategory = getForecastsByCategory(forecasts)
  const totalForecasts = forecasts.length

  // Calculate percentages for each category
  const categoryStats = Object.entries(forecastsByCategory).map(
    ([category, forecasts]) => ({
      category: category as WeatherCategory,
      count: forecasts.length,
      percentage:
        totalForecasts > 0 ? (forecasts.length / totalForecasts) * 100 : 0,
    }),
  )

  // Get most common forecast
  const mostCommon = getMostCommonForecast(forecasts)

  return {
    totalAreas: totalForecasts,
    categoryStats,
    mostCommon,
    byCategory: forecastsByCategory,
  }
}
