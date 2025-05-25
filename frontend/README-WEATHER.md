# Weather Services and Components

This directory contains a suite of modern, well-structured services for accessing weather data from the Singapore NEA data through the data.gov.sg API.

## Available Services

### 1. Basic Service Layer

`WeatherService` - A straightforward wrapper around API endpoints for easy access to weather data.

### 2. Enhanced Service Layer

`EnhancedWeatherService` - Provides additional functionality for common weather data operations.

### 3. Comprehensive Service Hub

`WeatherHub` - A unified interface with robust error handling and advanced features.

### 4. Utility Functions

`WeatherUtils` - Standalone utility functions for processing and displaying weather data.

## Demo Components

### Weather Component (`/_layout/weather`)

The original weather component that uses the basic `WeatherService`.

### WeatherHub Component (`/_layout/weatherHub`)

An upgraded version that uses the more robust `WeatherHub` service.

### Weather Dashboard (`/_layout/weatherDashboard`)

A comprehensive dashboard that shows multiple weather data types in a tabbed interface:
- 2-Hour Forecast with map and grid views
- Current conditions including temperature and wind readings
- 24-Hour Outlook with detailed information

### Weather Statistics (`/_layout/weatherStats`)

A focused component that uses `WeatherUtils` to provide statistical analysis of the weather data:
- Distribution of weather conditions across Singapore
- Weather categorization and summaries
- Most common forecasts

## Getting Started

1. Import the services you need:

```typescript
import { 
  WeatherService,
  EnhancedWeatherService,
  WeatherHub,
  ForecastType,
  WeatherDataType,
  WeatherUtils 
} from '@/client';
```

2. Use with React Query:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["weather", "dashboard"],
  queryFn: () => WeatherHub.getWeatherDashboard(),
  refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
});
```

3. Process the data using utility functions:

```typescript
// Extract forecasts using utilities
const forecasts = WeatherUtils.extractForecasts(data);
const stats = WeatherUtils.calculateWeatherStatistics(forecasts);
```

4. See the example components for detailed implementation patterns.

## Documentation

For more information, refer to:

- `README.md` in the services directory
- `demo.ts` for code examples
- The example components in the routes directory
