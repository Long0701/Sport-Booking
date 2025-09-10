#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function clearNextCache() {
  const nextDir = path.join(process.cwd(), '.next')
  
  console.log('🧹 Clearing Next.js cache...')
  
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true })
      console.log('✅ Next.js cache cleared successfully!')
    } catch (error) {
      console.log('❌ Error clearing cache:', error.message)
    }
  } else {
    console.log('ℹ️ No cache directory found')
  }

  console.log('📝 Next steps:')
  console.log('1. Restart your Next.js dev server')  
  console.log('2. Clear browser cache/localStorage:')
  console.log('   - Open DevTools (F12)')
  console.log('   - Go to Application/Storage tab')
  console.log('   - Clear localStorage for localhost:3000')
  console.log('   - Or use: localStorage.clear() in console')
  console.log('3. Test admin login flow again')
}

clearNextCache()
