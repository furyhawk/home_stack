import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, ScaleControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-overrides.css';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';
import { MapInvalidator } from './MapComponents';

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

const center: [number, number] = [1.3521, 103.8198];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatTime = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
};

const makeTemperatureMarkerHtml = ({
  forecastIcon,
  temperature,
  cardinal,
}: {
  forecastIcon: string;
  temperature: string;
  cardinal: string;
}) => `
  <div class="weather-marker weather-marker--temp">
    <div class="weather-marker__icon">${forecastIcon}</div>
    <div class="weather-marker__temp">${temperature}</div>
    <div class="weather-marker__wind">${cardinal}</div>
  </div>
`;

const makeForecastMarkerHtml = ({
  area,
  forecastIcon,
}: {
  area: string;
  forecastIcon: string;
}) => `
  <div class="weather-marker weather-marker--forecast">
    <div class="weather-marker__icon">${forecastIcon}</div>
    <div class="weather-marker__area">${escapeHtml(area)}</div>
  </div>
`;

const WeatherMap: React.FC<{ forecastData?: ApiNestedResponse<TwoHourForecastPayload>; tempData?: ApiNestedResponse<AirTemperaturePayload>; windData?: ApiNestedResponse<WindDirectionPayload>; }> = ({ forecastData, tempData, windData }) => {
  const { data: fetchedTempData, isLoading: tempLoading, error: tempError } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
    queryKey: ['weather', 'air-temperature'],
    queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !tempData,
  });

  const { data: fetchedWindData, isLoading: windLoading, error: windError } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
    queryKey: ['weather', 'wind-direction'],
    queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !windData,
  });

  const { data: fetchedForecastData, isLoading: forecastLoading, error: forecastError } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
    queryKey: ['weather', 'two-hour-forecast'],
    queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
    refetchInterval: 1000 * 60 * 30,
    enabled: !forecastData,
  });

  const actualTempData = tempData || fetchedTempData;
  const actualWindData = windData || fetchedWindData;
  const actualForecastData = forecastData || fetchedForecastData;

  const isLoading = (!tempData && tempLoading) || (!windData && windLoading) || (!forecastData && forecastLoading);

  if (isLoading) return <Spinner />;

  const hasError = (!tempData && tempError) || (!windData && windError) || (!forecastData && forecastError) ||
    !actualTempData?.data || !actualWindData?.data || !actualForecastData?.data;
  if (hasError) {
    return <Text color="red.500">Error loading map data</Text>;
  }

  // Memoize the data processing to avoid recomputing on every render
  const processedData = useMemo(() => {
    const tempStations = actualTempData.data?.stations || [];
    const tempReadings = actualTempData.data?.readings || [];
    const windReadings = actualWindData.data?.readings || [];
    const items = actualForecastData.data?.items || [];
    const forecasts = items[0]?.forecasts || [];
    const areaMetadata = actualForecastData.data?.area_metadata || [];

    if (tempStations.length === 0 || tempReadings.length === 0) {
      return null;
    }

    const latestTempReading = tempReadings[0];


    if (!latestTempReading || !latestTempReading.data) {
      return null;
    }

    const latestReadingTime = formatTime(latestTempReading.timestamp);
    const tempStationMap = new Map(tempStations.map((st: AirTempStation) => [st.id, st]));
    const windDataMap = new Map(windReadings[0]?.data?.map((rd: WindDataPoint) => [rd.stationId, rd.value]) || []);

    const getCardinalDirection = (deg: number | null | undefined) => {
      if (deg === null || deg === undefined) return 'N/A';
      const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const idx = Math.round((deg % 360) / 22.5) % 16;
      return dirs[idx];
    };

    const forecastsWithLocation = forecasts
      .map(f => ({
        area: f.area,
        forecast: f.forecast,
        location: areaMetadata.find(a => a.name === f.area)?.label_location,
      }))
      .filter(f => f.location) as ForecastWithLocation[];

    return {
      tempStations,
      tempReadings,
      windReadings,
      items,
      forecasts,
      areaMetadata,
      latestTempReading,
      latestReadingTime,
      tempStationMap,
      windDataMap,
      getCardinalDirection,
      forecastsWithLocation
    };
  }, [actualTempData, actualWindData, actualForecastData]);

  if (!processedData) {
    return <Text>No map data available</Text>;
  }

  const { 
    tempStations,
    latestTempReading,
    latestReadingTime,
    tempStationMap,
    windDataMap,
    getCardinalDirection,
    forecastsWithLocation
  } = processedData;

  return (
    <Box className="weather-map-shell">
      <Box className="weather-map-banner">
        <Text className="weather-map-title">Singapore Live Weather Map</Text>
        <Text className="weather-map-meta">
          Updated {latestReadingTime} | {tempStations.length} stations
        </Text>
      </Box>

      <MapContainer center={center} zoom={11} className="weather-map-container" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <MapInvalidator />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" imperial={false} />

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
                html: makeTemperatureMarkerHtml({
                  forecastIcon: getWeatherIcon(forecastsWithLocation.find(f => f.area === station.name)?.forecast || 'Fair'),
                  temperature: `${reading.value.toFixed(1)}°C`,
                  cardinal,
                }),
                className: 'custom-weather-marker',
                iconSize: [78, 72],
                iconAnchor: [39, 72],
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

        {forecastsWithLocation
          .filter(f => !tempStations.some((s: AirTempStation) => s.name === f.area))
          .map(f => (
            <Marker
              key={f.area}
              position={[f.location.latitude, f.location.longitude]}
              icon={L.divIcon({
                html: makeForecastMarkerHtml({
                  area: f.area,
                  forecastIcon: getWeatherIcon(f.forecast),
                }),
                className: 'custom-weather-marker',
                iconSize: [92, 62],
                iconAnchor: [46, 62],
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
    </Box>
  );
};

export default WeatherMap;