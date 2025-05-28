import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box, VStack, HStack, Heading } from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';

type ApiNestedResponse<P> = { data?: P };

interface Forecast { area: string; forecast: string; }
interface TwoHourForecastItem { forecasts?: Forecast[]; }
interface TwoHourForecastPayload { items?: TwoHourForecastItem[]; }

const WeatherStatistics: React.FC = () => {
  const { data, isLoading, error } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
    queryKey: ['weather', 'stats-forecast'],
    queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading) return <Spinner />;
  if (error || !data?.data) return <Text color="red.500">Error loading statistics</Text>;

  const items = data.data.items || [];
  if (!items.length) return <Text>No forecast data available for statistics</Text>;

  const forecasts = items[0].forecasts || [];
  const forecastCounts: Record<string, number> = {};
  forecasts.forEach(f => { forecastCounts[f.forecast] = (forecastCounts[f.forecast] || 0) + 1; });

  const sortedForecasts = Object.entries(forecastCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([forecast, count]) => ({ forecast, count }));

  const totalAreas = forecasts.length;

  return (
    <Box>
      <Card.Root mb={6}>
        <Card.Body>
          <Heading size="md" mb={4}>Weather Overview</Heading>
          <Text fontSize="lg">Total Areas: <Text as="span" fontWeight="bold">{totalAreas}</Text></Text>
          {sortedForecasts.length > 0 && (
            <Text fontSize="lg" mt={2}>
              Most Common: <Text as="span">{getWeatherIcon(sortedForecasts[0].forecast)} {sortedForecasts[0].forecast}</Text> ({sortedForecasts[0].count} areas)
            </Text>
          )}
        </Card.Body>
      </Card.Root>
      <Heading size="md" mb={4}>Weather Conditions Distribution</Heading>
      <VStack align="stretch" gap={3}>
        {sortedForecasts.map(item => (
          <Card.Root key={item.forecast} mb={2}>
            <Card.Body>
              <HStack justify="space-between">
                <HStack>
                  <Text fontSize="xl">{getWeatherIcon(item.forecast)}</Text>
                  <Text fontWeight="medium">{item.forecast}</Text>
                </HStack>
                <Text>{item.count} areas ({(item.count / totalAreas * 100).toFixed(1)}%)</Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Box>
  );
};

export default WeatherStatistics;
