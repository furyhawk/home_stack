import React from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Select,
  Badge,
  Icon,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { 
  FiRefreshCw, 
  FiThermometer, 
  FiWind, 
  FiCloud, 
  FiSun,
  FiCloudLightning 
} from "react-icons/fi"

import { WeatherHub, ForecastType, WeatherDataType } from "@/client"
import WeatherErrorDisplay from "@/components/Weather/WeatherErrorDisplay"
import WeatherLoadingAnimation from "@/components/Weather/WeatherLoadingAnimation"
import WeatherForecast from "@/components/Weather/WeatherForecast"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/weatherDashboard")({
  component: WeatherDashboard,
})

function WeatherDashboard() {
  const { showSuccessToast } = useCustomToast()
  const [selectedArea, setSelectedArea] = useState<string>("All Areas")

  // Get comprehensive dashboard data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ["weather", "dashboard"],
    queryFn: () => WeatherHub.getWeatherDashboard(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  })    // Get 24-hour forecast
    const {
      data: extendedForecastData,
      isLoading: isExtendedLoading,
      error: extendedError,
      refetch: refetchExtended
    } = useQuery({
      queryKey: ["weather", "extended-forecast"],
      queryFn: async () => {
        const result = await WeatherHub.getForecast(ForecastType.TwentyFourHour);
        if (!result.success) {
          // Create an error object with isNoDataAvailable flag if needed
          const error = new Error(result.error || "Failed to fetch extended forecast data");
          if (result.isNoDataAvailable) {
            Object.assign(error, { isNoDataAvailable: true });
          }
          throw error;
        }
        return result.data;
      },
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
    staleTime: 1000 * 60 * 30, // Consider data stale after 30 minutes
  })

  // Handle manual refresh
  const handleRefresh = () => {
    refetchDashboard();
    refetchExtended();
    showSuccessToast("Refreshing weather data")
  }

  // Check if we have two-hour forecast data
  const twoHourForecast = dashboardData?.twoHourForecast?.data?.items?.[0];
  const forecasts = twoHourForecast?.forecasts || [];
  const validPeriod = twoHourForecast?.valid_period;
  const areaMetadata = dashboardData?.twoHourForecast?.data?.area_metadata || [];

  // Filter forecasts by area if selected
  const getFilteredForecasts = () => {
    return WeatherHub.filterByArea(forecasts, selectedArea);
  }

  // Get unique areas for the dropdown
  const getUniqueAreas = () => {
    return WeatherHub.getUniqueAreas(forecasts);
  }

  // Extract temperature data
  const temperatures = dashboardData?.airTemperature?.data?.readings || [];
  
  // Extract wind data
  const windData = dashboardData?.windDirection?.data?.readings || [];

  // Helper to format times
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (dashboardError || extendedError) {
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12} mb={6}>
          Singapore Weather Dashboard
        </Heading>
        <Box bg="whiteAlpha.200" p={6} borderRadius="md" shadow="md">
          <WeatherErrorDisplay retry={handleRefresh} error={dashboardError || extendedError} />
        </Box>
      </Container>
    )
  }

  const isLoading = isDashboardLoading || isExtendedLoading;

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={6}>
        Singapore Weather Dashboard
      </Heading>

      <Box bg="whiteAlpha.200" p={6} borderRadius="md" shadow="md">
        {isLoading ? (
          <WeatherLoadingAnimation />
        ) : dashboardData?.success && twoHourForecast ? (
          <>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              justifyContent="space-between" 
              alignItems={{ base: "flex-start", md: "center" }}
              mb={6}
              gap={4}
            >
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Last Updated:{" "}
                  {WeatherHub.formatDate(twoHourForecast.update_timestamp)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Data fetched at: {formatTime(dataUpdatedAt)}
                </Text>
              </Box>
              
              <Flex gap={4} alignItems="center">
                <Select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  minW="200px"
                  size="sm"
                >
                  {getUniqueAreas().map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </Select>
                
                <Button 
                  size="sm"
                  onClick={handleRefresh}
                >
                  <Flex alignItems="center" gap={2}>
                    <FiRefreshCw />
                    <Text>Refresh</Text>
                  </Flex>
                </Button>
              </Flex>
            </Flex>

            <Tabs variant="enclosed" colorScheme="blue" mb={6}>
              <TabList>
                <Tab>2-Hour Forecast</Tab>
                <Tab>Current Conditions</Tab>
                <Tab>24-Hour Outlook</Tab>
              </TabList>
              
              <TabPanels>
                {/* 2-Hour Forecast Tab */}
                <TabPanel>
                  {validPeriod && (
                    <Box textAlign="center" mb={4}>
                      <Badge colorScheme="blue" mb={2}>Valid Period</Badge>
                      <Text fontWeight="medium">
                        {WeatherHub.formatForecastPeriod(validPeriod)}
                      </Text>
                    </Box>
                  )}
                  
                  <WeatherForecast 
                    forecasts={getFilteredForecasts()} 
                    validPeriod={validPeriod!}
                    areaMetadata={areaMetadata}
                  />
                </TabPanel>
                
                {/* Current Conditions Tab */}
                <TabPanel>
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "repeat(2, 1fr)",
                      xl: "repeat(3, 1fr)"
                    }}
                    gap={6}
                  >
                    {/* Temperature Readings */}
                    <Card>
                      <CardHeader>
                        <Flex alignItems="center" gap={2}>
                          <Icon as={FiThermometer} color="red.500" />
                          <Heading size="md">Air Temperature</Heading>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Box maxH="300px" overflowY="auto">
                          {temperatures.length > 0 ? (
                            temperatures.slice(0, 10).map((reading) => (
                              <Stat key={reading.station_id} mb={4}>
                                <StatLabel>{reading.station_id}</StatLabel>
                                <StatNumber>{reading.value}°C</StatNumber>
                                <StatHelpText>
                                  {dashboardData?.airTemperature?.data?.readingType || "Temperature"}
                                </StatHelpText>
                              </Stat>
                            ))
                          ) : (
                            <Text>No temperature data available</Text>
                          )}
                          {temperatures.length > 10 && (
                            <Text color="gray.500" fontSize="sm" textAlign="center">
                              + {temperatures.length - 10} more stations
                            </Text>
                          )}
                        </Box>
                      </CardBody>
                    </Card>
                    
                    {/* Wind Direction Readings */}
                    <Card>
                      <CardHeader>
                        <Flex alignItems="center" gap={2}>
                          <Icon as={FiWind} color="blue.500" />
                          <Heading size="md">Wind Direction</Heading>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Box maxH="300px" overflowY="auto">
                          {windData.length > 0 ? (
                            windData.slice(0, 10).map((reading) => (
                              <Stat key={reading.station_id} mb={4}>
                                <StatLabel>{reading.station_id}</StatLabel>
                                <StatNumber>{reading.value}°</StatNumber>
                                <StatHelpText>
                                  {dashboardData?.windDirection?.data?.readingType || "Direction"}
                                </StatHelpText>
                              </Stat>
                            ))
                          ) : (
                            <Text>No wind data available</Text>
                          )}
                          {windData.length > 10 && (
                            <Text color="gray.500" fontSize="sm" textAlign="center">
                              + {windData.length - 10} more stations
                            </Text>
                          )}
                        </Box>
                      </CardBody>
                    </Card>
                    
                    {/* General Weather Summary */}
                    <Card>
                      <CardHeader>
                        <Flex alignItems="center" gap={2}>
                          <Icon as={FiCloud} color="purple.500" />
                          <Heading size="md">Weather Summary</Heading>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        {validPeriod ? (
                          <>
                            <Flex alignItems="center" gap={3} mb={4}>
                              <Icon as={FiSun} boxSize={8} color="yellow.500" />
                              <Box>
                                <Text fontWeight="bold">Forecast Period</Text>
                                <Text>{WeatherHub.formatForecastPeriod(validPeriod)}</Text>
                              </Box>
                            </Flex>
                            
                            <Box mb={4}>
                              <Text fontWeight="bold">General Outlook</Text>
                              <Text>{validPeriod.text || "Not specified"}</Text>
                            </Box>
                            
                            <Box>
                              <Text fontWeight="bold">Most Common Forecast</Text>
                              <Text>
                                {(() => {
                                  const forecastTypes = forecasts.map(f => f.forecast);
                                  const counts = forecastTypes.reduce((acc, curr) => {
                                    acc[curr] = (acc[curr] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>);
                                  
                                  const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                                  return mostCommon ? `${mostCommon[0]} (${mostCommon[1]} areas)` : "No data";
                                })()}
                              </Text>
                            </Box>
                          </>
                        ) : (
                          <Text>No forecast summary available</Text>
                        )}
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>
                
                {/* 24-Hour Outlook Tab */}
                <TabPanel>
                  {extendedForecastData?.data?.records && extendedForecastData.data.records.length > 0 ? (
                    <Box>
                      <Box mb={6}>
                        <Heading size="md" mb={3}>24-Hour General Forecast</Heading>
                        
                        {extendedForecastData.data.records.map((record, index) => (
                          <Card key={index} mb={4}>
                            <CardHeader>
                              <Flex justifyContent="space-between" alignItems="center">
                                <Heading size="sm">{record.date}</Heading>
                                <Text fontSize="sm" color="gray.500">
                                  Updated: {WeatherHub.formatDate(record.updatedTimestamp, { 
                                    hour: '2-digit',
                                    minute: '2-digit' 
                                  })}
                                </Text>
                              </Flex>
                            </CardHeader>
                            <CardBody>
                              {record.general && (
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                                  <Box>
                                    <Text fontWeight="bold">Valid Period</Text>
                                    <Text>
                                      {record.general.validPeriod ? (
                                        `${WeatherHub.formatDate(record.general.validPeriod.start, { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          day: 'numeric',
                                          month: 'short'
                                        })} - ${WeatherHub.formatDate(record.general.validPeriod.end, { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          day: 'numeric',
                                          month: 'short' 
                                        })}`
                                      ) : "Not specified"}
                                    </Text>
                                  </Box>
                                  
                                  <Box>
                                    <Text fontWeight="bold">Forecast</Text>
                                    <Flex alignItems="center" gap={2}>
                                      <Icon as={FiCloudLightning} />
                                      <Text>{record.general.forecast?.text || "Not available"}</Text>
                                    </Flex>
                                  </Box>
                                  
                                  <Box>
                                    <Text fontWeight="bold">Temperature</Text>
                                    <Text>
                                      {record.general.temperature ? (
                                        `${record.general.temperature.low}°C - ${record.general.temperature.high}°C`
                                      ) : "Not available"}
                                    </Text>
                                  </Box>
                                  
                                  <Box>
                                    <Text fontWeight="bold">Relative Humidity</Text>
                                    <Text>
                                      {record.general.relativeHumidity ? (
                                        `${record.general.relativeHumidity.low}% - ${record.general.relativeHumidity.high}%`
                                      ) : "Not available"}
                                    </Text>
                                  </Box>
                                  
                                  <Box>
                                    <Text fontWeight="bold">Wind</Text>
                                    <Text>
                                      {record.general.wind ? (
                                        `${record.general.wind.direction} ${record.general.wind.speed?.low || ""}-${record.general.wind.speed?.high || ""} ${record.general.wind.speed?.unit || ""}`
                                      ).trim() : "Not available"}
                                    </Text>
                                  </Box>
                                </Grid>
                              )}
                            </CardBody>
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={6}>
                      <Text>No extended forecast data available at this time.</Text>
                      <Button mt={4} onClick={() => refetchExtended()}>
                        <Flex alignItems="center" gap={2}>
                          <FiRefreshCw />
                          <Text>Refresh Extended Forecast</Text>
                        </Flex>
                      </Button>
                    </Box>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Text mt={6} fontSize="xs" color="gray.500">
              Data provided by NEA through data.gov.sg API
            </Text>
          </>
        ) : (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" fontWeight="bold">
              No weather dashboard data available at this time.
            </Text>
            <Text color="gray.500" mb={4}>
              The weather service is not providing data at this moment.
            </Text>
            <Button onClick={handleRefresh}>
              <Flex alignItems="center" gap={2}>
                <FiRefreshCw />
                <Text>Try Again</Text>
              </Flex>
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}
