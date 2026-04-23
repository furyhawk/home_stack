import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text, Box, VStack, SimpleGrid, Heading } from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';
import { WeatherService } from '@/client/sdk.gen';

type ApiNestedResponse<P> = { data?: P };

interface AirTempStation { id: string; deviceId: string; name: string; location: { latitude: number; longitude: number; }; }
interface AirTempDataPoint { stationId: string; value: number; }
interface AirTempReading { timestamp: string; data: AirTempDataPoint[]; }
interface AirTemperaturePayload { stations?: AirTempStation[]; readings?: AirTempReading[]; readingType?: string; readingUnit?: string; }

const AirTemperature: React.FC = () => {
  const { data, isLoading, error } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
    queryKey: ['weather', 'air-temperature'],
    queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
    refetchInterval: 1000 * 60 * 30,
  });

  // Memoize the data processing to avoid recomputing on every render
  const processedData = useMemo(() => {
    if (!data?.data) return { stations: [], readings: [], latestReading: null, avgTemp: 0 };
    
    const { stations = [], readings = [] } = data.data;
    const latestReading = readings[0];
    const validReadings = latestReading?.data?.filter(r => r.value !== null) || [];
    const avgTemp = validReadings.length > 0
      ? validReadings.reduce((sum, r) => sum + r.value, 0) / validReadings.length
      : 0;
      
    return { stations, readings, latestReading, avgTemp };
  }, [data]);

  if (isLoading) return <Spinner />;
  if (error || !processedData.stations.length || !processedData.readings.length) return <Text color="red.500">Error loading temperature data</Text>;

  const { stations, latestReading } = processedData;
  
  if (!latestReading || !latestReading.data) return <Text>No temperature data available</Text>;

  const stationMap = new Map(stations.map(s => [s.id, s.name]));
  const validReadings = latestReading.data.filter(r => r.value !== null);
  const avgTempValue = validReadings.length > 0
    ? validReadings.reduce((sum, r) => sum + r.value, 0) / validReadings.length
    : 0;

  return (
    <Box>
      <VStack align="stretch" gap={4} mb={6}>
        <Card.Root>
          <Card.Body>
            <Heading size="md" mb={2}>Average Temperature</Heading>
            <Text fontSize="3xl" fontWeight="bold">{avgTempValue.toFixed(1)}°C</Text>
            <Text fontSize="sm" color="gray.500">Based on {validReadings.length} station readings</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>Last updated: {new Date(latestReading.timestamp).toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
      </VStack>
      <Heading size="md" mb={4}>Temperature Readings by Station</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {latestReading.data.slice(0, 9).map(r => (
          <Card.Root key={r.stationId}>
            <Card.Body>
              <Text fontWeight="bold" fontSize="sm">{stationMap.get(r.stationId) || r.stationId}</Text>
              <Text fontSize="xs" color="gray.500" mb={1}>{r.stationId}</Text>
              <Text fontSize="2xl">{r.value.toFixed(1)}°C</Text>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default AirTemperature;
