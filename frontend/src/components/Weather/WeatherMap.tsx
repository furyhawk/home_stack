import { Box } from "@chakra-ui/react"
import React, { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "./leaflet-overrides.css"
import * as L from "leaflet"
import {
  FiCloud,
  FiCloudDrizzle,
  FiCloudLightning,
  FiCloudRain,
  FiCloudSnow,
  FiSun,
  FiWind,
} from "react-icons/fi"

import { Forecast, ForecastPeriod, AreaMetadata } from "@/client/types.gen"

// Fix for default markers not showing
// In a real app, you'd want to use proper image assets
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map forecast descriptions to icons (same as in WeatherForecast.tsx)
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

// Auto center map component
const MapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface WeatherMapProps {
  forecasts: Forecast[];
  validPeriod: ForecastPeriod;
  areaMetadata: AreaMetadata[];
}

const WeatherMap: React.FC<WeatherMapProps> = ({ 
  forecasts, 
  validPeriod,
  areaMetadata
}) => {
  // Singapore coordinates (centered on the island)
  const center: [number, number] = [1.3521, 103.8198];
  
  // Set default icon for markers
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);
  
  const getMarkerIconColor = (forecast: string) => {
    if (forecast.includes("Fair")) return "yellow.500";
    if (forecast.includes("Cloud") || forecast.includes("Hazy")) return "gray.400";
    if (forecast.includes("Rain") || forecast.includes("Shower")) return "blue.400";
    if (forecast.includes("Thunder")) return "purple.500";
    if (forecast.includes("Wind")) return "teal.400";
    if (forecast.includes("Snow")) return "blue.100";
    return "gray.500";
  };
  
  // Format the time
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  // Join area metadata with forecasts
  const forecastsWithLocations = forecasts.map(forecast => {
    const metadata = areaMetadata.find(area => area.name === forecast.area);
    return {
      ...forecast,
      location: metadata?.label_location
    };
  }).filter(f => f.location); // Only include forecasts with location data
  
  return (
    <Box height="500px" width="100%" borderRadius="md" overflow="hidden" my={4}>
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={center} />
        
        {forecastsWithLocations.map((forecast, index) => (
          <Marker 
            key={`${forecast.area}-${index}`}
            position={[forecast.location!.latitude, forecast.location!.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <Box p={1}>
                <Box fontWeight="bold">{forecast.area}</Box>
                <Box display="flex" alignItems="center" gap={2} my={1}>
                  {React.createElement(forecastIcons[forecast.forecast] || FiCloud, {
                    color: getMarkerIconColor(forecast.forecast),
                    size: 18
                  })}
                  <span>{forecast.forecast}</span>
                </Box>
                <Box fontSize="xs" mt={1}>
                  {formatDateTime(validPeriod.start)} - {formatDateTime(validPeriod.end)}
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default WeatherMap
