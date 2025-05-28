import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Flex, Text, HStack, Badge, SimpleGrid, Spinner } from '@chakra-ui/react';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';
import WeatherMap from './WeatherMap';

// Types
interface Forecast { area: string; forecast: string; }
interface ValidPeriod { start: string; end: string; }
interface TwoHourForecastItem { forecasts?: Forecast[]; valid_period: ValidPeriod; }
interface TwoHourForecastPayload { items?: TwoHourForecastItem[]; area_metadata?: any[]; }
type ApiNestedResponse<P> = { data?: P };

const TwoHourForecast: React.FC = () => {
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

  return (
    <Box>
      {validPeriod && (
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text fontWeight="medium">
            Valid: {new Date(validPeriod.start).toLocaleTimeString()} -{' '}
            {new Date(validPeriod.end).toLocaleTimeString()}
          </Text>
          <HStack gap={4}>
            <HStack gap={2}>
              <Badge variant={viewMode === 'grid' ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setViewMode('grid')}>
                Grid
              </Badge>
              <Badge variant={viewMode === 'map' ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setViewMode('map')}>
                Map
              </Badge>
            </HStack>
          </HStack>
        </Flex>
      )}
      {viewMode === 'grid' && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {forecasts.map(f => (
            <Box key={f.area} borderWidth={1} borderRadius="md" p={4}>
              <HStack mb={2} gap={2}>
                <Text fontSize="xl">{getWeatherIcon(f.forecast)}</Text>
                <Text fontWeight="bold">{f.area}</Text>
              </HStack>
              <Text>{f.forecast}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
      {viewMode === 'map' && (
        <Box height="500px" width="100%" borderRadius="md" overflow="hidden" my={4}>
          <WeatherMap forecastData={data} />
        </Box>
      )}
    </Box>
  );
};

export default TwoHourForecast;
