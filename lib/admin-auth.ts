import { NextRequest } from 'next/server'
import { verifyToken } from './auth'
import { query } from './db'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'admin'
}

export async function verifyAdminToken(request: NextRequest): Promise<AdminUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== 'admin') {
      return null
    }

    // Verify admin still exists and is active
    const adminResult = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND role = $2',
      [decoded.id, 'admin']
    )

    if (adminResult.length === 0) {
      return null
    }

    return adminResult[0] as AdminUser
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

export async function requireAdmin(request: NextRequest): Promise<AdminUser> {
  const admin = await verifyAdminToken(request)
  
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return admin
}

// Helper function to check if user is admin by ID
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT role FROM users WHERE id = $1 AND role = $2',
      [userId, 'admin']
    )
    return result.length > 0
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Get admin info with detailed permissions
export async function getAdminInfo(adminId: number) {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        email, 
        role,
        created_at,
        updated_at
      FROM users 
      WHERE id = $1 AND role = 'admin'
    `, [adminId])

    return result[0] || null
  } catch (error) {
    console.error('Error getting admin info:', error)
    return null
  }
}
