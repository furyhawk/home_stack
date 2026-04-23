import React from 'react';
import { Container, Box, Heading, Text, Separator, Tabs as ChakraTabs } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';

// Lazy-load components to improve initial bundle size
const TwoHourForecast = React.lazy(() => import('@/components/weather/TwoHourForecast'));
const AirTemperature = React.lazy(() => import('@/components/weather/AirTemperature'));
const FourDayOutlook = React.lazy(() => import('@/components/weather/FourDayOutlook'));
const WeatherStatistics = React.lazy(() => import('@/components/weather/WeatherStatistics'));
const WindDirection = React.lazy(() => import('@/components/weather/WindDirection'));
// Note: WeatherMap is NOT lazy-loaded here because it's directly imported by TwoHourForecast
// Lazy-loading it here would cause React to treat it as a different component instance
import WeatherMap from '@/components/weather/WeatherMap';

const tabValues = {
  twoHour: 'twoHourForecast',
  airTemp: 'airTemperature',
  fourDay: 'fourDayOutlook',
  stats: 'statistics',
  windDir: 'windDirection',
  weatherMap: 'weatherMap',
};

export const Route = createFileRoute('/_layout/weather-hub')({
  component: WeatherHub,
});

function WeatherHub() {
  return (
    <Container maxW="container.xl">
      <Box mb={6}>
        <Heading as="h1" size="xl">Singapore Weather Hub</Heading>
        <Text mt={2} color="gray.500">
          Real-time weather data from NEA Singapore via data.gov.sg
        </Text>
        <Separator my={4} />
      </Box>

      <ChakraTabs.Root variant="enclosed" colorScheme="blue" defaultValue={tabValues.twoHour} lazyMount unmountOnExit>
        <ChakraTabs.List>
          <ChakraTabs.Trigger value={tabValues.twoHour}>2-Hour Forecast</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value={tabValues.airTemp}>Air Temperature</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value={tabValues.fourDay}>4-Day Outlook</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value={tabValues.stats}>Statistics</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value={tabValues.windDir}>Wind Direction</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value={tabValues.weatherMap}>Weather Map</ChakraTabs.Trigger>
        </ChakraTabs.List>

        <ChakraTabs.ContentGroup>
          <ChakraTabs.Content value={tabValues.twoHour}>
            <React.Suspense fallback={<Box>Loading forecast...</Box>}>
              <TwoHourForecast />
            </React.Suspense>
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.airTemp}>
            <React.Suspense fallback={<Box>Loading temperature...</Box>}>
              <AirTemperature />
            </React.Suspense>
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.fourDay}>
            <React.Suspense fallback={<Box>Loading forecast...</Box>}>
              <FourDayOutlook />
            </React.Suspense>
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.stats}>
            <React.Suspense fallback={<Box>Loading statistics...</Box>}>
              <WeatherStatistics />
            </React.Suspense>
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.windDir}>
            <React.Suspense fallback={<Box>Loading wind data...</Box>}>
              <WindDirection />
            </React.Suspense>
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.weatherMap}>
            <WeatherMap />
          </ChakraTabs.Content>
        </ChakraTabs.ContentGroup>
      </ChakraTabs.Root>
    </Container>
  );
}

export default WeatherHub;
