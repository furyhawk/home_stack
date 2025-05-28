import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Flex, Text, HStack, Badge, SimpleGrid, Spinner } from '@chakra-ui/react';
import { createListCollection } from '@ark-ui/react';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';

// Types
interface Forecast { area: string; forecast: string; }
interface ValidPeriod { start: string; end: string; }
interface TwoHourForecastItem { forecasts?: Forecast[]; valid_period: ValidPeriod; }
interface TwoHourForecastPayload { items?: TwoHourForecastItem[]; area_metadata?: any[]; }
type ApiNestedResponse<P> = { data?: P };

const TwoHourForecast: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string[]>(['All Areas']);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  const { data, isLoading, error } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
    queryKey: ['weather', 'two-hour-forecast'],
    queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading) return <Spinner />;
  if (error || !data?.data) return <Text color="red.500">Error loading forecast data</Text>;

  const items = data.data.items || [];
  if (!items.length) return <Text>No forecast data available</Text>;

  const forecasts = items[0].forecasts || [];
  const validPeriod = items[0].valid_period;
  const areaMetadata = data.data.area_metadata || [];

  // Unique area names
  const uniqueAreas = ['All Areas', ...Array.from(new Set(forecasts.map(f => f.area))).sort()];

  // Filter forecasts
  const filteredForecasts = selectedArea.includes('All Areas')
    ? forecasts
    : forecasts.filter(f => selectedArea.includes(f.area));

  // Map view data
  const forecastsWithLocation = forecasts
    .map(f => ({ ...f, location: areaMetadata.find(a => a.name === f.area)?.label_location }))
    .filter(f => f.location && (selectedArea.includes('All Areas') || selectedArea.includes(f.area)));

  return (
    <Box>
      {validPeriod && (
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text fontWeight="medium">
            Valid: {new Date(validPeriod.start).toLocaleTimeString()} -{' '}
            {new Date(validPeriod.end).toLocaleTimeString()}
          </Text>
          <HStack spacing={4}>
            <HStack>
              <Badge variant={viewMode === 'grid' ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setViewMode('grid')}>
                Grid
              </Badge>
              <Badge variant={viewMode === 'map' ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setViewMode('map')}>
                Map
              </Badge>
            </HStack>
            {/* Area select omitted for map-only display */}
          </HStack>
        </Flex>
      )}
      {viewMode === 'grid' && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredForecasts.map(f => (
            <Box key={f.area} borderWidth={1} borderRadius="md" p={4}>
              <HStack mb={2} spacing={2}>
                <Text fontSize="xl">{getWeatherIcon(f.forecast)}</Text>
                <Text fontWeight="bold">{f.area}</Text>
              </HStack>
              <Text>{f.forecast}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
      {/* Map view component can be reused */}
    </Box>
  );
};

export default TwoHourForecast;
