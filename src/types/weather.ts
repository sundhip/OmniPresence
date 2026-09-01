export type WeatherCondition =
  | "Sunny"
  | "Clear"
  | "Partly Cloudy"
  | "Cloudy"
  | "Rainy"
  | "Stormy"
  | "Snowy"
  | "Windy";

export interface WeatherContext {
  location: string;
  temperature: number; // in Celsius (°C)
  feelsLike: number; // in Celsius (°C)
  condition: WeatherCondition;
  precipitationProbability?: number; // 0-100%
  precipitationAmount?: number; // mm
  precipitation: string; // e.g. "No rain expected" or "Rain expected (65%)"
  humidity: number; // %
  windSpeed: number; // km/h
  uvIndex?: number | null; // UV index (0-11)
  isCached?: boolean;
  timestamp: string | number;
}
