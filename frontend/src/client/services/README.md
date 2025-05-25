# Weather Services

This directory contains service classes for interacting with the weather API.

## Available Services

### WeatherService

`WeatherService` provides basic wrappers around the generated API functions. It provides a cleaner interface to make API calls to the weather endpoints.

```typescript
import { WeatherService } from '@/client';

// Get two-hour forecast
const forecast = await WeatherService.getTwoHourForecast();

// Get air temperature with a specific date
const temperature = await WeatherService.getAirTemperature('2025-05-25');

// Get 24-hour forecast with pagination
const forecast24h = await WeatherService.getTwentyFourHourForecast(undefined, 'pagination-token');
```

### EnhancedWeatherService

`EnhancedWeatherService` provides additional functionality on top of the base `WeatherService` to make working with weather data easier.

```typescript
import { EnhancedWeatherService } from '@/client';

// Get weather dashboard with multiple data types
const dashboard = await EnhancedWeatherService.getWeatherDashboard();

// Get forecast for a specific area
const areaForecast = await EnhancedWeatherService.getForecastByArea('Changi');

// Get extended forecast (24-hour and 4-day)
const extendedForecast = await EnhancedWeatherService.getExtendedForecast();

// Format a date for display
const formattedDate = EnhancedWeatherService.formatDateTime('2025-05-25T14:30:00Z');
```

### WeatherHub

`WeatherHub` provides a unified interface to all weather services with advanced functionality, error handling, and utilities.

```typescript
import { WeatherHub, ForecastType, WeatherDataType } from '@/client';

// Get forecast by type
const forecast = await WeatherHub.getForecast(ForecastType.TwoHour);

// Get weather data by type
const temperature = await WeatherHub.getWeatherData(WeatherDataType.AirTemperature);

// Get comprehensive dashboard
const dashboard = await WeatherHub.getWeatherDashboard();

// Utility functions
const forecastsWithLocation = WeatherHub.mergeLocationData(forecasts, areaMetadata);
const filteredForecasts = WeatherHub.filterByArea(forecasts, 'Changi');
const areas = WeatherHub.getUniqueAreas(forecasts);
const formattedPeriod = WeatherHub.formatForecastPeriod(validPeriod);
```

### WeatherUtils

`WeatherUtils` provides standalone utility functions for working with weather data.

```typescript
import { WeatherUtils } from '@/client';

// Categorize weather forecast
const category = WeatherUtils.categorizeWeatherForecast('Partly Cloudy');

// Extract data from API response
const forecasts = WeatherUtils.extractForecasts(response);
const validPeriod = WeatherUtils.extractValidPeriod(response);
const areaMetadata = WeatherUtils.extractAreaMetadata(response);

// Process forecast data
const forecastsWithLocation = WeatherUtils.mergeLocationData(forecasts, areaMetadata);
const filteredForecasts = WeatherUtils.filterForecastsByArea(forecasts, 'Changi');
const uniqueAreas = WeatherUtils.getUniqueAreas(forecasts);
const mostCommonForecast = WeatherUtils.getMostCommonForecast(forecasts);

// Format dates and periods
const formattedDate = WeatherUtils.formatDate('2025-05-25T14:30:00Z');
const formattedPeriod = WeatherUtils.formatForecastPeriod(validPeriod);

// Get forecasts by category
const forecastsByCategory = WeatherUtils.getForecastsByCategory(forecasts);

// Calculate weather statistics for dashboards
const stats = WeatherUtils.calculateWeatherStatistics(forecasts);
```

## Usage with React Query

These services are designed to work well with React Query. Here's an example:

```typescript
import { useQuery } from '@tanstack/react-query';
import { WeatherHub, ForecastType } from '@/client';

function TwoHourForecast() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', 'two-hour-forecast'],
    queryFn: () => WeatherHub.getForecast(ForecastType.TwoHour),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });

  // Process and render the data
}
```

## Examples

Check out the `demo.ts` file for more detailed examples of how to use these services.

## Available Routes

The following routes demonstrate how to use these services:

- `/_layout/weather` - Basic weather display using WeatherService
- `/_layout/weatherHub` - Enhanced weather display using WeatherHub
- `/_layout/weatherDashboard` - Comprehensive weather dashboard with multiple data types
