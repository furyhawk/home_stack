import {
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  Text,
  Button,
  ButtonGroup,
} from "@chakra-ui/react"
import React, { useState } from "react"
import {
  FiCloud,
  FiCloudDrizzle,
  FiCloudLightning,
  FiCloudRain,
  FiCloudSnow,
  FiSun,
  FiWind,
  FiMap,
  FiList,
} from "react-icons/fi"

import { AreaMetadata, Forecast, ForecastPeriod } from "@/client/types.gen"
import WeatherMap from "./WeatherMap"

// Map forecast descriptions to icons
const forecastIcons: Record<string, React.ElementType> = {
  "Fair (Day)": FiSun,
  "Fair (Night)": FiSun,
  "Partly Cloudy (Day)": FiCloud,
  "Partly Cloudy (Night)": FiCloud,
  Cloudy: FiCloud,
  "Hazy": FiCloud,
  "Slightly Hazy": FiCloud,
  Windy: FiWind,
  "Light Rain": FiCloudDrizzle,
  "Moderate Rain": FiCloudRain,
  "Heavy Rain": FiCloudRain,
  "Passing Showers": FiCloudDrizzle,
  "Light Showers": FiCloudDrizzle,
  "Showers": FiCloudRain,
  "Heavy Showers": FiCloudRain,
  "Thundery Showers": FiCloudLightning,
  "Heavy Thundery Showers": FiCloudLightning,
  "Heavy Thundery Showers with Gusty Winds": FiCloudLightning,
  Snow: FiCloudSnow,
}

interface ForecastCardProps {
  forecast: Forecast
}

const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  const WeatherIcon = forecastIcons[forecast.forecast] || FiCloud

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="md" 
      p={3} 
      height="100%"
      boxShadow="sm"
    >
      <Box pb={2}>
        <Heading size="sm" truncate>
          {forecast.area}
        </Heading>
      </Box>
      <Box>
        <Flex direction="column" alignItems="center">
          <Icon as={WeatherIcon} boxSize={8} mb={2} />
          <Text fontSize="sm" textAlign="center" title={forecast.forecast}>
            {forecast.forecast}
          </Text>
        </Flex>
      </Box>
    </Box>
  )
}

interface ForecastPeriodDisplayProps {
  validPeriod: ForecastPeriod
}

const ForecastPeriodDisplay: React.FC<ForecastPeriodDisplayProps> = ({
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
  )
}

interface WeatherForecastProps {
  forecasts: Forecast[]
  validPeriod: ForecastPeriod
  areaMetadata: AreaMetadata[]
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({
  forecasts,
  validPeriod,
  areaMetadata,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  return (
    <Box>
      <ForecastPeriodDisplay validPeriod={validPeriod} />
      
      <Flex justifyContent="center" mb={4}>
        <ButtonGroup attached variant="outline" size="sm">
          <Button 
            onClick={() => setViewMode('grid')}
            colorScheme={viewMode === 'grid' ? "blue" : undefined}
          >
            <Flex alignItems="center" gap={2}>
              <FiList />
              <Text>Grid View</Text>
            </Flex>
          </Button>
          <Button 
            onClick={() => setViewMode('map')}
            colorScheme={viewMode === 'map' ? "blue" : undefined}
          >
            <Flex alignItems="center" gap={2}>
              <FiMap />
              <Text>Map View</Text>
            </Flex>
          </Button>
        </ButtonGroup>
      </Flex>
      
      {viewMode === 'grid' && (
        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
            xl: "repeat(5, 1fr)",
          }}
          gap={4}
        >
          {forecasts.map((forecast, index) => (
            <ForecastCard key={`${forecast.area}-${index}`} forecast={forecast} />
          ))}
        </Grid>
      )}
      
      {viewMode === 'map' && (
        <WeatherMap 
          forecasts={forecasts} 
          validPeriod={validPeriod} 
          areaMetadata={areaMetadata} 
        />
      )}
    </Box>
  )
}

export default WeatherForecast
