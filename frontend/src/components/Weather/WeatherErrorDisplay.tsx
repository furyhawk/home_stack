import { Box, Button, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import React from "react"
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi"

interface WeatherErrorDisplayProps {
  retry: () => void
}

const WeatherErrorDisplay: React.FC<WeatherErrorDisplayProps> = ({ retry }) => {
  return (
    <Box textAlign="center" py={10}>
      <VStack gap={4}>
        <Icon as={FiAlertTriangle} boxSize={10} color="red.500" />
        <Text fontSize="lg" fontWeight="bold">
          Unable to load weather data
        </Text>
        <Text color="gray.500">
          There was a problem fetching the weather forecast.
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
