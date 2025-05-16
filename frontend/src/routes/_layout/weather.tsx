import React from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiRefreshCw } from "react-icons/fi"

import { WeatherService } from "@/client"
import WeatherErrorDisplay from "@/components/Weather/WeatherErrorDisplay"
import WeatherLoadingAnimation from "@/components/Weather/WeatherLoadingAnimation"
import WeatherForecast from "@/components/Weather/WeatherForecast"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/weather")({
  component: Weather,
})

function Weather() {
  const { showSuccessToast } = useCustomToast()
  const [selectedArea, setSelectedArea] = useState<string>("All Areas")

  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ["weather", "two-hour-forecast"],
    queryFn: () => WeatherService.getTwoHourForecast(),
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  })

  // Format date for display
  const formatUpdateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format the time when data was last fetched
  const formatLastFetchedTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

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

    const forecasts = data.data.items[0].forecasts
    if (selectedArea === "All Areas") {
      return forecasts
    }
    
    return forecasts.filter(forecast => forecast.area === selectedArea)
  }

  // Get unique areas for the dropdown
  const getUniqueAreas = () => {
    if (!data?.data?.items || data.data.items.length === 0) {
      return []
    }
    
    const areas = data.data.items[0].forecasts.map(f => f.area)
    return ["All Areas", ...areas].sort()
  }

  if (error) {
    return (
      <Container maxW="full">
        <Heading size="lg" pt={12} mb={6}>
          Singapore Weather Forecast
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
        Singapore Weather Forecast
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
                  {formatUpdateTime(data.data.items[0].update_timestamp)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Data fetched at: {formatLastFetchedTime(dataUpdatedAt)}
                </Text>
              </Box>
              
              <Flex gap={4} alignItems="center">
                <select
                  value={selectedArea}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedArea(e.target.value)}
                  style={{ 
                    padding: '0.5rem', 
                    borderRadius: '0.375rem',
                    minWidth: '200px',
                    fontSize: '0.875rem'
                  }}
                >
                  {getUniqueAreas().map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                
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
