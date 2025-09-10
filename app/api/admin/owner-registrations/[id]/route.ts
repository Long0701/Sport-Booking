import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

interface RouteParams {
  params: { id: string }
}

// GET - Get specific registration request details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const requestId = parseInt(params.id)
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID đơn đăng ký không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Get registration with flexible user data (support both legacy and new registrations)
    const requestResult = await query(`
      SELECT 
        reg.id,
        reg.user_id,
        reg.user_name,
        reg.user_email,
        reg.user_phone,
        reg.business_name,
        reg.business_address,
        reg.business_phone,
        reg.business_email,
        reg.description,
        reg.experience,
        reg.status,
        reg.admin_notes,
        reg.reviewed_at,
        reg.created_at,
        reg.updated_at,
        reg.created_user_id,
        -- User data from users table (legacy registrations)
        u.name as existing_user_name,
        u.email as existing_user_email,
        u.phone as existing_user_phone,
        u.role as user_role,
        u.approval_status as user_approval_status,
        u.created_at as user_created_at,
        -- Reviewer info
        reviewer.name as reviewed_by_name,
        reviewer.email as reviewed_by_email
      FROM owner_registrations reg
      LEFT JOIN users u ON reg.user_id = u.id
      LEFT JOIN users reviewer ON reg.reviewed_by = reviewer.id
      WHERE reg.id = $1
    `, [requestId])
    
    if (requestResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn đăng ký' },
        { status: 404 }
      )
    }
    
    const rawRegistration = requestResult[0]
    
    // Normalize user data (prefer registration data for new flow, fallback to existing user data for legacy)
    const registrationRequest = {
      id: rawRegistration.id,
      user_id: rawRegistration.user_id,
      business_name: rawRegistration.business_name,
      business_address: rawRegistration.business_address,
      business_phone: rawRegistration.business_phone,
      business_email: rawRegistration.business_email,
      description: rawRegistration.description,
      experience: rawRegistration.experience,
      status: rawRegistration.status,
      admin_notes: rawRegistration.admin_notes,
      reviewed_at: rawRegistration.reviewed_at,
      created_at: rawRegistration.created_at,
      updated_at: rawRegistration.updated_at,
      created_user_id: rawRegistration.created_user_id,
      // Use registration data if available (new flow), otherwise use existing user data (legacy)
      user_name: rawRegistration.user_name || rawRegistration.existing_user_name,
      user_email: rawRegistration.user_email || rawRegistration.existing_user_email,
      user_phone: rawRegistration.user_phone || rawRegistration.existing_user_phone,
      user_role: rawRegistration.user_role,
      user_approval_status: rawRegistration.user_approval_status,
      user_created_at: rawRegistration.user_created_at,
      reviewed_by_name: rawRegistration.reviewed_by_name,
      reviewed_by_email: rawRegistration.reviewed_by_email
    }
    
    // Get user's existing courts if they are already an owner
    let userCourts = []
    const ownerId = registrationRequest.created_user_id || registrationRequest.user_id
    if (ownerId) {
      userCourts = await query(`
        SELECT id, name, type, address, rating, review_count, is_active, created_at
        FROM courts
        WHERE owner_id = $1
        ORDER BY created_at DESC
      `, [ownerId])
    }
    
    return NextResponse.json({
      success: true,
      data: {
        request: registrationRequest,
        userCourts
      }
    })
    
  } catch (error: any) {
    console.error('Admin get owner registration error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// PUT - Approve or reject registration request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const requestId = parseInt(params.id)
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID đơn đăng ký không hợp lệ' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { action, admin_notes = '' } = body
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Hành động không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Get registration request details  
    const requestResult = await query(`
      SELECT 
        reg.*,
        u.role, 
        u.approval_status
      FROM owner_registrations reg
      LEFT JOIN users u ON reg.user_id = u.id
      WHERE reg.id = $1
    `, [requestId])
    
    if (requestResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn đăng ký' },
        { status: 404 }
      )
    }
    
    const reg = requestResult[0]
    console.log('Registration request data:', {
      id: reg.id,
      status: reg.status,
      user_id: reg.user_id,
      user_name: reg.user_name,
      user_email: reg.user_email
    })
    
    if (reg.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Đơn đăng ký đã được xử lý' },
        { status: 400 }
      )
    }
    
    // Extract data outside transaction to avoid closure issues
    const regData = {
      id: reg.id,
      user_id: reg.user_id,
      user_name: reg.user_name,
      user_email: reg.user_email,
      user_password: reg.user_password,
      user_phone: reg.user_phone,
      business_name: reg.business_name
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    
    // Use transaction to ensure data consistency
    const result = await transaction(async (client) => {
      console.log('Starting transaction with action:', action)
      console.log('Reg data user_name:', regData.user_name)
      
      let createdUserId = null
      
      // If approving and no existing user, create new user account
      if (action === 'approve') {
        if (regData.user_id) {
          // Legacy: Update existing user role
          console.log('Updating existing user:', regData.user_id)
          await client.query(`
            UPDATE users 
            SET 
              role = 'owner',
              approval_status = 'approved',
              approved_by = $1,
              approved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [admin.id, regData.user_id])
          createdUserId = regData.user_id
        } else {
          // New flow: Create user account from registration data
          console.log('Creating new user account...')
          
          if (!regData.user_name || !regData.user_email || !regData.user_password) {
            throw new Error('Missing required user data for account creation')
          }
          
          const newUserResult = await client.query(
            `INSERT INTO users (name, email, password, phone, role, approval_status, approved_by, approved_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              regData.user_name,
              regData.user_email, 
              regData.user_password,
              regData.user_phone,
              'owner',
              'approved',
              admin.id
            ]
          )
          console.log('User creation successful, ID:', newUserResult.rows[0].id)
          createdUserId = newUserResult.rows[0].id
        }
      }

      // Update registration request
      console.log('Updating registration status...')
      await client.query(`
        UPDATE owner_registrations 
        SET 
          status = $1,
          admin_notes = $2,
          reviewed_by = $3,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          created_user_id = $5
        WHERE id = $4
      `, [newStatus, admin_notes, admin.id, requestId, createdUserId])
      
      // If rejecting existing user, update their approval status
      if (action === 'reject' && regData.user_id) {
        await client.query(`
          UPDATE users 
          SET 
            approval_status = 'rejected',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [admin.id, regData.user_id])
      }
      
      // Return updated registration request with user info
      let userQuery = `
        SELECT 
          reg.*,
          reviewer.name as reviewed_by_name
        FROM owner_registrations reg
        LEFT JOIN users reviewer ON reg.reviewed_by = reviewer.id
        WHERE reg.id = $1
      `
      
      if (regData.user_id) {
        // Legacy registration with existing user
        userQuery = `
          SELECT 
            reg.*,
            u.name as user_name,
            u.email as user_email,
            u.role as user_role,
            u.approval_status as user_approval_status,
            reviewer.name as reviewed_by_name
          FROM owner_registrations reg
          LEFT JOIN users u ON reg.user_id = u.id
          LEFT JOIN users reviewer ON reg.reviewed_by = reviewer.id
          WHERE reg.id = $1
        `
      } else {
        // New registration with user info in registration table
        userQuery = `
          SELECT 
            reg.*,
            reg.user_name,
            reg.user_email,
            CASE WHEN reg.status = 'approved' THEN 'owner' ELSE 'pending' END as user_role,
            reg.status as user_approval_status,
            reviewer.name as reviewed_by_name
          FROM owner_registrations reg
          LEFT JOIN users reviewer ON reg.reviewed_by = reviewer.id
          WHERE reg.id = $1
        `
      }
      
      const updatedRequest = await client.query(userQuery, [requestId])
      return updatedRequest[0]
    })
    
    const actionText = action === 'approve' ? 'duyệt' : 'từ chối'
    const userName = result.user_name || regData.user_name
    const message = `Đã ${actionText} đơn đăng ký làm chủ sân của ${userName} thành công`
    
    return NextResponse.json({
      success: true,
      message,
      data: { request: result }
    })
    
  } catch (error: any) {
    console.error('Admin update owner registration error:', error)
    console.error('Error stack:', error.stack)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: `Lỗi server: ${error.message}` },
      { status: 500 }
    )
  }
}

// DELETE - Delete registration request (for cleanup)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const requestId = parseInt(params.id)
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID đơn đăng ký không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Check if request exists
    const requestResult = await query(`
      SELECT 
        reg.*, 
        COALESCE(reg.user_name, u.name) as user_name
      FROM owner_registrations reg
      LEFT JOIN users u ON reg.user_id = u.id
      WHERE reg.id = $1
    `, [requestId])
    
    if (requestResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn đăng ký' },
        { status: 404 }
      )
    }
    
    const request_data = requestResult[0]
    
    // Only allow deletion of processed requests
    if (request_data.status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa đơn đăng ký đang chờ xử lý. Vui lòng duyệt hoặc từ chối trước.' },
        { status: 400 }
      )
    }
    
    // Delete the registration request
    await query('DELETE FROM owner_registrations WHERE id = $1', [requestId])
    
    return NextResponse.json({
      success: true,
      message: `Đã xóa đơn đăng ký của ${request_data.user_name} thành công`
    })
    
  } catch (error: any) {
    console.error('Admin delete owner registration error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗ server' },
      { status: 500 }
    )
  }
}
