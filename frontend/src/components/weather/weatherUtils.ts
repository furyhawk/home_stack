// Utility function to get weather icon based on forecast text
export function getWeatherIcon(forecast: string): string {
    if (typeof forecast !== 'string' || forecast === null) {
        return "❓"; // Default icon for unknown or invalid forecast type
    }

    const lowerCaseForecast = forecast.toLowerCase();

    if (lowerCaseForecast.includes("thundery")) return "⛈️";
    if (lowerCaseForecast.includes("rain")) return "🌧️";
    if (lowerCaseForecast.includes("showers")) return "🌦️";
    if (lowerCaseForecast.includes("cloudy")) return "☁️";
    if (lowerCaseForecast.includes("fair")) return "🌤️";
    if (lowerCaseForecast.includes("hazy")) return "🌫️";
    if (lowerCaseForecast.includes("windy")) return "💨";
    if (lowerCaseForecast.includes("sunny")) return "☀️";

    return "🌈";
}
