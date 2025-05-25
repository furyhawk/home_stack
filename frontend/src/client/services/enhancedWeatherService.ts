import { 
  WeatherGetTwoHourForecastResponse,
  WeatherGetAirTemperatureResponse,
  WeatherGetWindDirectionResponse,
  WeatherGetLightningResponse,
  WeatherGetWbgtResponse,
  WeatherGetTwentyFourHourForecastResponse,
  WeatherGetFourDayOutlookResponse,
  Forecast,
  AreaMetadata
} from '../types.gen';
import WeatherService from './weatherService';

/**
 * EnhancedWeatherService provides additional functionality on top of the base WeatherService
 * to make working with weather data easier in the application.
 */
export class EnhancedWeatherService {
  /**
   * Get the latest two-hour weather forecast with enhanced data processing
   * 
   * @param date Optional SGT date
   * @param paginationToken Optional pagination token
   * @returns Processed two-hour forecast data
   */
  static async getTwoHourForecast(
    date?: string, 
    paginationToken?: string
  ): Promise<WeatherGetTwoHourForecastResponse> {
    return await WeatherService.getTwoHourForecast(date, paginationToken);
  }

  /**
   * Get forecasts for a specific area
   * 
   * @param area The area name to filter by
   * @param date Optional SGT date
   * @returns Filtered forecast for the requested area or null if not found
   */
  static async getForecastByArea(area: string, date?: string): Promise<Forecast | null> {
    const response = await WeatherService.getTwoHourForecast(date);
    
    if (!response?.data?.items || response.data.items.length === 0) {
      return null;
    }
    
    const forecasts = response.data.items[0].forecasts;
    return forecasts.find(forecast => forecast.area === area) || null;
  }

  /**
   * Get a comprehensive weather dashboard with multiple data types
   * Combines 2-hour forecast, air temperature, and wind direction data
   * 
   * @returns Comprehensive weather data for dashboard display
   */
  static async getWeatherDashboard() {
    try {
      // Fetch data in parallel for better performance
      const [twoHourForecast, airTemperature, windDirection] = await Promise.all([
        WeatherService.getTwoHourForecast(),
        WeatherService.getAirTemperature(),
        WeatherService.getWindDirection()
      ]);
      
      return {
        twoHourForecast,
        airTemperature,
        windDirection,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      console.error('Error fetching weather dashboard data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get a 24-hour and 4-day combined forecast
   * Useful for displaying extended forecasts together
   * 
   * @returns Combined extended forecast data
   */
  static async getExtendedForecast() {
    try {
      // Fetch both forecast types in parallel
      const [twentyFourHour, fourDay] = await Promise.all([
        WeatherService.getTwentyFourHourForecast(),
        WeatherService.getFourDayOutlook()
      ]);
      
      return {
        twentyFourHour,
        fourDay,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      console.error('Error fetching extended forecast data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Merge area metadata with forecast data for easier consumption
   * 
   * @param forecasts List of forecasts
   * @param areaMetadata List of area metadata
   * @returns Forecasts with location data merged in
   */
  static mergeAreaMetadataWithForecasts(
    forecasts: Forecast[], 
    areaMetadata: AreaMetadata[]
  ) {
    return forecasts.map(forecast => {
      const metadata = areaMetadata.find(area => area.name === forecast.area);
      return {
        ...forecast,
        location: metadata?.label_location
      };
    });
  }

  /**
   * Get unique areas from forecast data
   * 
   * @param forecasts List of forecasts
   * @returns Array of unique area names
   */
  static getUniqueAreas(forecasts: Forecast[]): string[] {
    const areas = forecasts.map(f => f.area);
    return [...new Set(areas)].sort();
  }

  /**
   * Filter forecasts by a specific area
   * 
   * @param forecasts List of forecasts
   * @param area Area to filter by
   * @returns Filtered forecasts
   */
  static filterForecastsByArea(forecasts: Forecast[], area: string): Forecast[] {
    if (area === "All Areas") {
      return forecasts;
    }
    return forecasts.filter(forecast => forecast.area === area);
  }

  /**
   * Format datetime for consistent display
   * 
   * @param timestamp ISO timestamp string
   * @param options Formatting options
   * @returns Formatted date/time string
   */
  static formatDateTime(
    timestamp: string, 
    options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ): string {
    const date = new Date(timestamp);
    return date.toLocaleString([], options);
  }
}

export default EnhancedWeatherService;
