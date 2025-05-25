import React from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Select,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiRefreshCw } from "react-icons/fi"

import { WeatherHub, ForecastType } from "@/client"
import WeatherErrorDisplay from "@/components/Weather/WeatherErrorDisplay"
import WeatherLoadingAnimation from "@/components/Weather/WeatherLoadingAnimation"
import WeatherForecast from "@/components/Weather/WeatherForecast"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/weatherHub")({
  component: WeatherHubExample,
})

function WeatherHubExample() {
  const { showSuccessToast } = useCustomToast()
  const [selectedArea, setSelectedArea] = useState<string>("All Areas")

  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ["weather", "two-hour-forecast", "hub"],
    queryFn: async () => {
      const result = await WeatherHub.getForecast(ForecastType.TwoHour);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch weather data");
      }
      
      return result.data;
    },
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  })

  // Handle manual refresh
  const handleRefresh = () => {
    refetch()
    showSuccessToast("Refreshing weather data")
  }

  // Filter forecasts by area if selected
  const getFilteredForecasts = () => {
    if (!data?.data?.items || data.data.items.length === 0) {
      return []
    }

    const forecasts = data.data.items[0].forecasts;
    return WeatherHub.filterByArea(forecasts, selectedArea);
  }

  // Get unique areas for the dropdown
  const getUniqueAreas = () => {
    if (!data?.data?.items || data.data.items.length === 0) {
      return []
    }
    
    const forecasts = data.data.items[0].forecasts;
    return WeatherHub.getUniqueAreas(forecasts);
  }

  if (error) {
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12} mb={6}>
          Singapore Weather Forecast (Hub)
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
        Singapore Weather Forecast (Hub)
      </Heading>

      <Box bg="whiteAlpha.200" p={6} borderRadius="md" shadow="md">
        {isLoading ? (
          <WeatherLoadingAnimation />
        ) : data?.data?.items && data.data.items.length > 0 ? (
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
                  {WeatherHub.formatDate(data.data.items[0].update_timestamp)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Data fetched at: {new Date(dataUpdatedAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
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

            <WeatherForecast 
              forecasts={getFilteredForecasts()} 
              validPeriod={data.data.items[0].valid_period}
              areaMetadata={data.data.area_metadata || []}
            />

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
