import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  console.error('Please create a .env file with DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking')
  throw new Error('DATABASE_URL must be set. Check SETUP.md for instructions.')
}

// Create a connection pool with robust timeout settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  acquireTimeoutMillis: 60000, // Wait up to 60 seconds for a connection from the pool
  maxUses: 7500, // Close connections after 7500 uses
  allowExitOnIdle: true, // Allow the pool to close all connections and exit
})

// Helper function to execute queries with retry logic
export async function query(text: string, params?: any[], retries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect()
      try {
        const result = await client.query(text, params)
        return result.rows
      } finally {
        client.release()
      }
    } catch (error: any) {
      lastError = error;
      console.error(`Database query error (attempt ${attempt}/${retries}):`, error.message)
      
      if (attempt < retries && (
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND')
      )) {
        console.log(`Retrying in ${attempt * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
      
      console.error('Query:', text)
      console.error('Params:', params)
      throw error
    }
  }
  
  throw lastError;
}

// Helper function for transactions
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

// Database health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health_check')
    console.log('✅ Database connection healthy')
    return result.length > 0
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.message)
    return false
  }
}

// Connection info
export async function getConnectionInfo() {
  try {
    const result = await query(`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        inet_server_addr() as host,
        inet_server_port() as port
    `)
    return result[0]
  } catch (error) {
    console.error('Error getting connection info:', error)
    return null
  }
}

export default pool
