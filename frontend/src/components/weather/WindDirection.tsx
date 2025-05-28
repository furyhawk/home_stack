import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box, VStack, HStack, Heading } from '@chakra-ui/react';
import { Card as ChakraCard } from '@chakra-ui/react';
import { WeatherService } from '@/client/sdk.gen';

type ApiNestedResponse<P> = { data?: P };

interface WindDataPoint { stationId: string; value: number | null; }
interface WindReading { timestamp: string; data: WindDataPoint[]; }
interface WindStation { id: string; deviceId: string; name: string; location: { latitude: number; longitude: number; }; }
interface WindDirectionPayload { stations?: WindStation[]; readings?: WindReading[]; readingType?: string; readingUnit?: string; }
enum CardinalDirections { N = "N", NNE = "NNE", NE = "NE", ENE = "ENE", E = "E", ESE = "ESE", SE = "SE", SSE = "SSE", S = "S", SSW = "SSW", SW = "SW", WSW = "WSW", W = "W", WNW = "WNW", NW = "NW", NNW = "NNW" }

const WindDirection: React.FC = () => {
  const { data, isLoading, error } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
    queryKey: ['weather', 'wind-direction'],
    queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading) return <Spinner />;
  if (error || !data?.data) return <Text color="red.500">Error loading wind direction data</Text>;

  const { stations = [], readings = [] } = data.data;
  if (stations.length === 0 || readings.length === 0) return <Text>No wind direction data available</Text>;

  const latestReading = readings[0];
  if (!latestReading || !latestReading.data) return <Text>No wind direction data available</Text>;

  const stationMap = new Map(stations.map(s => [s.id, s.name]));
  const validReadings = latestReading.data.filter(r => r.value !== null);

  let avgDirection = 0;
  if (validReadings.length > 0) {
    const radians = validReadings.map(r => (r.value! * Math.PI) / 180);
    const sinSum = radians.reduce((sum, rad) => sum + Math.sin(rad), 0);
    const cosSum = radians.reduce((sum, rad) => sum + Math.cos(rad), 0);
    const avgRad = Math.atan2(sinSum / validReadings.length, cosSum / validReadings.length);
    avgDirection = Math.round(((avgRad * 180) / Math.PI + 360) % 360);
  }

  const getCardinalDirection = (deg: number) => {
    const dirs = Object.values(CardinalDirections);
    const idx = Math.round(deg / 22.5) % dirs.length;
    return dirs[idx];
  };

  return (
    <Box>
      <VStack align="stretch" spacing={4} mb={6}>
        <ChakraCard>
          <ChakraCard.Body>
            <Heading size="md" mb={2}>Average Wind Direction</Heading>
            <HStack>
              <Text fontSize="3xl" fontWeight="bold">{avgDirection}°</Text>
              <Text fontSize="2xl" ml={2}>({getCardinalDirection(avgDirection)})</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">Based on {validReadings.length} station readings</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>Last updated: {new Date(latestReading.timestamp).toLocaleString()}</Text>
          </ChakraCard.Body>
        </ChakraCard>
      </VStack>
      <Heading size="md" mb={4}>Wind Direction by Station</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {latestReading.data.slice(0, 9).map(r => (
          <ChakraCard key={r.stationId}>
            <ChakraCard.Body>
              <Text fontWeight="bold" fontSize="sm">{stationMap.get(r.stationId) || r.stationId}</Text>
              <Text fontSize="xs" color="gray.500" mb={1}>{r.stationId}</Text>
              <HStack>
                <Text fontSize="2xl">{r.value ?? 0}°</Text>
                <Text>({getCardinalDirection(r.value ?? 0)})</Text>
              </HStack>
            </ChakraCard.Body>
          </ChakraCard>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default WindDirection;
