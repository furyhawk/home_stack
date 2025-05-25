import {
  weatherGetTwoHourForecast,
  weatherGetAirTemperature,
  weatherGetWindDirection,
  weatherGetLightning,
  weatherGetWbgt,
  weatherGetTwentyFourHourForecast,
  weatherGetFourDayOutlook,
  WeatherGetTwoHourForecastResponse,
  WeatherGetAirTemperatureResponse,
  WeatherGetWindDirectionResponse,
  WeatherGetLightningResponse,
  WeatherGetWbgtResponse,
  WeatherGetTwentyFourHourForecastResponse,
  WeatherGetFourDayOutlookResponse
} from '../sdk.gen';

/**
 * WeatherService provides an object-oriented interface to the weather-related APIs
 * from the Singapore NEA data through data.gov.sg.
 */
class WeatherService {
  /**
   * Get the latest two-hour weather forecast
   * - Updated half-hourly from NEA
   * - Forecasts are given for multiple areas in Singapore
   * 
   * @param date Optional SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with the two-hour forecast data
   */
  static async getTwoHourForecast(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetTwoHourForecastResponse> {
    const response = await weatherGetTwoHourForecast({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Get air temperature readings across Singapore
   * - Has per-minute readings from NEA
   * - Unit of measure for readings is °C
   * 
   * @param date Optional Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS (SGT)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with air temperature data
   */
  static async getAirTemperature(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetAirTemperatureResponse> {
    const response = await weatherGetAirTemperature({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Get wind direction readings across Singapore
   * - Has per-minute readings from NEA
   * - Unit of measure for readings is °
   * 
   * @param date Optional SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with wind direction data
   */
  static async getWindDirection(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetWindDirectionResponse> {
    const response = await weatherGetWindDirection({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Retrieve the latest lightning observation
   * - Updated multiple times throughout the day
   * 
   * @param date Optional SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with lightning data
   */
  static async getLightning(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetLightningResponse> {
    const response = await weatherGetLightning({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Retrieve the latest WBGT (Wet Bulb Globe Temperature) data for accurate heat stress assessment
   * - Updated multiple times throughout the day
   * - Unit of measure for readings is °C
   * 
   * @param date Optional SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with WBGT data
   */
  static async getWbgt(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetWbgtResponse> {
    const response = await weatherGetWbgt({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Retrieve the latest 24-hour weather forecast
   * - Updated multiple times throughout the day
   * - Provides forecasts for different areas of Singapore
   * 
   * @param date Optional SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with 24-hour forecast data
   */
  static async getTwentyFourHourForecast(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetTwentyFourHourForecastResponse> {
    const response = await weatherGetTwentyFourHourForecast({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }

  /**
   * Retrieve the latest 4-day weather forecast
   * - Updated twice a day from NEA
   * - The forecast is for the next 4 days
   * 
   * @param date Optional SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   * @param paginationToken Optional token for retrieving subsequent data pages
   * @returns Promise with 4-day forecast data
   */
  static async getFourDayOutlook(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetFourDayOutlookResponse> {
    const response = await weatherGetFourDayOutlook({
      query: {
        date: date || null,
        pagination_token: paginationToken || null
      }
    });
    return response;
  }
}

export default WeatherService;
