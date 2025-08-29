import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get count of courts by sport type
    const sportStats = await query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM courts
      WHERE is_active = true
      GROUP BY type
      ORDER BY count DESC
    `)

    // Map database sport types to Vietnamese display names
    const sportMapping = {
      'football': { name: 'Bóng đá mini', icon: '⚽' },
      'badminton': { name: 'Cầu lông', icon: '🏸' },
      'tennis': { name: 'Tennis', icon: '🎾' },
      'basketball': { name: 'Bóng rổ', icon: '🏀' },
      'volleyball': { name: 'Bóng chuyền', icon: '🏐' },
      'pickleball': { name: 'Pickleball', icon: '🏓' }
    }

    const formattedStats = sportStats.map(stat => ({
      type: stat.type,
      name: sportMapping[stat.type as keyof typeof sportMapping]?.name || stat.type,
      icon: sportMapping[stat.type as keyof typeof sportMapping]?.icon || '🏟️',
      count: parseInt(stat.count),
      displayCount: `${stat.count} sân`
    }))

    // Add missing sports with 0 count if they don't exist in database
    const allSportTypes = Object.keys(sportMapping)
    const existingTypes = sportStats.map(stat => stat.type)
    
    for (const sportType of allSportTypes) {
      if (!existingTypes.includes(sportType)) {
        formattedStats.push({
          type: sportType,
          name: sportMapping[sportType as keyof typeof sportMapping].name,
          icon: sportMapping[sportType as keyof typeof sportMapping].icon,
          count: 0,
          displayCount: '0 sân'
        })
      }
    }

    // Sort by count descending
    formattedStats.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: formattedStats
    })

  } catch (error) {
    console.error('Error fetching sports stats:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
