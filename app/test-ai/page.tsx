'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestAIPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testFireworksAI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-ai')
      const data = await response.json()
      setTestResult(data)
      console.log('Test Result:', data)
    } catch (error) {
      setTestResult({ success: false, error: 'Test failed', details: error })
      console.error('Test Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Fireworks AI Integration Test</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Fireworks AI Connection</h2>
          <p className="text-gray-600 mb-4">
            This test will verify that the Fireworks AI API is working correctly.
          </p>
          <Button 
            onClick={testFireworksAI} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Testing...' : 'Test Fireworks AI'}
          </Button>
        </Card>

        {testResult && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            
            {testResult.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800">✅ Test Successful!</h4>
                  <p className="text-green-700">{testResult.message}</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800">🤖 AI Response:</h4>
                  <p className="text-blue-700">{testResult.aiResponse}</p>
                </div>
                
                <div className="text-sm text-gray-500">
                  Timestamp: {testResult.timestamp}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">❌ Test Failed</h4>
                <p className="text-red-700">{testResult.error}</p>
                {testResult.details && (
                  <p className="text-red-600 text-sm mt-2">{testResult.details}</p>
                )}
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
          <div className="space-y-2 text-gray-600">
            <p>1. If the test is successful, the AI integration is working correctly.</p>
            <p>2. You can now visit the search page at <a href="/search" className="text-blue-600 hover:underline">/search</a> to test the full AI suggestion feature.</p>
            <p>3. Select a sport type and click "Xem gợi ý AI" to see the smart suggestions.</p>
            <p>4. Check the browser console for detailed logs of the AI integration.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
