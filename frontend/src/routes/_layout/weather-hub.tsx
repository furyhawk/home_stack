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
    Badge,
    Separator,
    Flex,
    // Import Chakra UI components that are used as namespaces with an alias
    Tabs as ChakraTabs,
    Select as ChakraSelect,
    Card as ChakraCard,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { createListCollection } from "@ark-ui/react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { WeatherService } from "@/client/sdk.gen"

// Define interfaces for better type safety based on observed usage and typical API structures
interface Forecast {
    area: string;
    forecast: string;
}

interface ValidPeriod {
    start: string;
    end: string;
}

interface TwoHourForecastItem {
    forecasts?: Forecast[];
    valid_period: ValidPeriod;
}

interface TwoHourForecastPayload {
    items?: TwoHourForecastItem[];
    area_metadata?: any[]; // Define AreaMetadata if its structure is known and used
}

interface AirTempStation {
    id: string;
    deviceId: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

interface AirTempDataPoint {
    stationId: string;
    value: number;
}

interface AirTempReading {
    timestamp: string;
    data: AirTempDataPoint[];
}

interface AirTemperaturePayload {
    stations?: AirTempStation[];
    readings?: AirTempReading[];
    readingType?: string;
    readingUnit?: string;
}

interface OutlookForecast {
    timestamp: string; // Changed from date: string
    day: string;       // Added from payload
    forecast: {
        summary: string;
        code: string;
        text: string;
    };
    temperature?: { low: number; high: number };
}

interface FourDayOutlookRecord {
    timestamp: string;
    forecasts?: OutlookForecast[];
}

interface FourDayOutlookPayload {
    records?: FourDayOutlookRecord[];
}

interface WindStation {
    id: string;
    deviceId: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

interface WindDataPoint {
    stationId: string;
    value: number | null;
}

interface WindReading {
    timestamp: string;
    data: WindDataPoint[];
}

interface WindDirectionPayload {
    stations?: WindStation[];
    readings?: WindReading[];
    readingType?: string;
    readingUnit?: string;
}

// Wrapper type for useQuery data if API responses are nested under a 'data' property
type ApiNestedResponse<P> = { data?: P };

export const Route = createFileRoute("/_layout/weather-hub")({
    component: WeatherHub,
})

// Utility function to get weather icon based on forecast text
function getWeatherIcon(forecast: string): string {
    // Add a check to ensure forecast is a string before calling toLowerCase
    if (typeof forecast !== 'string' || forecast === null) {
        return "❓"; // Default icon for unknown or invalid forecast type
    }

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
    const [selectedArea, setSelectedArea] = useState<string[]>(["All Areas"])

    const { data, isLoading, error } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
        queryKey: ["weather", "two-hour-forecast"],
        queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>, // Cast if necessary
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    })

    if (isLoading) return <Spinner />
    if (error || !data?.data) return <Text color="red.500">Error loading forecast data</Text>

    if (!Array.isArray(data.data.items) || data.data.items.length === 0) {
        return <Text>No forecast data available</Text>
    }

    const forecasts = data.data.items[0]?.forecasts || []
    const validPeriod = data.data.items[0]?.valid_period
    // const areaMetadata = data.data.area_metadata || [] // Unused variable

    // Get unique areas for dropdown
    const areaNames = forecasts.map((f: Forecast) => f.area)
    const uniqueAreas: string[] = ["All Areas", ...Array.from(new Set(areaNames)).sort()]

    // Filter forecasts by selected area
    const filteredForecasts = selectedArea.includes("All Areas")
        ? forecasts
        : forecasts.filter((forecast: Forecast) => selectedArea.includes(forecast.area))

    return (
        <Box>
            {validPeriod && (
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Text fontWeight="medium">
                        Valid: {new Date(validPeriod.start).toLocaleTimeString()} - {new Date(validPeriod.end).toLocaleTimeString()}
                    </Text>
                    <ChakraSelect.Root
                        value={selectedArea}
                        collection={createListCollection({
                            items: uniqueAreas.map(area => ({ value: area, label: area }))
                        })}
                        onValueChange={(details) => {
                            // Handle array of values for multi-select
                            if (Array.isArray(details)) {
                                setSelectedArea(details);
                            } else if (typeof details === 'string') {
                                setSelectedArea([details]);
                            } else if (details && typeof (details as any).value === 'string') {
                                setSelectedArea([(details as any).value]);
                            }
                        }}
                        width="200px"
                    >

                        <ChakraSelect.Trigger>
                            <ChakraSelect.ValueText placeholder="Select an area" />
                        </ChakraSelect.Trigger>
                        <ChakraSelect.Positioner>
                            <ChakraSelect.Content>
                                {uniqueAreas.map(area => (
                                    <ChakraSelect.Item key={area} item={{ value: area, label: area }}>
                                        {area}
                                    </ChakraSelect.Item>
                                ))}
                            </ChakraSelect.Content>
                        </ChakraSelect.Positioner>
                    </ChakraSelect.Root>
                </Flex>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}> {/* Changed spacing to gap */}
                {filteredForecasts.map((forecast: Forecast) => (
                    <ChakraCard.Root key={forecast.area}>
                        <ChakraCard.Body>
                            <HStack mb={2} gap={2}> {/* Changed spacing to gap */}
                                <Text fontSize="xl">{getWeatherIcon(forecast.forecast)}</Text>
                                <Heading size="md">{forecast.area}</Heading>
                            </HStack>
                            <Text>{forecast.forecast}</Text>
                        </ChakraCard.Body>
                    </ChakraCard.Root>
                ))}
            </SimpleGrid>
        </Box>
    )
}

function AirTemperature() {
    const { data, isLoading, error } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
        queryKey: ["weather", "air-temperature"],
        queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    })

    if (isLoading) return <Spinner />
    if (error || !data?.data) return <Text color="red.500">Error loading temperature data</Text>

    const { stations = [], readings = [] } = data.data;

    if (stations.length === 0 || readings.length === 0) {
        return <Text>No temperature data available</Text>
    }

    // Get the latest reading
    const latestReading = readings[0];
    if (!latestReading || !latestReading.data) {
        return <Text>No temperature data available</Text>
    }

    // Create a map of station IDs to station names
    const stationMap = new Map(stations.map(station => [station.id, station.name]));

    // Calculate average temperature
    const validReadings = latestReading.data.filter(reading => reading.value !== null);
    const avgTemp = validReadings.length > 0 
        ? validReadings.reduce((sum, reading) => sum + reading.value, 0) / validReadings.length 
        : 0;

    return (
        <Box>
            <VStack align="stretch" gap={4} mb={6}> {/* Changed spacing to gap */}
                <ChakraCard.Root>
                    <ChakraCard.Body>
                        <Heading size="md" mb={2}>Average Temperature</Heading>
                        <Text fontSize="3xl" fontWeight="bold">{avgTemp.toFixed(1)}°C</Text>
                        <Text fontSize="sm" color="gray.500">
                            Based on {validReadings.length} station readings
                        </Text>
                        <Text fontSize="xs" color="gray.400" mt={1}>
                            Last updated: {new Date(latestReading.timestamp).toLocaleString()}
                        </Text>
                    </ChakraCard.Body>
                </ChakraCard.Root>
            </VStack>

            <Heading size="md" mb={4}>Temperature Readings by Station</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}> {/* Changed spacing to gap */}
                {latestReading.data.slice(0, 9).map((reading: AirTempDataPoint) => (
                    <ChakraCard.Root key={reading.stationId}>
                        <ChakraCard.Body>
                            <Text fontWeight="bold" fontSize="sm">
                                {stationMap.get(reading.stationId) || reading.stationId}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                                {reading.stationId}
                            </Text>
                            <Text fontSize="2xl">{reading.value.toFixed(1)}°C</Text>
                        </ChakraCard.Body>
                    </ChakraCard.Root>
                ))}
            </SimpleGrid>
        </Box>
    )
}

function FourDayOutlook() {
    const { data, isLoading, error } = useQuery<ApiNestedResponse<FourDayOutlookPayload>>({
        queryKey: ["weather", "four-day-outlook"],
        queryFn: () => WeatherService.getFourDayOutlook() as Promise<ApiNestedResponse<FourDayOutlookPayload>>,
        refetchInterval: 1000 * 60 * 60, // Refetch every hour
    })

    if (isLoading) return <Spinner />
    if (error || !data?.data) return <Text color="red.500">Error loading outlook data</Text>

    if (!Array.isArray(data.data.records) || data.data.records.length === 0) {
        return <Text>No outlook data available</Text>
    }

    const forecastData = data.data.records[0]

    return (
        <Box>
            <Text mb={4}>Updated: {new Date(forecastData.timestamp).toLocaleString()}</Text>

            {forecastData.forecasts && forecastData.forecasts.length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}> {/* Changed spacing to gap */}
                    {forecastData.forecasts.map((forecast: OutlookForecast, index: number) => (
                        <ChakraCard.Root key={index}>
                            <ChakraCard.Body>
                                <Text fontWeight="bold">{new Date(forecast.timestamp).toLocaleDateString()}</Text>
                                <HStack gap={2} mb={2}> {/* Changed spacing to gap */}
                                    <Text fontSize="xl">{getWeatherIcon(forecast.forecast.text)}</Text>
                                    <Text>{forecast.forecast.text}</Text>
                                </HStack>
                                {forecast.temperature && (
                                    <Text fontSize="sm">
                                        Temperature: {forecast.temperature.low}°C - {forecast.temperature.high}°C
                                    </Text>
                                )}
                            </ChakraCard.Body>
                        </ChakraCard.Root>
                    ))}
                </SimpleGrid>
            )}
        </Box>
    )
}

function WeatherStatistics() {
    const { data, isLoading, error } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
        queryKey: ["weather", "stats-forecast"], // Re-uses two-hour forecast for stats
        queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    })

    if (isLoading) return <Spinner />
    if (error || !data?.data) return <Text color="red.500">Error loading statistics</Text>

    if (!Array.isArray(data.data.items) || data.data.items.length === 0) {
        return <Text>No forecast data available for statistics</Text>
    }

    const forecasts = data.data.items[0]?.forecasts || []

    // Count forecast types
    const forecastCounts: Record<string, number> = {}
    forecasts.forEach((forecast: Forecast) => {
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
            <ChakraCard.Root mb={6}>
                <ChakraCard.Body>
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
                </ChakraCard.Body>
            </ChakraCard.Root>

            <Heading size="md" mb={4}>Weather Conditions Distribution</Heading>
            <VStack align="stretch" gap={3}> {/* Changed spacing to gap */}
                {sortedForecasts.map(item => (
                    <ChakraCard.Root key={item.forecast}>
                        <ChakraCard.Body>
                            <HStack justify="space-between">
                                <HStack>
                                    <Text fontSize="xl">{getWeatherIcon(item.forecast)}</Text>
                                    <Text fontWeight="medium">{item.forecast}</Text>
                                </HStack>
                                <Badge colorScheme="blue">
                                    {item.count} areas ({(item.count / totalAreas * 100).toFixed(1)}%)
                                </Badge>
                            </HStack>
                        </ChakraCard.Body>
                    </ChakraCard.Root>
                ))}
            </VStack>
        </Box>
    )
}

function WindDirection() {
    const { data, isLoading, error } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
        queryKey: ["weather", "wind-direction"],
        queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    })

    if (isLoading) return <Spinner />
    if (error || !data?.data) return <Text color="red.500">Error loading wind direction data</Text>

    const { stations = [], readings = [] } = data.data;

    if (stations.length === 0 || readings.length === 0) {
        return <Text>No wind direction data available</Text>
    }

    // Get the latest reading
    const latestReading = readings[0];
    if (!latestReading || !latestReading.data) {
        return <Text>No wind direction data available</Text>
    }

    // Create a map of station IDs to station names
    const stationMap = new Map(stations.map(station => [station.id, station.name]));

    // Calculate circular average direction (proper method for wind directions)
    const validReadings = latestReading.data.filter(reading => reading.value !== null);
    let avgDirection = 0;
    
    if (validReadings.length > 0) {
        // Convert degrees to radians, calculate vector average, then back to degrees
        const radians = validReadings.map(reading => (reading.value! * Math.PI) / 180);
        const sinSum = radians.reduce((sum, rad) => sum + Math.sin(rad), 0);
        const cosSum = radians.reduce((sum, rad) => sum + Math.cos(rad), 0);
        
        const avgRadians = Math.atan2(sinSum / validReadings.length, cosSum / validReadings.length);
        avgDirection = Math.round(((avgRadians * 180) / Math.PI + 360) % 360);
    }

    // Convert direction to cardinal points
    const getCardinalDirection = (degrees: number) => {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        const index = Math.round(degrees / 22.5) % 16
        return directions[index]
    }

    return (
        <Box>
            <VStack align="stretch" gap={4} mb={6}>
                <ChakraCard.Root>
                    <ChakraCard.Body>
                        <Heading size="md" mb={2}>Average Wind Direction</Heading>
                        <HStack>
                            <Text fontSize="3xl" fontWeight="bold">{avgDirection}°</Text>
                            <Text fontSize="2xl" ml={2}>({getCardinalDirection(avgDirection)})</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">Based on {validReadings.length} station readings</Text>
                        <Text fontSize="xs" color="gray.400" mt={1}>
                            Last updated: {new Date(latestReading.timestamp).toLocaleString()}
                        </Text>
                    </ChakraCard.Body>
                </ChakraCard.Root>
            </VStack>

            <Heading size="md" mb={4}>Wind Direction by Station</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {latestReading.data.slice(0, 9).map((reading: WindDataPoint) => (
                    <ChakraCard.Root key={reading.stationId}>
                        <ChakraCard.Body>
                            <Text fontWeight="bold" fontSize="sm">
                                {stationMap.get(reading.stationId) || reading.stationId}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                                {reading.stationId}
                            </Text>
                            <HStack>
                                <Text fontSize="2xl">{reading.value ?? 0}°</Text>
                                <Text>({getCardinalDirection(reading.value ?? 0)})</Text>
                            </HStack>
                        </ChakraCard.Body>
                    </ChakraCard.Root>
                ))}
            </SimpleGrid>
        </Box>
    )
}

function WeatherMap() {
    const { data, isLoading, error } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
        queryKey: ["weather", "air-temperature"],
        queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    });

    if (isLoading) return <Spinner />;
    if (error || !data?.data) return <Text color="red.500">Error loading map data</Text>;

    const { stations = [], readings = [] } = data.data;

    if (stations.length === 0 || readings.length === 0) {
        return <Text>No map data available</Text>;
    }

    // Get the latest reading
    const latestReading = readings[0];
    if (!latestReading || !latestReading.data) {
        return <Text>No map data available</Text>;
    }

    // Create a map of station IDs to station details
    const stationMap = new Map(stations.map(station => [station.id, station]));

    return (
        <MapContainer center={[1.3521, 103.8198]} zoom={11} style={{ height: "500px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {latestReading.data.map((reading) => {
                const station = stationMap.get(reading.stationId);
                if (!station) return null;

                return (
                    <Marker
                        key={reading.stationId}
                        position={[station.location.latitude, station.location.longitude]}
                    >
                        <Popup>
                            <Text fontWeight="bold">{station.name}</Text>
                            <Text>Temperature: {reading.value?.toFixed(1)}°C</Text>
                        </Popup>
                        <Text
                            position="absolute"
                            style={{
                                transform: "translate(-50%, -100%)",
                                backgroundColor: "white",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        >
                            {reading.value?.toFixed(1)}°C
                        </Text>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

// Define tab values for namespaced Tabs
const tabValues = {
    twoHour: "twoHourForecast",
    airTemp: "airTemperature",
    fourDay: "fourDayOutlook",
    stats: "weatherStatistics",
    windDir: "windDirection",
    weatherMap: "weatherMap",
}

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
    )
}

export default WeatherHub
