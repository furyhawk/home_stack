import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box, SimpleGrid, HStack } from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';
import { WeatherService } from '@/client/sdk.gen';
import { getWeatherIcon } from './weatherUtils';

type ApiNestedResponse<P> = { data?: P };

interface OutlookForecast { timestamp: string; day: string; forecast: { summary: string; code: string; text: string; }; temperature?: { low: number; high: number; }; }
interface FourDayOutlookRecord { timestamp: string; forecasts?: OutlookForecast[]; }
interface FourDayOutlookPayload { records?: FourDayOutlookRecord[]; }

const FourDayOutlook: React.FC = () => {
  const { data, isLoading, error } = useQuery<ApiNestedResponse<FourDayOutlookPayload>>({
    queryKey: ['weather', 'four-day-outlook'],
    queryFn: () => WeatherService.getFourDayOutlook() as Promise<ApiNestedResponse<FourDayOutlookPayload>>,
    refetchInterval: 1000 * 60 * 60,
  });

  if (isLoading) return <Spinner />;
  if (error || !data?.data) return <Text color="red.500">Error loading outlook data</Text>;

  const records = data.data.records || [];
  if (!records.length) return <Text>No outlook data available</Text>;

  const forecastData = records[0];

  return (
    <Box>
      <Text mb={4}>Updated: {new Date(forecastData.timestamp).toLocaleString()}</Text>
      {forecastData.forecasts && forecastData.forecasts.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {forecastData.forecasts.map((f, idx) => (
            <Card.Root key={idx}>
              <Card.Body>
                <Text fontWeight="bold">{new Date(f.timestamp).toLocaleDateString()}</Text>
                <HStack gap={2} mb={2}>
                  <Text fontSize="xl">{getWeatherIcon(f.forecast.text)}</Text>
                  <Text>{f.forecast.text}</Text>
                </HStack>
                {f.temperature && (
                  <Text fontSize="sm">Temperature: {f.temperature.low}°C - {f.temperature.high}°C</Text>
                )}
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default FourDayOutlook;
