import {
  WeatherGetTwoHourForecastResponse,
  WeatherGetAirTemperatureResponse,
  WeatherGetWindDirectionResponse,
  WeatherGetLightningResponse,
  WeatherGetWbgtResponse,
  WeatherGetTwentyFourHourForecastResponse,
  WeatherGetFourDayOutlookResponse,
  Forecast,
  AreaMetadata,
  ForecastPeriod,
} from "../types.gen"
import WeatherService from "./weatherService"

/**
 * Weather forecast types
 */
export enum ForecastType {
  TwoHour = "two-hour",
  TwentyFourHour = "twenty-four-hour",
  FourDay = "four-day",
}

/**
 * Weather data types
 */
export enum WeatherDataType {
  AirTemperature = "air-temperature",
  WindDirection = "wind-direction",
  Lightning = "lightning",
  WBGT = "wbgt",
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
 * Result of a weather data fetch operation
 */
export interface WeatherResult<T> {
  data: T | null
  success: boolean
  error?: string
  isNoDataAvailable?: boolean
  timestamp: string
}

/**
 * WeatherHub provides a unified interface to all weather services
 * with advanced functionality, error handling, and utilities.
 */
export class WeatherHub {
  /**
   * Get weather forecast by type
   *
   * @param type The type of forecast to retrieve
   * @param date Optional SGT date
   * @param paginationToken Optional pagination token
   * @returns Promise with the requested forecast data
   */
  static async getForecast(
    type: ForecastType,
    date?: string,
    paginationToken?: string,
  ): Promise<
    WeatherResult<
      | WeatherGetTwoHourForecastResponse
      | WeatherGetTwentyFourHourForecastResponse
      | WeatherGetFourDayOutlookResponse
    >
  > {
    try {
      let data = null

      switch (type) {
        case ForecastType.TwoHour:
          data = await WeatherService.getTwoHourForecast(date, paginationToken)
          break
        case ForecastType.TwentyFourHour:
          data = await WeatherService.getTwentyFourHourForecast(
            date,
            paginationToken,
          )
          break
        case ForecastType.FourDay:
          data = await WeatherService.getFourDayOutlook(date, paginationToken)
          break
      }

      // Check if there is actually data in the response
      const hasData =
        data &&
        ((data.data?.items && data.data.items.length > 0) ||
          (data.data?.records && data.data.records.length > 0))

      if (!hasData) {
        return {
          data,
          success: false,
          error: "No weather forecast data available at this time.",
          isNoDataAvailable: true,
          timestamp: new Date().toISOString(),
        }
      }

      return {
        data,
        success: true,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error fetching ${type} forecast:`, error)

      // Check if this is a "no data available" error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      const isNoDataAvailable =
        (error instanceof Error &&
          error.message.toLowerCase().includes("no data available")) ||
        (error instanceof Error &&
          error.name === "ApiError" &&
          typeof error === "object" &&
          error !== null &&
          "isNoDataAvailable" in error &&
          Boolean(error.isNoDataAvailable))

      return {
        data: null,
        success: false,
        error: errorMessage,
        isNoDataAvailable,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Get weather data by type
   *
   * @param type The type of weather data to retrieve
   * @param date Optional SGT date
   * @param paginationToken Optional pagination token
   * @returns Promise with the requested weather data
   */
  static async getWeatherData(
    type: WeatherDataType,
    date?: string,
    paginationToken?: string,
  ): Promise<
    WeatherResult<
      | WeatherGetAirTemperatureResponse
      | WeatherGetWindDirectionResponse
      | WeatherGetLightningResponse
      | WeatherGetWbgtResponse
    >
  > {
    try {
      let data = null

      switch (type) {
        case WeatherDataType.AirTemperature:
          data = await WeatherService.getAirTemperature(date, paginationToken)
          break
        case WeatherDataType.WindDirection:
          data = await WeatherService.getWindDirection(date, paginationToken)
          break
        case WeatherDataType.Lightning:
          data = await WeatherService.getLightning(date, paginationToken)
          break
        case WeatherDataType.WBGT:
          data = await WeatherService.getWbgt(date, paginationToken)
          break
      }

      // Check if there is actually data in the response
      const hasData =
        data &&
        ((data.data?.readings && data.data.readings.length > 0) ||
          (data.data?.items && data.data.items.length > 0))

      if (!hasData) {
        return {
          data,
          success: false,
          error: "No weather data available at this time.",
          isNoDataAvailable: true,
          timestamp: new Date().toISOString(),
        }
      }

      return {
        data,
        success: true,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error)

      // Check if this is a "no data available" error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      const isNoDataAvailable =
        (error instanceof Error &&
          error.message.toLowerCase().includes("no data available")) ||
        (error instanceof Error &&
          error.name === "ApiError" &&
          typeof error === "object" &&
          error !== null &&
          "isNoDataAvailable" in error &&
          Boolean(error.isNoDataAvailable))

      return {
        data: null,
        success: false,
        error: errorMessage,
        isNoDataAvailable,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Get a comprehensive weather dashboard with multiple data types
   *
   * @returns Comprehensive weather data for dashboard display
   */
  static async getWeatherDashboard() {
    try {
      // Fetch data in parallel for better performance
      const [twoHourResult, airTempResult, windDirectionResult] =
        await Promise.all([
          this.getForecast(ForecastType.TwoHour),
          this.getWeatherData(WeatherDataType.AirTemperature),
          this.getWeatherData(WeatherDataType.WindDirection),
        ])

      // Check if any of the requests failed
      if (
        !twoHourResult.success ||
        !airTempResult.success ||
        !windDirectionResult.success
      ) {
        const errors = [
          twoHourResult.error,
          airTempResult.error,
          windDirectionResult.error,
        ]
          .filter(Boolean)
          .join(", ")

        return {
          success: false,
          error: `Failed to fetch some weather data: ${errors}`,
          timestamp: new Date().toISOString(),
          partialData: {
            twoHourForecast: twoHourResult.data,
            airTemperature: airTempResult.data,
            windDirection: windDirectionResult.data,
          },
        }
      }

      return {
        twoHourForecast: twoHourResult.data,
        airTemperature: airTempResult.data,
        windDirection: windDirectionResult.data,
        timestamp: new Date().toISOString(),
        success: true,
      }
    } catch (error) {
      console.error("Error fetching weather dashboard data:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Merge area metadata with forecast data
   *
   * @param forecasts Array of forecasts
   * @param areaMetadata Array of area metadata
   * @returns Forecasts with location data
   */
  static mergeLocationData(
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
   * Filter forecasts by area
   *
   * @param forecasts Array of forecasts
   * @param area Area to filter by (or "All Areas" for no filtering)
   * @returns Filtered forecasts
   */
  static filterByArea(forecasts: Forecast[], area: string): Forecast[] {
    if (!area || area === "All Areas") {
      return forecasts
    }
    return forecasts.filter((forecast) => forecast.area === area)
  }

  /**
   * Get all unique areas from forecast data
   *
   * @param forecasts Array of forecasts
   * @param includeAllAreas Whether to include an "All Areas" option
   * @returns Array of unique area names
   */
  static getUniqueAreas(
    forecasts: Forecast[],
    includeAllAreas: boolean = true,
  ): string[] {
    const areas = [...new Set(forecasts.map((f) => f.area))].sort()
    return includeAllAreas ? ["All Areas", ...areas] : areas
  }

  /**
   * Format a date for display
   *
   * @param timestamp ISO timestamp string
   * @param options Formatting options
   * @returns Formatted date string
   */
  static formatDate(
    timestamp: string,
    options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ): string {
    const date = new Date(timestamp)
    return date.toLocaleString([], options)
  }

  /**
   * Format a forecast period for display
   *
   * @param period Forecast period
   * @returns Formatted period string
   */
  static formatForecastPeriod(period: ForecastPeriod): string {
    const start = this.formatDate(period.start, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    const end = this.formatDate(period.end, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    return `${start} - ${end}`
  }
}

export default WeatherHub
