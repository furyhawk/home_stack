// filepath: /home/user/projects/home_stack/frontend/src/routes/_layout/weather-hub.tsx
import { useState, useEffect } from "react"
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
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

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

// Auto center map component
const MapCenter = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

// Singapore coordinates (centered on the island)
const center: [number, number] = [1.3521, 103.8198];

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
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('map')

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
    const areaMetadata = data.data.area_metadata || []

    // Get unique areas for dropdown
    const areaNames = forecasts.map((f: Forecast) => f.area)
    const uniqueAreas: string[] = ["All Areas", ...Array.from(new Set(areaNames)).sort()]

    // Filter forecasts by selected area
    const filteredForecasts = selectedArea.includes("All Areas")
        ? forecasts
        : forecasts.filter((forecast: Forecast) => selectedArea.includes(forecast.area))

    // Create weather icon for map markers
    const createWeatherIcon = (forecast: string, area: string) => {
        let color = "#718096"; // Default gray color
        if (forecast.includes("Fair")) color = "#ECC94B"; // yellow
        if (forecast.includes("Cloud") || forecast.includes("Hazy")) color = "#A0AEC0"; // gray
        if (forecast.includes("Rain") || forecast.includes("Shower")) color = "#4299E1"; // blue
        if (forecast.includes("Thunder")) color = "#9F7AEA"; // purple
        if (forecast.includes("Wind")) color = "#38B2AC"; // teal

        const iconHtml = `
            <div style="
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid ${color};
                border-radius: 8px;
                padding: 6px 8px;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                min-width: 80px;
                max-width: 120px;
                transform: translate(-50%, -100%);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            ">
                <div style="font-size: 18px; margin-bottom: 4px;">${getWeatherIcon(forecast)}</div>
                <div style="color: #2D3748; font-size: 10px; margin-bottom: 2px;">${area}</div>
                <div style="color: #4A5568; font-size: 9px; line-height: 1.2;">${forecast}</div>
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-weather-marker',
            iconSize: [80, 60],
            iconAnchor: [40, 60],
            popupAnchor: [0, -60]
        });
    };

    // Filter forecasts with location data for map view
    const forecastsWithLocation = forecasts.map(forecast => {
        const metadata = areaMetadata.find(area => area.name === forecast.area);
        return {
            ...forecast,
            location: metadata?.label_location
        };
    }).filter(f => f.location && (selectedArea.includes("All Areas") || selectedArea.includes(f.area)));

    return (
        <Box>
            {validPeriod && (
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Text fontWeight="medium">
                        Valid: {new Date(validPeriod.start).toLocaleTimeString()} - {new Date(validPeriod.end).toLocaleTimeString()}
                    </Text>
                    <HStack gap={4}>
                        {/* View Mode Toggle */}
                        <HStack>
                            <Badge
                                variant={viewMode === 'grid' ? 'solid' : 'outline'}
                                colorScheme="blue"
                                cursor="pointer"
                                onClick={() => setViewMode('grid')}
                                px={3}
                                py={1}
                            >
                                Grid
                            </Badge>
                            <Badge
                                variant={viewMode === 'map' ? 'solid' : 'outline'}
                                colorScheme="blue"
                                cursor="pointer"
                                onClick={() => setViewMode('map')}
                                px={3}
                                py={1}
                            >
                                Map
                            </Badge>
                        </HStack>

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
                    </HStack>
                </Flex>
            )}

            {viewMode === 'grid' && (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                    {filteredForecasts.map((forecast: Forecast) => (
                        <ChakraCard.Root key={forecast.area}>
                            <ChakraCard.Body>
                                <HStack mb={2} gap={2}>
                                    <Text fontSize="xl">{getWeatherIcon(forecast.forecast)}</Text>
                                    <Heading size="md">{forecast.area}</Heading>
                                </HStack>
                                <Text>{forecast.forecast}</Text>
                            </ChakraCard.Body>
                        </ChakraCard.Root>
                    ))}
                </SimpleGrid>
            )}

            {viewMode === 'map' && (
                <Box height="500px" width="100%" borderRadius="md" overflow="hidden" my={4}>
                    {forecastsWithLocation.length > 0 ? (
                        <MapContainer
                            center={center}
                            zoom={11}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                            />
                            <MapCenter center={center} />
                            <MapInvalidator />
                            {forecastsWithLocation.map((forecast, index) => (
                                <Marker
                                    key={`${forecast.area}-${index}`}
                                    position={[forecast.location!.latitude, forecast.location!.longitude]}
                                    icon={createWeatherIcon(forecast.forecast, forecast.area)}
                                />
                            ))}
                        </MapContainer>
                    ) : (
                        <Flex
                            height="500px"
                            alignItems="center"
                            justifyContent="center"
                            bg="gray.50"
                            borderRadius="md"
                        >
                            <VStack>
                                <Text fontSize="lg" color="gray.600">No location data available for map view</Text>
                                <Text fontSize="sm" color="gray.500">
                                    Area metadata is required to display forecasts on the map
                                </Text>
                            </VStack>
                        </Flex>
                    )}
                </Box>
            )}
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

// Component to handle map invalidation when tab becomes visible
function MapInvalidator() {
    const map = useMap();

    useEffect(() => {
        // Invalidate size after mount and on window resize
        const timer = setTimeout(() => map.invalidateSize(), 100);
        const handleResize = () => map.invalidateSize();
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);

    return null;
}

function WeatherMap() {
    // Fetch air temperature data
    const { data: tempData, isLoading: tempLoading, error: tempError } = useQuery<ApiNestedResponse<AirTemperaturePayload>>({
        queryKey: ["weather", "air-temperature"],
        queryFn: () => WeatherService.getAirTemperature() as Promise<ApiNestedResponse<AirTemperaturePayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    });

    // Fetch wind direction data
    const { data: windData, isLoading: windLoading, error: windError } = useQuery<ApiNestedResponse<WindDirectionPayload>>({
        queryKey: ["weather", "wind-direction"],
        queryFn: () => WeatherService.getWindDirection() as Promise<ApiNestedResponse<WindDirectionPayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    });

    // Fetch forecast data for weather icons
    const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery<ApiNestedResponse<TwoHourForecastPayload>>({
        queryKey: ["weather", "two-hour-forecast"],
        queryFn: () => WeatherService.getTwoHourForecast() as Promise<ApiNestedResponse<TwoHourForecastPayload>>,
        refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    });

    if (tempLoading || windLoading || forecastLoading) return <Spinner />;
    if (tempError || windError || forecastError || !tempData?.data || !windData?.data || !forecastData?.data) {
        return <Text color="red.500">Error loading map data</Text>;
    }

    const { stations: tempStations = [], readings: tempReadings = [] } = tempData.data;
    const { readings: windReadings = [] } = windData.data;
    const forecasts = forecastData.data.items?.[0]?.forecasts || [];

    if (tempStations.length === 0 || tempReadings.length === 0) {
        return <Text>No map data available</Text>;
    }

    // Get the latest readings
    const latestTempReading = tempReadings[0];
    const latestWindReading = windReadings[0];

    if (!latestTempReading || !latestTempReading.data) {
        return <Text>No map data available</Text>;
    }

    // Create maps for easy lookup
    const tempStationMap = new Map(tempStations.map(station => [station.id, station]));
    const windDataMap = new Map(latestWindReading?.data?.map(reading => [reading.stationId, reading.value]) || []);

    // Function to get cardinal direction from degrees
    const getCardinalDirection = (degrees: number | null | undefined) => {
        if (degrees === null || degrees === undefined) return "N/A";
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    };

    // Function to get weather forecast for a location (simplified - using first forecast as general condition)
    const getWeatherForLocation = () => {
        if (forecasts.length > 0) {
            return forecasts[0].forecast; // Use the first available forecast as general condition
        }
        return "Fair";
    };

    const generalWeather = getWeatherForLocation();

    return (
        // <Box height="500px" width="100%" borderRadius="md" overflow="hidden" my={4}>
            <MapContainer
                center={center}
                zoom={11}
                style={{ height: "500px", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                />
                {/* <MapCenter center={center} /> */}
                <MapInvalidator />

                {latestTempReading.data.map((reading) => {
                    const station = tempStationMap.get(reading.stationId);
                    if (!station || reading.value === null) return null;

                    const windDirection = windDataMap.get(reading.stationId);
                    const cardinalDirection = getCardinalDirection(windDirection);

                    return (
                        <Marker
                            key={reading.stationId}
                            position={[station.location.latitude, station.location.longitude]}
                            icon={L.divIcon({
                                html: `
                                <div style="
                                    background: rgba(255, 255, 255, 0.95);
                                    border: 2px solid #4A90E2;
                                    border-radius: 8px;
                                    padding: 4px 6px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    text-align: center;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    min-width: 60px;
                                    transform: translate(-50%, -100%);
                                ">
                                    <div style="font-size: 14px; margin-bottom: 2px;">${getWeatherIcon(generalWeather)}</div>
                                    <div style="color: #E53E3E; font-size: 12px;">${reading.value.toFixed(1)}°C</div>
                                    <div style="color: #2D3748; font-size: 10px;">${cardinalDirection}</div>
                                </div>
                            `,
                                className: 'custom-weather-marker',
                                iconSize: [60, 50],
                                iconAnchor: [30, 50]
                            })}
                        />
                    );
                })}
            </MapContainer>
        // </Box>
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
