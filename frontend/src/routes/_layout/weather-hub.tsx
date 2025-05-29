import { Container, Box, Heading, Text, Separator, Tabs as ChakraTabs } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';

import TwoHourForecast from '@/components/weather/TwoHourForecast';
import AirTemperature from '@/components/weather/AirTemperature';
import FourDayOutlook from '@/components/weather/FourDayOutlook';
import WeatherStatistics from '@/components/weather/WeatherStatistics';
import WindDirection from '@/components/weather/WindDirection';
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

      <ChakraTabs.Root variant="enclosed" colorScheme="blue" defaultValue={tabValues.twoHour}>
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
            <TwoHourForecast />
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.airTemp}>
            <AirTemperature />
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.fourDay}>
            <FourDayOutlook />
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.stats}>
            <WeatherStatistics />
          </ChakraTabs.Content>
          <ChakraTabs.Content value={tabValues.windDir}>
            <WindDirection />
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
