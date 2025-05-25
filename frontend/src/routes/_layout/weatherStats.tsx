import React from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Progress,
  Text,
  Icon,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { 
  FiRefreshCw, 
  FiSun, 
  FiCloud, 
  FiCloudRain, 
  FiCloudLightning, 
  FiWind, 
  FiHelpCircle 
} from "react-icons/fi"

import { WeatherService, WeatherUtils } from "@/client"
import WeatherErrorDisplay from "@/components/Weather/WeatherErrorDisplay"
import WeatherLoadingAnimation from "@/components/Weather/WeatherLoadingAnimation"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/weatherStats")({
  component: WeatherStats,
})

// Helper to get icon for a weather category
const getCategoryIcon = (category: WeatherUtils.WeatherCategory) => {
  switch (category) {
    case WeatherUtils.WeatherCategory.Sunny:
      return FiSun;
    case WeatherUtils.WeatherCategory.Cloudy:
      return FiCloud;
    case WeatherUtils.WeatherCategory.Rainy:
      return FiCloudRain;
    case WeatherUtils.WeatherCategory.Thundery:
      return FiCloudLightning;
    case WeatherUtils.WeatherCategory.Windy:
      return FiWind;
    default:
      return FiHelpCircle;
  }
};

// Helper to get color for a weather category
const getCategoryColor = (category: WeatherUtils.WeatherCategory) => {
  switch (category) {
    case WeatherUtils.WeatherCategory.Sunny:
      return "yellow";
    case WeatherUtils.WeatherCategory.Cloudy:
      return "gray";
    case WeatherUtils.WeatherCategory.Rainy:
      return "blue";
    case WeatherUtils.WeatherCategory.Thundery:
      return "purple";
    case WeatherUtils.WeatherCategory.Windy:
      return "teal";
    default:
      return "gray";
  }
};

function WeatherStats() {
  const { showSuccessToast } = useCustomToast()

  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ["weather", "two-hour-forecast", "stats"],
    queryFn: () => WeatherService.getTwoHourForecast(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  })

  // Handle manual refresh
  const handleRefresh = () => {
    refetch()
    showSuccessToast("Refreshing weather data")
  }

  // Extract forecasts using utilities
  const forecasts = WeatherUtils.extractForecasts(data);
  const validPeriod = WeatherUtils.extractValidPeriod(data);
  
  // Calculate statistics using utility
  const stats = forecasts.length > 0 ? WeatherUtils.calculateWeatherStatistics(forecasts) : null;

  if (error) {
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12} mb={6}>
          Singapore Weather Statistics
        </Heading>
        <Box bg="whiteAlpha.200" p={6} borderRadius="md" shadow="md">
          <WeatherErrorDisplay retry={handleRefresh} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} mb={6}>
        Singapore Weather Statistics
      </Heading>

      <Box bg="whiteAlpha.200" p={6} borderRadius="md" shadow="md">
        {isLoading ? (
          <WeatherLoadingAnimation />
        ) : stats && validPeriod ? (
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
                  {WeatherUtils.formatDate(data?.data?.items?.[0]?.update_timestamp || new Date())}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Data fetched at: {new Date(dataUpdatedAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </Box>
              
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

            <Box textAlign="center" mb={6}>
              <Badge colorScheme="blue" mb={2}>Valid Period</Badge>
              <Text fontWeight="medium">
                {WeatherUtils.formatForecastPeriod(validPeriod)}
              </Text>
              {validPeriod.text && (
                <Text fontSize="sm" mt={1}>
                  {validPeriod.text}
                </Text>
              )}
            </Box>
            
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                md: "1fr 1fr", 
                lg: "2fr 1fr" 
              }} 
              gap={6}
            >
              {/* Weather Category Distribution */}
              <Card>
                <CardHeader>
                  <Heading size="md">Weather Distribution</Heading>
                  <Text fontSize="sm" mt={1} color="gray.500">
                    Across {stats.totalAreas} areas in Singapore
                  </Text>
                </CardHeader>
                <CardBody>
                  {stats.categoryStats
                    .filter(stat => stat.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .map(stat => (
                      <Box key={stat.category} mb={4}>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Flex align="center" gap={2}>
                            <Icon 
                              as={getCategoryIcon(stat.category)} 
                              color={`${getCategoryColor(stat.category)}.500`} 
                            />
                            <Text fontWeight="medium">{stat.category}</Text>
                          </Flex>
                          <Text fontSize="sm">
                            {stat.count} areas ({Math.round(stat.percentage)}%)
                          </Text>
                        </Flex>
                        <Progress 
                          value={stat.percentage} 
                          colorScheme={getCategoryColor(stat.category)}
                          borderRadius="full"
                          size="sm"
                        />
                      </Box>
                    ))}
                </CardBody>
              </Card>
              
              {/* Most Common Forecasts */}
              <Card>
                <CardHeader>
                  <Heading size="md">Weather Summary</Heading>
                </CardHeader>
                <CardBody>
                  <Box mb={4}>
                    <Text fontWeight="medium" mb={1}>Most Common Forecast</Text>
                    {stats.mostCommon ? (
                      <Flex align="center" gap={2}>
                        <Icon 
                          as={getCategoryIcon(WeatherUtils.categorizeWeatherForecast(stats.mostCommon.forecast))} 
                          color={`${getCategoryColor(WeatherUtils.categorizeWeatherForecast(stats.mostCommon.forecast))}.500`}
                          boxSize={5}
                        />
                        <Text>{stats.mostCommon.forecast}</Text>
                        <Badge ml={2} colorScheme="blue">
                          {stats.mostCommon.count} areas
                        </Badge>
                      </Flex>
                    ) : (
                      <Text>No data available</Text>
                    )}
                  </Box>
                  
                  <Divider my={4} />
                  
                  <Box>
                    <Text fontWeight="medium" mb={3}>Forecasts by Category</Text>
                    
                    {Object.entries(stats.byCategory)
                      .filter(([_, forecasts]) => forecasts.length > 0)
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([category, forecasts]) => (
                        <Box key={category} mb={3}>
                          <Flex align="center" gap={2} mb={1}>
                            <Icon 
                              as={getCategoryIcon(category as WeatherUtils.WeatherCategory)} 
                              color={`${getCategoryColor(category as WeatherUtils.WeatherCategory)}.500`}
                            />
                            <Text fontWeight="medium">{category}</Text>
                            <Badge>{forecasts.length}</Badge>
                          </Flex>
                          
                          {forecasts.length <= 5 ? (
                            <Box pl={6}>
                              {forecasts.map(forecast => (
                                <Text key={forecast.area} fontSize="sm">
                                  {forecast.area}: {forecast.forecast}
                                </Text>
                              ))}
                            </Box>
                          ) : (
                            <Box pl={6}>
                              {forecasts.slice(0, 3).map(forecast => (
                                <Text key={forecast.area} fontSize="sm">
                                  {forecast.area}: {forecast.forecast}
                                </Text>
                              ))}
                              <Text fontSize="xs" color="gray.500">
                                + {forecasts.length - 3} more areas
                              </Text>
                            </Box>
                          )}
                        </Box>
                      ))}
                  </Box>
                </CardBody>
              </Card>
            </Grid>

            <Text mt={6} fontSize="xs" color="gray.500">
              Data provided by NEA through data.gov.sg API
            </Text>
          </>
        ) : (
          <Box textAlign="center" py={10}>
            <Text>No weather forecast data available at this time.</Text>
            <Button mt={4} onClick={handleRefresh}>
              Try Again
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}
