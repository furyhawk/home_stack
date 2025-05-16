import { Box, Flex, Grid, Heading, Icon, Text } from "@chakra-ui/react"
import React from "react"
import { FiCloud } from "react-icons/fi"

import { Forecast, ForecastPeriod } from "@/client/types.gen"

interface WeatherForecastProps {
  forecasts: Forecast[]
  validPeriod: ForecastPeriod
}

const WeatherForecastDisplay: React.FC<WeatherForecastProps> = ({
  forecasts,
  validPeriod,
}) => {
  // Format the start and end dates
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <Box>
      <Box mb={4} textAlign="center">
        <Text fontSize="md" fontWeight="bold">
          Valid Period:
        </Text>
        <Text fontSize="sm">
          {formatDateTime(validPeriod.start)} - {formatDateTime(validPeriod.end)}
        </Text>
        <Text mt={2} fontSize="sm" fontStyle="italic">
          Forecast: {validPeriod.text}
        </Text>
      </Box>
      
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {forecasts.map((forecast, index) => (
          <Box 
            key={`${forecast.area}-${index}`}
            borderWidth="1px" 
            borderRadius="md" 
            p={3}
            boxShadow="sm"
          >
            <Box pb={2}>
              <Heading size="sm" truncate>
                {forecast.area}
              </Heading>
            </Box>
            <Flex direction="column" alignItems="center">
              <Icon as={FiCloud} boxSize={8} mb={2} />
              <Text fontSize="sm" textAlign="center">
                {forecast.forecast}
              </Text>
            </Flex>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

export default WeatherForecastDisplay
