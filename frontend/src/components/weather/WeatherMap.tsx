import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-overrides.css';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';
import { MapInvalidator, MapCenter } from './MapComponents';

type ApiNestedResponse<P> = { data?: P };

interface AirTempStation { id: string; deviceId: string; name: string; location: { latitude: number; longitude: number; }; }
interface AirTempDataPoint { stationId: string; value: number; }
interface AirTempReading { timestamp: string; data: AirTempDataPoint[]; }
interface AirTemperaturePayload { stations?: AirTempStation[]; readings?: AirTempReading[]; readingType?: string; readingUnit?: string; }

interface WindDataPoint { stationId: string; value: number | null; }
interface WindReading { timestamp: string; data: WindDataPoint[]; }
interface WindDirectionPayload { stations?: any[]; readings?: WindReading[]; readingType?: string; readingUnit?: string; }

interface Forecast { area: string; forecast: string; }
interface ValidPeriod { start: string; end: string; }
interface TwoHourForecastItem { forecasts?: Forecast[]; valid_period: ValidPeriod; }
interface TwoHourForecastPayload { 
  items?: TwoHourForecastItem[]; 
  area_metadata?: Array<{ name: string; label_location: { latitude: number; longitude: number } }>; 
}

interface ForecastWithLocation {
  area: string;
  forecast: string;
  location: { latitude: number; longitude: number };
}

interface WeatherMapProps {
  // Optional props to allow both standalone and integrated usage
  forecastData?: ApiNestedResponse<TwoHourForecastPayload>;
  tempData?: ApiNestedResponse<AirTemperaturePayload>;
  windData?: ApiNestedResponse<WindDirectionPayload>;
}

// Singapore coordinates (centered on the island)
const center: [number, number] = [1.3521, 103.8198];

const WeatherMap: React.FC<WeatherMapProps> = ({ forecastData, tempData, windData }) => {
  // If props are not provided, fetch the data
  const { data: fetchedTempData, isLoading: tempLoading, error: tempError } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
    queryKey: ['weather', 'air-temperature'],
    queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !tempData, // Only fetch if not provided as prop
  });

  const { data: fetchedWindData, isLoading: windLoading, error: windError } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
    queryKey: ['weather', 'wind-direction'],
    queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !windData, // Only fetch if not provided as prop
  });

  const { data: fetchedForecastData, isLoading: forecastLoading, error: forecastError } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
    queryKey: ['weather', 'two-hour-forecast'],
    queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !forecastData, // Only fetch if not provided as prop
  });

  // Use provided data or fetched data
  const actualTempData = tempData || fetchedTempData;
  const actualWindData = windData || fetchedWindData;
  const actualForecastData = forecastData || fetchedForecastData;

  // Loading states
  const isLoading = (!tempData && tempLoading) || (!windData && windLoading) || (!forecastData && forecastLoading);

  if (isLoading) return <Spinner />;

  // Error handling
  const hasError = (!tempData && tempError) || (!windData && windError) || (!forecastData && forecastError) || 
                   !actualTempData?.data || !actualWindData?.data || !actualForecastData?.data;
  if (hasError) {
    return <Text color="red.500">Error loading map data</Text>;
  }

  const tempStations = actualTempData.data?.stations || [];
  const tempReadings = actualTempData.data?.readings || [];
  const windReadings = actualWindData.data?.readings || [];
  const items = actualForecastData.data?.items || [];
  const forecasts = items[0]?.forecasts || [];
  const areaMetadata = actualForecastData.data?.area_metadata || [];

  if (tempStations.length === 0 || tempReadings.length === 0) {
    return <Text>No map data available</Text>;
  }

  const latestTempReading = tempReadings[0];
  const latestWindReading = windReadings[0];

  if (!latestTempReading || !latestTempReading.data) {
    return <Text>No map data available</Text>;
  }

  const tempStationMap = new Map(tempStations.map((st: AirTempStation) => [st.id, st]));
  const windDataMap = new Map(latestWindReading?.data?.map((rd: WindDataPoint) => [rd.stationId, rd.value]) || []);

  const getCardinalDirection = (deg: number | null | undefined) => {
    if (deg === null || deg === undefined) return 'N/A';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return dirs[idx];
  };

  // For forecast markers
  const forecastsWithLocation = forecasts
    .map(f => ({ 
      area: f.area, 
      forecast: f.forecast, 
      location: areaMetadata.find(a => a.name === f.area)?.label_location 
    }))
    .filter(f => f.location) as ForecastWithLocation[];

  return (
    <MapContainer center={center} zoom={11} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MapCenter center={center} />
      <MapInvalidator />
      
      {/* Temperature markers */}
      {latestTempReading.data.map((reading: AirTempDataPoint) => {
        const station = tempStationMap.get(reading.stationId);
        if (!station || reading.value === null) return null;
        const windDeg = windDataMap.get(reading.stationId) as number | null | undefined;
        const cardinal = getCardinalDirection(windDeg);
        return (
          <Marker
            key={reading.stationId}
            position={[station.location.latitude, station.location.longitude]}
            icon={L.divIcon({
              html: `
                <div style="background: rgba(255,255,255,0.95); border:2px solid #4A90E2; border-radius:8px; padding:4px 6px; font-size:11px; font-weight:bold; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); min-width:60px; transform:translate(-50%,-100%);">
                  <div style="font-size:14px; margin-bottom:2px;">
                    ${getWeatherIcon(forecastsWithLocation.find(f => f.area === station.name)?.forecast || 'Fair')}
                  </div>
                  <div style="color:#E53E3E; font-size:12px;">${reading.value.toFixed(1)}°C</div>
                  <div style="color:#2D3748; font-size:10px;">${cardinal}</div>
                </div>
              `,
              className: 'custom-weather-marker',
              iconSize: [60,50],
              iconAnchor: [30,50]
            })}
          >
            <Popup>
              <Box p={1}>
                <Box fontWeight="bold">{station.name}</Box>
                <Box fontSize="sm">Temperature: {reading.value.toFixed(1)}°C</Box>
                <Box fontSize="sm">Wind Direction: {cardinal}</Box>
              </Box>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Add forecast markers for areas without temperature stations */}
      {forecastsWithLocation
        .filter(f => !tempStations.some((s: AirTempStation) => s.name === f.area))
        .map(f => (
          <Marker
            key={f.area}
            position={[f.location.latitude, f.location.longitude]}
            icon={L.divIcon({
              html: `
                <div style="background: rgba(255,255,255,0.95); border:2px solid #4A90E2; border-radius:8px; padding:4px 6px; font-size:11px; font-weight:bold; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); min-width:60px; transform:translate(-50%,-100%);">
                  <div style="font-size:14px; margin-bottom:2px;">
                    ${getWeatherIcon(f.forecast)}
                  </div>
                  <div style="color:#2D3748; font-size:12px;">${f.area}</div>
                </div>
              `,
              className: 'custom-weather-marker',
              iconSize: [60,50],
              iconAnchor: [30,50]
            })}
          >
            <Popup>
              <Box p={1}>
                <Box fontWeight="bold">{f.area}</Box>
                <Box fontSize="sm">Forecast: {f.forecast}</Box>
              </Box>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default WeatherMap;
