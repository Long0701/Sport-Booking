# Sport Booking App

A modern sports court booking application with AI-powered recommendations.

## Features

- Court search and booking
- Real-time weather integration
- AI-powered booking suggestions
- User authentication
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Weather API (Optional - for real-time weather data)
OPENWEATHER_API_KEY=your_openweather_api_key
```

### Weather API Setup

To get real-time weather data for court locations:

1. Sign up for a free API key at [OpenWeather](https://openweathermap.org/api)
2. Add your API key to `.env.local` as `OPENWEATHER_API_KEY`
3. The app will automatically use the court's address to get accurate weather data

Without the API key, the app will use mock weather data.

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /api/courts` - Get all courts
- `GET /api/courts/[id]` - Get court details
- `POST /api/bookings` - Create booking
- `GET /api/weather` - Get weather data (supports address or coordinates)
- `POST /api/ai-suggestions` - Get AI booking recommendations

