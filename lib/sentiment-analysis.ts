// AI Sentiment Analysis Service
// This service analyzes review sentiment and flags potentially negative reviews
// Updated to use dynamic keywords from database

import { getSentimentKeywords, getFallbackKeywords, type KeywordCache } from './sentiment-keywords'

export interface SentimentResult {
  score: number; // -1.0 to 1.0 (-1 very negative, 0 neutral, 1 very positive)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  flagged: boolean; // true if should be hidden automatically
  keywordsFound: string[]; // keywords that were matched
}

// Dynamic rule-based sentiment analysis using database keywords
export async function analyzeVietnameseSentiment(text: string, language: string = 'vi'): Promise<SentimentResult> {
  const lowerText = text.toLowerCase();
  
  // Get keywords from database (with fallback)
  let keywords: KeywordCache;
  try {
    keywords = await getSentimentKeywords(language);
  } catch (error) {
    console.warn('Failed to load keywords from database, using fallback:', error);
    keywords = getFallbackKeywords();
  }
  
  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let strongNegativeCount = 0;
  let keywordsFound: string[] = [];

  // Count positive keywords
  keywords.positive.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    const weight = keywordObj.weight;
    const regex = new RegExp(escapeRegExp(keyword), 'gi');
    const matches = (lowerText.match(regex) || []).length;
    
    if (matches > 0) {
      positiveCount += matches;
      score += matches * (weight * 0.3); // Base multiplier 0.3
      keywordsFound.push(`+${keyword} (${matches}x, w:${weight})`);
    }
  });

  // Count negative keywords
  keywords.negative.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    const weight = keywordObj.weight;
    const regex = new RegExp(escapeRegExp(keyword), 'gi');
    const matches = (lowerText.match(regex) || []).length;
    
    if (matches > 0) {
      negativeCount += matches;
      score -= matches * (weight * 0.4); // Base multiplier 0.4
      keywordsFound.push(`-${keyword} (${matches}x, w:${weight})`);
    }
  });

  // Count strong negative keywords (heavier impact)
  keywords.strong_negative.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    const weight = keywordObj.weight;
    const regex = new RegExp(escapeRegExp(keyword), 'gi');
    const matches = (lowerText.match(regex) || []).length;
    
    if (matches > 0) {
      strongNegativeCount += matches;
      score -= matches * (weight * 0.6); // Higher base multiplier 0.6
      keywordsFound.push(`--${keyword} (${matches}x, w:${weight})`);
    }
  });

  // Normalize score to -1 to 1 range
  score = Math.max(-1, Math.min(1, score));

  // Determine label
  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.2) {
    label = 'positive';
  } else if (score < -0.2) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  // Calculate confidence based on keyword density and weight
  const totalWords = lowerText.split(/\s+/).length;
  const totalKeywordMatches = positiveCount + negativeCount + strongNegativeCount;
  const keywordDensity = totalKeywordMatches / Math.max(totalWords, 1);
  const confidence = Math.min(0.95, Math.max(0.1, keywordDensity * 2.5));

  // Flag for automatic hiding - more sophisticated logic
  const flagged = 
    strongNegativeCount > 0 || // Any strong negative keywords
    (score < -0.6 && confidence > 0.3) || // Very negative with decent confidence
    (negativeCount >= 3 && strongNegativeCount === 0) || // Multiple regular negatives
    (score < -0.4 && negativeCount >= 2); // Moderately negative with multiple keywords

  return {
    score,
    label,
    confidence,
    flagged,
    keywordsFound
  };
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced AI sentiment analysis using OpenAI (optional)
export async function analyzeWithOpenAI(text: string, language: string = 'vi'): Promise<SentimentResult> {
  try {
    // This would require OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback to rule-based analysis
      return await analyzeVietnameseSentiment(text, language);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert for Vietnamese text. Analyze the sentiment of reviews about sports courts/facilities. 
            Respond with ONLY a JSON object containing:
            - score: number from -1.0 (very negative) to 1.0 (very positive)
            - label: "positive", "negative", or "neutral"
            - confidence: number from 0 to 1
            - flagged: boolean (true if review is inappropriate/very negative and should be hidden)
            - keywordsFound: array of strings (key phrases that influenced the sentiment)
            
            Consider Vietnamese cultural context and sports facility review patterns.`
          },
          {
            role: 'user',
            content: `Analyze this Vietnamese review: "${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      score: result.score,
      label: result.label,
      confidence: result.confidence,
      flagged: result.flagged,
      keywordsFound: result.keywordsFound || []
    };
    
  } catch (error) {
    console.error('OpenAI sentiment analysis failed, using fallback:', error);
    return await analyzeVietnameseSentiment(text, language);
  }
}

// Main sentiment analysis function
export async function analyzeSentiment(text: string, useAI: boolean = false, language: string = 'vi'): Promise<SentimentResult> {
  if (useAI && process.env.OPENAI_API_KEY) {
    return await analyzeWithOpenAI(text, language);
  } else {
    return await analyzeVietnameseSentiment(text, language);
  }
}

// Synchronous fallback function for when database is unavailable
export function analyzeSentimentSync(text: string): SentimentResult {
  const keywords = getFallbackKeywords();
  const lowerText = text.toLowerCase();
  
  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let strongNegativeCount = 0;
  let keywordsFound: string[] = [];

  // Simple keyword matching using fallback keywords
  keywords.positive.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    if (lowerText.includes(keyword)) {
      positiveCount++;
      score += keywordObj.weight * 0.3;
      keywordsFound.push(`+${keyword}`);
    }
  });

  keywords.negative.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    if (lowerText.includes(keyword)) {
      negativeCount++;
      score -= keywordObj.weight * 0.4;
      keywordsFound.push(`-${keyword}`);
    }
  });

  keywords.strong_negative.forEach(keywordObj => {
    const keyword = keywordObj.keyword;
    if (lowerText.includes(keyword)) {
      strongNegativeCount++;
      score -= keywordObj.weight * 0.6;
      keywordsFound.push(`--${keyword}`);
    }
  });

  score = Math.max(-1, Math.min(1, score));

  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.2) {
    label = 'positive';
  } else if (score < -0.2) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  const totalWords = lowerText.split(/\s+/).length;
  const totalKeywordMatches = positiveCount + negativeCount + strongNegativeCount;
  const keywordDensity = totalKeywordMatches / Math.max(totalWords, 1);
  const confidence = Math.min(0.95, Math.max(0.1, keywordDensity * 2));

  const flagged = 
    strongNegativeCount > 0 || 
    (score < -0.5 && confidence > 0.3) ||
    negativeCount >= 3;

  return {
    score,
    label,
    confidence,
    flagged,
    keywordsFound
  };
}
