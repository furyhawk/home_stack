// filepath: /home/user/projects/home_stack/frontend/src/routes/_layout/weather-hub.tsx
import { useState } from "react"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Spinner, 
  SimpleGrid, 
  Divider,
  Card,
  CardBody,
  Badge,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Select,
  Flex,
  CardHeader,
  Stack,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

import { WeatherService } from "@/client/sdk.gen"

export const Route = createFileRoute("/_layout/weather-hub")({
  component: WeatherHub,
})

// Utility function to get weather icon based on forecast text
function getWeatherIcon(forecast: string): string {
  const lowerCaseForecast = forecast.toLowerCase()
  
  if (lowerCaseForecast.includes("thundery")) return "⛈️"
  if (lowerCaseForecast.includes("rain")) return "🌧️"
  if (lowerCaseForecast.includes("showers")) return "🌦️"
  if (lowerCaseForecast.includes("cloudy")) return "☁️"
  if (lowerCaseForecast.includes("fair")) return "🌤️"
  if (lowerCaseForecast.includes("hazy")) return "🌫️"
  if (lowerCaseForecast.includes("windy")) return "💨"
  if (lowerCaseForecast.includes("sunny")) return "☀️"
  
  return "🌈"
}

function TwoHourForecast() {
  const [selectedArea, setSelectedArea] = useState<string>("All Areas")
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", "two-hour-forecast"],
    queryFn: () => WeatherService.getTwoHourForecast(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  })
  
  if (isLoading) return <Spinner />
  if (error || !data) return <Text color="red.500">Error loading forecast data</Text>
  
  if (!data.data?.items?.length) {
    return <Text>No forecast data available</Text>
  }
  
  const forecasts = data.data.items[0].forecasts || []
  const validPeriod = data.data.items[0].valid_period
  const areaMetadata = data.data.area_metadata || []
  
  // Get unique areas for dropdown
  const areaNames = forecasts.map(f => f.area)
  const uniqueAreas = ["All Areas", ...Array.from(new Set(areaNames)).sort()]
  
  // Filter forecasts by selected area
  const filteredForecasts = selectedArea === "All Areas" 
    ? forecasts 
    : forecasts.filter(forecast => forecast.area === selectedArea)
  
  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontWeight="medium">
          Valid: {new Date(validPeriod.start).toLocaleTimeString()} - {new Date(validPeriod.end).toLocaleTimeString()}
        </Text>
        <Select 
          value={selectedArea} 
          onChange={(e) => setSelectedArea(e.target.value)}
          width="200px"
        >
          {uniqueAreas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </Select>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filteredForecasts.map((forecast) => (
          <Card key={forecast.area}>
            <CardBody>
              <HStack mb={2}>
                <Text fontSize="xl">{getWeatherIcon(forecast.forecast)}</Text>
                <Heading size="md">{forecast.area}</Heading>
              </HStack>
              <Text>{forecast.forecast}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}

function AirTemperature() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", "air-temperature"],
    queryFn: () => WeatherService.getAirTemperature(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  })
  
  if (isLoading) return <Spinner />
  if (error || !data) return <Text color="red.500">Error loading temperature data</Text>
  
  if (!data.data?.readings?.length) {
    return <Text>No temperature data available</Text>
  }
  
  const readings = data.data.readings
  
  // Calculate average temperature
  const avgTemp = readings.reduce((sum, reading) => sum + reading.value, 0) / readings.length
  
  return (
    <Box>
      <VStack align="stretch" spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Heading size="md" mb={2}>Average Temperature</Heading>
            <Text fontSize="3xl" fontWeight="bold">{avgTemp.toFixed(1)}°C</Text>
            <Text fontSize="sm" color="gray.500">Based on {readings.length} station readings</Text>
          </CardBody>
        </Card>
      </VStack>
      
      <Heading size="md" mb={4}>Temperature Readings by Station</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {readings.slice(0, 9).map((reading) => (
          <Card key={reading.station_id}>
            <CardBody>
              <Text fontWeight="bold">{reading.station_id}</Text>
              <Text fontSize="2xl">{reading.value.toFixed(1)}°C</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}

function FourDayOutlook() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", "four-day-outlook"],
    queryFn: () => WeatherService.getFourDayOutlook(),
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  })
  
  if (isLoading) return <Spinner />
  if (error || !data) return <Text color="red.500">Error loading outlook data</Text>
  
  if (!data.data?.records?.length) {
    return <Text>No outlook data available</Text>
  }
  
  const forecastData = data.data.records[0]
  
  return (
    <Box>
      <Text mb={4}>Updated: {new Date(forecastData.timestamp).toLocaleString()}</Text>
      
      {forecastData.forecasts && forecastData.forecasts.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {forecastData.forecasts.map((forecast: any, index: number) => (
            <Card key={index}>
              <CardBody>
                <Text fontWeight="bold">{new Date(forecast.date).toLocaleDateString()}</Text>
                <HStack spacing={2} mb={2}>
                  <Text fontSize="xl">{getWeatherIcon(forecast.forecast)}</Text>
                  <Text>{forecast.forecast}</Text>
                </HStack>
                {forecast.temperature && (
                  <Text fontSize="sm">
                    Temperature: {forecast.temperature.low}°C - {forecast.temperature.high}°C
                  </Text>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}

function WeatherStatistics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", "stats-forecast"],
    queryFn: () => WeatherService.getTwoHourForecast(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  })
  
  if (isLoading) return <Spinner />
  if (error || !data) return <Text color="red.500">Error loading statistics</Text>
  
  if (!data.data?.items?.length) {
    return <Text>No forecast data available for statistics</Text>
  }
  
  const forecasts = data.data.items[0].forecasts || []
  
  // Count forecast types
  const forecastCounts: Record<string, number> = {}
  forecasts.forEach(forecast => {
    forecastCounts[forecast.forecast] = (forecastCounts[forecast.forecast] || 0) + 1
  })
  
  // Sort by count (descending)
  const sortedForecasts = Object.entries(forecastCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([forecast, count]) => ({ forecast, count }))
  
  // Calculate percentages
  const totalAreas = forecasts.length
  
  return (
    <Box>
      <Card mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>Weather Overview</Heading>
          <Text fontSize="lg">
            Total Areas: <Badge colorScheme="blue" fontSize="lg">{totalAreas}</Badge>
          </Text>
          {sortedForecasts.length > 0 && (
            <Text fontSize="lg" mt={2}>
              Most Common: <Badge colorScheme="green" fontSize="lg">
                {getWeatherIcon(sortedForecasts[0].forecast)} {sortedForecasts[0].forecast}
              </Badge> ({sortedForecasts[0].count} areas)
            </Text>
          )}
        </CardBody>
      </Card>
      
      <Heading size="md" mb={4}>Weather Conditions Distribution</Heading>
      <VStack align="stretch" spacing={3}>
        {sortedForecasts.map(item => (
          <Card key={item.forecast}>
            <CardBody>
              <HStack justify="space-between">
                <HStack>
                  <Text fontSize="xl">{getWeatherIcon(item.forecast)}</Text>
                  <Text fontWeight="medium">{item.forecast}</Text>
                </HStack>
                <Badge colorScheme="blue">
                  {item.count} areas ({(item.count / totalAreas * 100).toFixed(1)}%)
                </Badge>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    </Box>
  )
}

function WindDirection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", "wind-direction"],
    queryFn: () => WeatherService.getWindDirection(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  })
  
  if (isLoading) return <Spinner />
  if (error || !data) return <Text color="red.500">Error loading wind direction data</Text>
  
  if (!data.data?.readings?.length) {
    return <Text>No wind direction data available</Text>
  }
  
  const readings = data.data.readings
  
  // Calculate average direction
  const avgDirection = Math.round(
    readings.reduce((sum, reading) => sum + (reading.value || 0), 0) / readings.length
  )
  
  // Convert direction to cardinal points
  const getCardinalDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }
  
  return (
    <Box>
      <VStack align="stretch" spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Heading size="md" mb={2}>Average Wind Direction</Heading>
            <HStack>
              <Text fontSize="3xl" fontWeight="bold">{avgDirection}°</Text>
              <Text fontSize="2xl" ml={2}>({getCardinalDirection(avgDirection)})</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">Based on {readings.length} station readings</Text>
          </CardBody>
        </Card>
      </VStack>
      
      <Heading size="md" mb={4}>Wind Direction by Station</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {readings.slice(0, 9).map((reading) => (
          <Card key={reading.id || Math.random().toString()}>
            <CardBody>
              <Text fontWeight="bold">{reading.id}</Text>
              <HStack>
                <Text fontSize="2xl">{reading.value}°</Text>
                <Text>({getCardinalDirection(reading.value || 0)})</Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Last updated: {new Date(reading.timestamp).toLocaleTimeString()}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}

function WeatherHub() {
  return (
    <Container maxW="container.xl">
      <Box mb={6}>
        <Heading as="h1" size="xl">Singapore Weather Hub</Heading>
        <Text mt={2} color="gray.500">
          Real-time weather data from NEA Singapore via data.gov.sg
        </Text>
        <Divider my={4} />
      </Box>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>2-Hour Forecast</Tab>
          <Tab>Air Temperature</Tab>
          <Tab>4-Day Outlook</Tab>
          <Tab>Statistics</Tab>
          <Tab>Wind Direction</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <TwoHourForecast />
          </TabPanel>
          <TabPanel>
            <AirTemperature />
          </TabPanel>
          <TabPanel>
            <FourDayOutlook />
          </TabPanel>
          <TabPanel>
            <WeatherStatistics />
          </TabPanel>
          <TabPanel>
            <WindDirection />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  )
}

export default WeatherHub
