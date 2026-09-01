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
  precipitation: string; // e.g. "No rain expected" or "Light rain (65%)"
  humidity: number; // %
  windSpeed: number; // km/h
  uvIndex?: number;
  isCached?: boolean;
  timestamp: string | number;
}
