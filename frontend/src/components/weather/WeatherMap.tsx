import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

interface TwoHourForecastPayload { items?: { forecasts?: { area: string; forecast: string; }[]; }[]; }

const center: [number, number] = [1.3521, 103.8198];

const WeatherMap: React.FC = () => {
  const { data: tempData, isLoading: tempLoading, error: tempError } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
    queryKey: ['weather', 'air-temperature'],
    queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  const { data: windData, isLoading: windLoading, error: windError } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
    queryKey: ['weather', 'wind-direction'],
    queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
    queryKey: ['weather', 'two-hour-forecast'],
    queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  if (tempLoading || windLoading || forecastLoading) return <Spinner />;
  if (tempError || windError || forecastError || !tempData?.data || !windData?.data || !forecastData?.data) {
    return <Text color="red.500">Error loading map data</Text>;
  }

  const { stations: tempStations = [], readings: tempReadings = [] } = tempData.data;
  const { readings: windReadings = [] } = windData.data;
  const forecasts = forecastData.data.items?.[0]?.forecasts || [];

  if (tempStations.length === 0 || tempReadings.length === 0) {
    return <Text>No map data available</Text>;
  }

  const latestTempReading = tempReadings[0];
  const latestWindReading = windReadings[0];

  if (!latestTempReading || !latestTempReading.data) {
    return <Text>No map data available</Text>;
  }

  const tempStationMap = new Map(tempStations.map(st => [st.id, st]));
  const windDataMap = new Map(latestWindReading?.data?.map(rd => [rd.stationId, rd.value]) || []);

  const getCardinalDirection = (deg: number | null | undefined) => {
    if (deg === null || deg === undefined) return 'N/A';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return dirs[idx];
  };

  const generalWeather = forecasts.length > 0 ? forecasts[0].forecast : 'Fair';

  return (
    <MapContainer center={center} zoom={11} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MapCenter center={center} />
      <MapInvalidator />
      {latestTempReading.data.map(reading => {
        const station = tempStationMap.get(reading.stationId);
        if (!station || reading.value === null) return null;
        const windDeg = windDataMap.get(reading.stationId);
        const cardinal = getCardinalDirection(windDeg);
        return (
          <Marker
            key={reading.stationId}
            position={[station.location.latitude, station.location.longitude]}
            icon={L.divIcon({
              html: `
                <div style="background: rgba(255,255,255,0.95); border:2px solid #4A90E2; border-radius:8px; padding:4px 6px; font-size:11px; font-weight:bold; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); min-width:60px; transform:translate(-50%,-100%);">
                  <div style="font-size:14px; margin-bottom:2px;">
                    ${getWeatherIcon(generalWeather)}
                  </div>
                  <div style="color:#E53E3E; font-size:12px;">${reading.value.toFixed(1)}°C</div>
                  <div style="color:#2D3748; font-size:10px;">${cardinal}</div>
                </div>
              `,
              className: 'custom-weather-marker',
              iconSize: [60,50],
              iconAnchor: [30,50]
            })}
          />
        );
      })}
    </MapContainer>
  );
};

export default WeatherMap;
