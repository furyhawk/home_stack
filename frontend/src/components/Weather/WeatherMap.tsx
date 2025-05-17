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
  
  // Generate a custom icon based on the weather forecast
  const createWeatherIcon = (forecast: string) => {
    // Determine color based on the forecast
    let color = "#718096"; // Default gray color
    if (forecast.includes("Fair")) color = "#ECC94B"; // yellow
    if (forecast.includes("Cloud") || forecast.includes("Hazy")) color = "#A0AEC0"; // gray
    if (forecast.includes("Rain") || forecast.includes("Shower")) color = "#4299E1"; // blue
    if (forecast.includes("Thunder")) color = "#9F7AEA"; // purple
    if (forecast.includes("Wind")) color = "#38B2AC"; // teal
    if (forecast.includes("Snow")) color = "#BEE3F8"; // light blue
    
    // Create an HTML element to render the icon
    const iconHtml = `<div style="
      background-color: white;
      border-radius: 50%;
      border: 2px solid ${color};
      width: 32px;
      height: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getIconPath(forecast)}
      </svg>
    </div>`;
    
    // Create a custom divIcon with the HTML content
    return L.divIcon({
      html: iconHtml,
      className: 'weather-icon-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };
  
  // Get SVG path for the icon based on forecast
  const getIconPath = (forecast: string) => {
    if (forecast.includes("Fair") || forecast.includes("Sun")) 
      return '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    if (forecast.includes("Cloudy") || forecast.includes("Hazy") || forecast.includes("Cloud") && !forecast.includes("Rain") && !forecast.includes("Drizzle"))
      return '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>';
    if (forecast.includes("Drizzle") || forecast.includes("Light Rain") || forecast.includes("Light Shower"))
      return '<line x1="8" y1="19" x2="8" y2="21"></line><line x1="8" y1="13" x2="8" y2="15"></line><line x1="16" y1="19" x2="16" y2="21"></line><line x1="16" y1="13" x2="16" y2="15"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="12" y1="15" x2="12" y2="17"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>';
    if (forecast.includes("Rain") || forecast.includes("Shower") && !forecast.includes("Thunder"))
      return '<line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>';
    if (forecast.includes("Thunder"))
      return '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline>';
    if (forecast.includes("Wind"))
      return '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>';
    if (forecast.includes("Snow"))
      return '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="8" y1="20" x2="8.01" y2="20"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="12" y1="22" x2="12.01" y2="22"></line><line x1="16" y1="16" x2="16.01" y2="16"></line><line x1="16" y1="20" x2="16.01" y2="20"></line>';
    // Default cloud icon
    return '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>';
  };
  
  // For backward compatibility, still set the default icon
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);
  
  // Helper function to get color for icons in popup
  const getIconColor = (forecast: string) => {
    if (forecast.includes("Fair")) return "#ECC94B"; // yellow
    if (forecast.includes("Cloud") || forecast.includes("Hazy")) return "#A0AEC0"; // gray
    if (forecast.includes("Rain") || forecast.includes("Shower")) return "#4299E1"; // blue
    if (forecast.includes("Thunder")) return "#9F7AEA"; // purple
    if (forecast.includes("Wind")) return "#38B2AC"; // teal
    if (forecast.includes("Snow")) return "#BEE3F8"; // light blue
    return "#718096"; // Default gray color
  };
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
            icon={createWeatherIcon(forecast.forecast)}
          >
            <Popup>
              <Box p={1}>
                <Box fontWeight="bold">{forecast.area}</Box>
                <Box display="flex" alignItems="center" gap={2} my={1}>
                  {React.createElement(forecastIcons[forecast.forecast] || FiCloud, {
                    color: getIconColor(forecast.forecast),
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
