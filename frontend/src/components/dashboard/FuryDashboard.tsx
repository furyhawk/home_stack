import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import useAuth from "@/hooks/useAuth"

import {
  type FuryDashboardData,
  type FuryMetricKey,
  fetchFuryDashboard,
  type FuryRange,
} from "./furyDashboardApi"
import SensorTrendChart from "./SensorTrendChart"

const metricAccent: Record<FuryMetricKey, string> = {
  humidity: "teal.500",
  pressure: "orange.500",
  temperature: "red.500",
}

const formatRelativeTime = (isoDate: string) => {
  const deltaInMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000),
  )

  if (deltaInMinutes < 1) {
    return "just now"
  }

  if (deltaInMinutes < 60) {
    return `${deltaInMinutes} min ago`
  }

  const hours = Math.floor(deltaInMinutes / 60)
  const minutes = deltaInMinutes % 60

  if (hours < 24) {
    return minutes === 0 ? `${hours} hr ago` : `${hours} hr ${minutes} min ago`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

const formatTimestamp = (isoDate: string) => {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(isoDate))
}

const formatValue = (value: number | null, unit: string) => {
  if (value === null || Number.isNaN(value)) {
    return "--"
  }

  const digits = unit === "hPa" ? 2 : 1
  return `${value.toFixed(digits)}${unit}`
}

const formatDelta = (current: number | undefined, previous: number | undefined, unit: string) => {
  if (current === undefined || previous === undefined) {
    return "No previous sample"
  }

  const delta = current - previous
  const sign = delta > 0 ? "+" : ""
  const digits = unit === "hPa" ? 2 : 1

  if (delta === 0) {
    return `Unchanged from last sample`
  }

  return `${sign}${delta.toFixed(digits)}${unit} vs last sample`
}

const buildComfortSummary = (dashboard: FuryDashboardData) => {
  const temperature = dashboard.metrics.temperature.latest?.value
  const humidity = dashboard.metrics.humidity.latest?.value
  const pressure = dashboard.metrics.pressure.latest?.value

  if (
    temperature === undefined ||
    humidity === undefined ||
    pressure === undefined
  ) {
    return "Waiting for enough sensor data to describe the current room state."
  }

  if (temperature >= 30 || humidity >= 75) {
    return "The room is running warm and humid right now. Ventilation or cooling would help."
  }

  if (temperature <= 24 && humidity <= 60) {
    return "Conditions look cool and dry."
  }

  if (pressure >= 1008) {
    return "Pressure is relatively steady while the room stays within a typical comfort band."
  }

  return "Conditions are stable, with moderate temperature and humidity."
}

function DashboardLoading() {
  return (
    <Container maxW="full" py={8}>
      <VStack align="stretch" gap={6}>
        <Card.Root>
          <Card.Body gap={4}>
            <Skeleton height="8" width="20rem" />
            <Skeleton height="4" width="28rem" />
            <Skeleton height="4" width="16rem" />
          </Card.Body>
        </Card.Root>
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card.Root key={`metric-skeleton-${index}`}>
              <Card.Body gap={3}>
                <Skeleton height="4" width="8rem" />
                <Skeleton height="10" width="10rem" />
                <Skeleton height="4" width="12rem" />
                <Skeleton height="24" />
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  )
}

function FuryDashboard() {
  const { user: currentUser } = useAuth()
  const [range, setRange] = useState<FuryRange>("24h")

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["fury-dashboard", range],
    queryFn: () => fetchFuryDashboard(range),
    refetchInterval: 60_000,
    retry: 1,
  })

  if (isLoading) {
    return <DashboardLoading />
  }

  if (error || !data) {
    return (
      <Container maxW="full" py={8}>
        <Card.Root>
          <Card.Body gap={4}>
            <Heading size="lg">Environment Dashboard</Heading>
            <Text color="red.500">
              Sensor data could not be loaded from the Furyhawk API proxy.
            </Text>
            <Button alignSelf="flex-start" onClick={() => refetch()}>
              Retry
            </Button>
          </Card.Body>
        </Card.Root>
      </Container>
    )
  }

  const latestSampleTimes = Object.values(data.metrics)
    .map((metric) => metric.latest?.updateTime)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) =>
      new Date(right).getTime() - new Date(left).getTime(),
    )
  const newestSampleTime = latestSampleTimes[0] ?? data.generatedAt
  const welcomeName = currentUser?.full_name || currentUser?.email || "there"

  return (
    <Container maxW="full" py={8}>
      <VStack align="stretch" gap={6}>
        <Card.Root overflow="hidden">
          <Card.Body
            bgGradient="linear(to-r, gray.900, gray.700)"
            color="white"
            gap={4}
            p={{ base: 5, md: 7 }}
          >
            <Flex
              align={{ base: "flex-start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
              justify="space-between"
            >
              <Box>
                <Text fontSize="sm" textTransform="uppercase" opacity={0.8}>
                  Hi, {welcomeName}
                </Text>
                <Heading size="xl" mt={1}>
                  Environment Dashboard
                </Heading>
                <Text mt={2} maxW="3xl" opacity={0.85}>
                  Live temperature, humidity, and pressure samples proxied from
                  api.furyhawk.lol.
                </Text>
              </Box>
              <HStack flexWrap="wrap" gap={3}>
                <Badge colorScheme="green">60s refresh</Badge>
                <Badge colorScheme="blue">
                  Latest sample {formatRelativeTime(newestSampleTime)}
                </Badge>
                {isFetching ? <Badge colorScheme="orange">Refreshing</Badge> : null}
              </HStack>
            </Flex>

            <HStack mt={3} gap={2}>
              {([
                ["24h", "24h"] ,
                ["1w", "1w"],
                ["1m", "1m"],
                ["3m", "3m"],
                ["1y", "1y"],
                ["3y", "3y"],
              ] as Array<[FuryRange, string]>).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={range === key ? "solid" : "ghost"}
                  onClick={() => setRange(key)}
                >
                  {label}
                </Button>
              ))}
            </HStack>

            <Text maxW="4xl">{buildComfortSummary(data)}</Text>
          </Card.Body>
        </Card.Root>

        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
          {Object.values(data.metrics).map((metric) => (
            <Card.Root key={metric.key}>
              <Card.Body gap={5}>
                <Flex justify="space-between" gap={4}>
                  <Box>
                    <Text color="gray.500" fontSize="sm" textTransform="uppercase">
                      {metric.label}
                    </Text>
                    <Heading size="2xl" mt={2} color={metricAccent[metric.key]}>
                      {metric.latest?.rawValue ?? "--"}
                    </Heading>
                  </Box>
                  <Badge alignSelf="flex-start" colorScheme="gray">
                    {metric.summary.count} pts / {range}
                  </Badge>
                </Flex>

                <Box>
                  <Text fontSize="sm" color="gray.500">
                    {metric.description}
                  </Text>
                  <Text fontSize="sm" mt={1}>
                    {formatDelta(
                      metric.latest?.value,
                      metric.previous?.value,
                      metric.unit,
                    )}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Updated {metric.latest ? formatRelativeTime(metric.latest.updateTime) : "--"}
                  </Text>
                </Box>

                <SimpleGrid columns={3} gap={3}>
                  <Box bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" p={3}>
                    <Text color="gray.500" _dark={{ color: "gray.400" }} fontSize="xs" textTransform="uppercase">
                      Average
                    </Text>
                    <Text fontWeight="semibold" mt={1} color="gray.900" _dark={{ color: "white" }}>
                      {formatValue(metric.summary.average, metric.unit)}
                    </Text>
                  </Box>
                  <Box bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" p={3}>
                    <Text color="gray.500" _dark={{ color: "gray.400" }} fontSize="xs" textTransform="uppercase">
                      Low
                    </Text>
                    <Text fontWeight="semibold" mt={1} color="gray.900" _dark={{ color: "white" }}>
                      {formatValue(metric.summary.min, metric.unit)}
                    </Text>
                  </Box>
                  <Box bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" p={3}>
                    <Text color="gray.500" _dark={{ color: "gray.400" }} fontSize="xs" textTransform="uppercase">
                      High
                    </Text>
                    <Text fontWeight="semibold" mt={1} color="gray.900" _dark={{ color: "white" }}>
                      {formatValue(metric.summary.max, metric.unit)}
                    </Text>
                  </Box>
                </SimpleGrid>

                <SensorTrendChart
                  color={metricAccent[metric.key]}
                  readings={metric.readings}
                  title={`${metric.label} Trend`}
                  unit={metric.unit}
                />
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>

        <Card.Root>
          <Card.Body gap={4}>
            <Flex
              align={{ base: "flex-start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={3}
              justify="space-between"
            >
              <Box>
                <Heading size="md">Recent Samples</Heading>
                <Text color="gray.500" mt={1}>
                  Latest synchronized sensor snapshots from the external telemetry API.
                </Text>
              </Box>
              <Text color="gray.500" fontSize="sm">
                Last fetch {formatTimestamp(data.generatedAt)}
              </Text>
            </Flex>

            <Table.Root size={{ base: "sm", md: "md" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader w="14rem">Timestamp</Table.ColumnHeader>
                  <Table.ColumnHeader>Temperature</Table.ColumnHeader>
                  <Table.ColumnHeader>Humidity</Table.ColumnHeader>
                  <Table.ColumnHeader>Pressure</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.recentSamples.map((sample) => (
                  <Table.Row key={sample.updateTime}>
                    <Table.Cell>{formatTimestamp(sample.updateTime)}</Table.Cell>
                    <Table.Cell>{sample.temperature ?? "--"}</Table.Cell>
                    <Table.Cell>{sample.humidity ?? "--"}</Table.Cell>
                    <Table.Cell>{sample.pressure ?? "--"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  )
}

export default FuryDashboard