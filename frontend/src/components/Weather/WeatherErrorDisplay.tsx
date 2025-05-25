import { Box, Button, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import React from "react"
import { FiAlertTriangle, FiRefreshCw, FiCloud } from "react-icons/fi"

import { ApiError } from "@/client/core/ApiError"

interface WeatherErrorDisplayProps {
  retry: () => void;
  error?: Error | ApiError | unknown;
}

const WeatherErrorDisplay: React.FC<WeatherErrorDisplayProps> = ({ retry, error }) => {
  // Check if it's a no data available error
  const isNoDataAvailable = error instanceof ApiError && error.isNoDataAvailable;

  return (
    <Box textAlign="center" py={10}>
      <VStack gap={4}>
        <Icon 
          as={isNoDataAvailable ? FiCloud : FiAlertTriangle} 
          boxSize={10} 
          color={isNoDataAvailable ? "blue.500" : "red.500"} 
        />
        <Text fontSize="lg" fontWeight="bold">
          {isNoDataAvailable 
            ? "No weather forecast data available" 
            : "Unable to load weather data"}
        </Text>
        <Text color="gray.500">
          {isNoDataAvailable 
            ? "The weather service is not providing data at this time." 
            : "There was a problem fetching the weather forecast."}
        </Text>
        <Button onClick={retry}>
          <Flex gap={2} alignItems="center">
            <FiRefreshCw />
            <Text>Try again</Text>
          </Flex>
        </Button>
      </VStack>
    </Box>
  )
}

export default WeatherErrorDisplay
