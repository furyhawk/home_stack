import { Box, Flex, Spinner } from "@chakra-ui/react"
import { FiCloud, FiCloudDrizzle, FiCloudRain, FiSun } from "react-icons/fi"
import React from "react"

const WeatherLoadingAnimation: React.FC = () => {
  return (
    <Flex 
      direction="column" 
      alignItems="center" 
      justifyContent="center" 
      height="300px"
      gap={6}
    >
      <Flex gap={4} animation="fadeIn 2s ease-in-out infinite alternate">
        <Box fontSize="2xl" color="blue.400"><FiSun /></Box>
        <Box fontSize="2xl" color="gray.400"><FiCloud /></Box>
        <Box fontSize="2xl" color="blue.300"><FiCloudDrizzle /></Box>
        <Box fontSize="2xl" color="blue.600"><FiCloudRain /></Box>
      </Flex>
      <Spinner size="md" color="blue.400" />
    </Flex>
  )
}

export default WeatherLoadingAnimation
