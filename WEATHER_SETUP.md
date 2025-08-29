# Weather API Setup Guide

## OpenWeather API Integration

This project now includes real-time weather data for court locations using the OpenWeather API.

### Setup Instructions

1. **Get OpenWeather API Key**
   - Go to [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Add Environment Variable**
   Create a `.env.local` file in the root directory and add:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```

3. **Features Included**
   - Current weather conditions
   - Hourly forecast (next 24 hours)
   - 7-day daily forecast
   - Weather-based sports activity recommendations
   - Detailed weather metrics (humidity, wind speed, visibility, pressure)

### Weather Data Structure

The weather API returns:
- **Current**: Temperature, feels like, condition, humidity, wind speed, pressure, visibility
- **Hourly**: 8 time slots with temperature and conditions
- **Daily**: 7-day forecast with min/max temperatures

### Sports Recommendations

The system provides weather-based recommendations:
- ✅ Ideal conditions (25-35°C, no rain)
- ⚠️ High temperature warnings (>35°C)
- 🌧️ Rain alerts
- 💨 Strong wind warnings (>20 km/h)

### API Endpoints

- `GET /api/weather?lat={latitude}&lon={longitude}`
- Returns comprehensive weather data for the specified coordinates

### Error Handling

If no API key is provided or there's an error fetching weather data, the system will show an appropriate error message with a retry button.
