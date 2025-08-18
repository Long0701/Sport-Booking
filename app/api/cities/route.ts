import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const cities = await query('SELECT id, name, latitude, longitude FROM cities ORDER BY name ASC')
    return NextResponse.json({ success: true, data: cities })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, latitude, longitude } = body
    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu' }, { status: 400 })
    }
    const result = await query(
      'INSERT INTO cities (name, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name, latitude, longitude]
    )
    return NextResponse.json({ success: true, data: result[0] ?? null }, { status: 201 })
  } catch (error) {
    console.error('Error creating city:', error)
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 })
  }
}


