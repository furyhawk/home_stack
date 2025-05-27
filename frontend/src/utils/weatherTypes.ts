// Weather type utilities to work with the generic WeatherResponse
import type { WeatherGetTwoHourForecastResponse, AreaMetadata } from '@/client/types.gen'

// Define the proper structure for two-hour forecast data
export interface TwoHourForecastData {
  area_metadata: AreaMetadata[]
  items: TwoHourForecastItem[]
  paginationToken?: string | null
}

export interface TwoHourForecastItem {
  update_timestamp: string
  timestamp: string
  valid_period: ForecastPeriod
  forecasts: Forecast[]
}

export interface ForecastPeriod {
  start: string
  end: string
  text: string
}

export interface Forecast {
  area: string
  forecast: string
}

// Type guard to check if the response has the expected structure
export function isTwoHourForecastData(data: unknown): data is TwoHourForecastData {
  if (!data || typeof data !== 'object') return false
  
  const d = data as any
  return (
    Array.isArray(d.area_metadata) &&
    Array.isArray(d.items) &&
    d.items.length > 0 &&
    d.items[0].forecasts &&
    Array.isArray(d.items[0].forecasts)
  )
}

// Type assertion utility
export function assertTwoHourForecastResponse(
  response: WeatherGetTwoHourForecastResponse
): TwoHourForecastData | null {
  if (!response?.data || !isTwoHourForecastData(response.data)) {
    return null
  }
  return response.data as TwoHourForecastData
}
