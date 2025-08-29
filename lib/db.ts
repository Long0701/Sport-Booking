import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  console.error('Please create a .env file with DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking')
  throw new Error('DATABASE_URL must be set. Check SETUP.md for instructions.')
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } catch (error) {
    console.error('Database query error:', error)
    console.error('Query:', text)
    console.error('Params:', params)
    throw error
  } finally {
    client.release()
  }
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
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export default pool
