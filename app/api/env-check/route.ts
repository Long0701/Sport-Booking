import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      WEATHER_API_KEY: process.env.WEATHER_API_KEY ? 'SET' : 'NOT SET',
      UPLOAD_SECRET: process.env.UPLOAD_SECRET ? 'SET' : 'NOT SET'
    },
    message: 'Check the environment variables above. You need to set DATABASE_URL and JWT_SECRET at minimum.'
  })
}
