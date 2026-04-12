import { Box, Flex, Text } from "@chakra-ui/react"

import type { FuryReading } from "./furyDashboardApi"

const DAY_IN_MS = 24 * 60 * 60 * 1000
const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const CHART_PADDING_X = 18
const CHART_PADDING_Y = 18
const MAX_POINTS = 72

interface SensorTrendChartProps {
  color: string
  readings: FuryReading[]
  title: string
  unit: string
}

const formatAxisValue = (value: number, unit: string) => {
  const digits = unit === "hPa" ? 1 : 0
  return `${value.toFixed(digits)}${unit}`
}

const formatTimeLabel = (isoDate: string) => {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate))
}

const getLastDayReadings = (readings: FuryReading[]) => {
  const since = Date.now() - DAY_IN_MS

  return readings
    .filter((reading) => new Date(reading.updateTime).getTime() >= since)
    .sort(
      (left, right) =>
        new Date(left.updateTime).getTime() - new Date(right.updateTime).getTime(),
    )
}

const downsampleReadings = (readings: FuryReading[]) => {
  if (readings.length <= MAX_POINTS) {
    return readings
  }

  const step = Math.ceil(readings.length / MAX_POINTS)
  const sampled = readings.filter((_, index) => index % step === 0)
  const lastReading = readings[readings.length - 1]

  if (sampled[sampled.length - 1]?.id !== lastReading?.id && lastReading) {
    sampled.push(lastReading)
  }

  return sampled
}

function SensorTrendChart({ color, readings, title, unit }: SensorTrendChartProps) {
  const dayReadings = downsampleReadings(getLastDayReadings(readings))

  if (dayReadings.length < 2) {
    return (
      <Box
        bg="gray.50"
        borderRadius="lg"
        minH="220px"
        p={4}
        borderWidth="1px"
        borderColor="gray.100"
      >
        <Text fontWeight="medium">{title}</Text>
        <Text color="gray.500" fontSize="sm" mt={2}>
          Not enough samples yet to draw a 24-hour chart.
        </Text>
      </Box>
    )
  }

  const values = dayReadings.map((reading) => reading.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1
  const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2
  const innerHeight = CHART_HEIGHT - CHART_PADDING_Y * 2

  const points = dayReadings.map((reading, index) => {
    const x =
      CHART_PADDING_X +
      (index / Math.max(dayReadings.length - 1, 1)) * innerWidth
    const normalizedValue = (reading.value - minValue) / valueRange
    const y = CHART_HEIGHT - CHART_PADDING_Y - normalizedValue * innerHeight

    return {
      reading,
      x,
      y,
    }
  })

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPath = [
    `M ${points[0]?.x} ${CHART_HEIGHT - CHART_PADDING_Y}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1]?.x} ${CHART_HEIGHT - CHART_PADDING_Y}`,
    "Z",
  ].join(" ")
  const midIndex = Math.floor(points.length / 2)
  const axisLevels = [maxValue, (maxValue + minValue) / 2, minValue]

  return (
    <Box>
      <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
        <Box>
          <Text fontWeight="medium">{title}</Text>
          <Text color="gray.500" fontSize="sm">
            Last 24 hours, sampled every few minutes
          </Text>
        </Box>
        <Box textAlign="right">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Range
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {formatAxisValue(minValue, unit)} to {formatAxisValue(maxValue, unit)}
          </Text>
        </Box>
      </Flex>

      <Box
        bg="gray.50"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.100"
        overflow="hidden"
        p={3}
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width="100%"
          height="220"
          role="img"
          aria-label={`${title} trend for the last 24 hours`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`trend-fill-${title}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {axisLevels.map((level) => {
            const normalizedValue = (level - minValue) / valueRange
            const y = CHART_HEIGHT - CHART_PADDING_Y - normalizedValue * innerHeight

            return (
              <g key={`${title}-${level}`}>
                <line
                  x1={CHART_PADDING_X}
                  x2={CHART_WIDTH - CHART_PADDING_X}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.28)"
                  strokeDasharray="4 6"
                />
                <text
                  x={CHART_WIDTH - CHART_PADDING_X}
                  y={y - 6}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="12"
                >
                  {formatAxisValue(level, unit)}
                </text>
              </g>
            )
          })}

          <path d={areaPath} fill={`url(#trend-fill-${title})`} />
          <polyline
            fill="none"
            points={linePoints}
            stroke={color}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="3"
          />

          {points.map((point, index) => {
            const isEdge = index === 0 || index === midIndex || index === points.length - 1

            if (!isEdge) {
              return null
            }

            return (
              <g key={`${point.reading.id}-${index}`}>
                <circle cx={point.x} cy={point.y} fill={color} r="4" />
                <circle cx={point.x} cy={point.y} fill="white" r="2" />
              </g>
            )
          })}
        </svg>

        <Flex justify="space-between" mt={2} color="gray.500" fontSize="xs">
          <Text>{formatTimeLabel(dayReadings[0].updateTime)}</Text>
          <Text>{formatTimeLabel(dayReadings[midIndex].updateTime)}</Text>
          <Text>{formatTimeLabel(dayReadings[dayReadings.length - 1].updateTime)}</Text>
        </Flex>
      </Box>
    </Box>
  )
}

export default SensorTrendChart