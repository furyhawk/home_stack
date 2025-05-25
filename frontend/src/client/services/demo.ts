/**
 * This file contains examples of how to use the various weather services.
 * It is not meant to be imported or used directly, but rather as a reference.
 */

import {
  WeatherService,
  EnhancedWeatherService,
  WeatherHub,
  ForecastType,
  WeatherDataType,
} from "@/client"

// Example 1: Basic usage of WeatherService
async function basicWeatherServiceExample() {
  try {
    // Get two-hour forecast
    const twoHourForecast = await WeatherService.getTwoHourForecast()
    console.log("Two-hour forecast:", twoHourForecast)

    // Get air temperature with a specific date
    const date = "2025-05-25"
    const airTemperature = await WeatherService.getAirTemperature(date)
    console.log("Air temperature for", date, ":", airTemperature)

    // Get wind direction with pagination
    const windDirection = await WeatherService.getWindDirection(
      undefined,
      "some-pagination-token",
    )
    console.log("Wind direction with pagination:", windDirection)
  } catch (error) {
    console.error("Error in basic example:", error)
  }
}

// Example 2: Using EnhancedWeatherService for additional functionality
async function enhancedWeatherServiceExample() {
  try {
    // Get weather dashboard with multiple data types
    const dashboard = await EnhancedWeatherService.getWeatherDashboard()
    console.log("Weather dashboard:", dashboard)

    // Get forecast for a specific area
    const areaForecast =
      await EnhancedWeatherService.getForecastByArea("Changi")
    console.log("Changi forecast:", areaForecast)

    // Get extended forecast (24-hour and 4-day)
    const extendedForecast = await EnhancedWeatherService.getExtendedForecast()
    console.log("Extended forecast:", extendedForecast)

    // Format a date for display
    const formattedDate = EnhancedWeatherService.formatDateTime(
      "2025-05-25T14:30:00Z",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    )
    console.log("Formatted date:", formattedDate)
  } catch (error) {
    console.error("Error in enhanced example:", error)
  }
}

// Example 3: Using WeatherHub for comprehensive operations
async function weatherHubExample() {
  try {
    // Get forecast by type
    const twoHourForecast = await WeatherHub.getForecast(ForecastType.TwoHour)
    console.log("Two-hour forecast via Hub:", twoHourForecast)

    // Get weather data by type
    const airTemperature = await WeatherHub.getWeatherData(
      WeatherDataType.AirTemperature,
    )
    console.log("Air temperature via Hub:", airTemperature)

    // Get comprehensive dashboard
    const dashboard = await WeatherHub.getWeatherDashboard()
    console.log("Dashboard via Hub:", dashboard)

    // Using the formatting utilities
    if (twoHourForecast.success && twoHourForecast.data?.data?.items) {
      const forecastItem = twoHourForecast.data.data.items[0]
      const forecasts = forecastItem.forecasts
      const validPeriod = forecastItem.valid_period
      const areaMetadata = twoHourForecast.data.data.area_metadata || []

      // Merge location data
      const forecastsWithLocation = WeatherHub.mergeLocationData(
        forecasts,
        areaMetadata,
      )
      console.log("Forecasts with location:", forecastsWithLocation)

      // Filter by area
      const filteredForecasts = WeatherHub.filterByArea(forecasts, "Changi")
      console.log("Filtered forecasts for Changi:", filteredForecasts)

      // Get unique areas
      const areas = WeatherHub.getUniqueAreas(forecasts)
      console.log("Unique areas:", areas)

      // Format forecast period
      const formattedPeriod = WeatherHub.formatForecastPeriod(validPeriod)
      console.log("Formatted period:", formattedPeriod)
    }
  } catch (error) {
    console.error("Error in hub example:", error)
  }
}

// Examples of how to use these services in React components

/**
 * Example using React Query with WeatherService:
 *
 * import { useQuery } from '@tanstack/react-query';
 * import { WeatherService } from '@/client';
 *
 * function TwoHourForecast() {
 *   const { data, isLoading, error, refetch } = useQuery({
 *     queryKey: ['weather', 'two-hour-forecast'],
 *     queryFn: () => WeatherService.getTwoHourForecast(),
 *     refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
 *     staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error loading forecast</div>;
 *
 *   return (
 *     <div>
 *       <h2>Two-Hour Forecast</h2>
 *       {data?.data?.items?.map(item => (
 *         <div key={item.timestamp}>
 *           <p>Valid: {item.valid_period.start} to {item.valid_period.end}</p>
 *           <ul>
 *             {item.forecasts.map(forecast => (
 *               <li key={forecast.area}>{forecast.area}: {forecast.forecast}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       ))}
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 */

/**
 * Example using React Query with WeatherHub:
 *
 * import { useQuery } from '@tanstack/react-query';
 * import { WeatherHub, ForecastType } from '@/client';
 *
 * function WeatherDashboard() {
 *   const { data, isLoading, error, refetch } = useQuery({
 *     queryKey: ['weather', 'dashboard'],
 *     queryFn: () => WeatherHub.getWeatherDashboard(),
 *     refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
 *     staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
 *   });
 *
 *   if (isLoading) return <div>Loading dashboard...</div>;
 *   if (error) return <div>Error loading dashboard</div>;
 *   if (!data?.success) return <div>Failed to load some weather data: {data?.error}</div>;
 *
 *   // Process two-hour forecast data
 *   const twoHourForecast = data.twoHourForecast?.data?.items?.[0];
 *   const forecasts = twoHourForecast?.forecasts || [];
 *   const validPeriod = twoHourForecast?.valid_period;
 *   const areaMetadata = data.twoHourForecast?.data?.area_metadata || [];
 *
 *   // Get forecasts with location data
 *   const forecastsWithLocation = WeatherHub.mergeLocationData(forecasts, areaMetadata);
 *
 *   // Get temperature data
 *   const temperatures = data.airTemperature?.data?.readings || [];
 *
 *   return (
 *     <div>
 *       <h2>Weather Dashboard</h2>
 *
 *       {validPeriod && (
 *         <div>
 *           <h3>Forecast Period</h3>
 *           <p>{WeatherHub.formatForecastPeriod(validPeriod)}</p>
 *         </div>
 *       )}
 *
 *       <div>
 *         <h3>Forecasts</h3>
 *         <ul>
 *           {forecastsWithLocation.map(forecast => (
 *             <li key={forecast.area}>
 *               {forecast.area}: {forecast.forecast}
 *               {forecast.location && ` (${forecast.location.latitude}, ${forecast.location.longitude})`}
 *             </li>
 *           ))}
 *         </ul>
 *       </div>
 *
 *       <div>
 *         <h3>Temperatures</h3>
 *         <ul>
 *           {temperatures.map(reading => (
 *             <li key={reading.station_id}>
 *               {reading.station_id}: {reading.value}°C
 *             </li>
 *           ))}
 *         </ul>
 *       </div>
 *
 *       <button onClick={() => refetch()}>Refresh Dashboard</button>
 *     </div>
 *   );
 * }
 */
