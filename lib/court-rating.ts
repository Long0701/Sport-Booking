// Court Rating Calculation Utility
// Centralized logic for calculating and updating court ratings

import { query } from './db'

export interface RatingCalculationResult {
  avgRating: number;
  finalRating: number;
  reviewCount: number;
}

/**
 * Calculate average rating for a court from reviews
 * @param courtId - Court ID to calculate rating for
 * @param onlyVisible - Whether to only include visible reviews (requires status column)
 * @returns Rating calculation result
 */
export async function calculateCourtRating(courtId: number, onlyVisible: boolean = true): Promise<RatingCalculationResult> {
  try {
    // Check if status column exists
    let hasStatusColumn = false;
    try {
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'status'
      `);
      hasStatusColumn = columnCheck.length > 0;
    } catch (error) {
      hasStatusColumn = false;
    }

    // Build query based on available columns
    let reviewsQuery = `SELECT rating FROM reviews WHERE court_id = $1`;
    
    // Only filter by status if column exists and onlyVisible is true
    if (hasStatusColumn && onlyVisible) {
      reviewsQuery += ` AND status = 'visible'`;
    }

    const reviewsResult = await query(reviewsQuery, [courtId]);
    const reviews = reviewsResult;

    let avgRating = 0;
    let finalRating = 0;
    const reviewCount = reviews.length;

    if (reviewCount > 0) {
      // Calculate average rating
      avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount;
      
      // Ensure rating is within database constraints (0-5, 1 decimal place)
      // Using Math.round(x * 10) / 10 to ensure 1 decimal place
      finalRating = Math.max(0, Math.min(5, Math.round(avgRating * 10) / 10));
      
      // Additional safety check - if somehow we get NaN or invalid value, default to 0
      if (isNaN(finalRating) || !isFinite(finalRating)) {
        finalRating = 0;
      }
    }

    return {
      avgRating,
      finalRating,
      reviewCount
    };

  } catch (error) {
    console.error('Error calculating court rating:', error);
    
    // Return safe defaults
    return {
      avgRating: 0,
      finalRating: 0,
      reviewCount: 0
    };
  }
}

/**
 * Update court rating and review count in database
 * @param courtId - Court ID to update
 * @param onlyVisible - Whether to only count visible reviews
 * @returns Updated rating info
 */
export async function updateCourtRating(courtId: number, onlyVisible: boolean = true): Promise<RatingCalculationResult> {
  try {
    const ratingData = await calculateCourtRating(courtId, onlyVisible);
    
    // Update court in database with validated rating
    await query(`
      UPDATE courts 
      SET 
        rating = $1, 
        review_count = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [ratingData.finalRating, ratingData.reviewCount, courtId]);

    return ratingData;

  } catch (error) {
    console.error('Error updating court rating:', error);
    throw error;
  }
}

/**
 * Validate rating value against database constraints
 * @param rating - Rating value to validate
 * @returns Valid rating within bounds
 */
export function validateRating(rating: number): number {
  if (isNaN(rating) || !isFinite(rating)) {
    return 0;
  }
  
  // Ensure 0 <= rating <= 5 with max 1 decimal place
  return Math.max(0, Math.min(5, Math.round(rating * 10) / 10));
}

/**
 * Calculate court rating within a transaction
 * @param client - Database client from transaction
 * @param courtId - Court ID to calculate rating for
 * @param onlyVisible - Whether to only include visible reviews
 * @returns Rating calculation result
 */
export async function calculateCourtRatingInTransaction(client: any, courtId: number, onlyVisible: boolean = true): Promise<RatingCalculationResult> {
  try {
    // Check if status column exists
    let hasStatusColumn = false;
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'status'
      `);
      hasStatusColumn = columnCheck.rows.length > 0;
    } catch (error) {
      hasStatusColumn = false;
    }

    // Build query based on available columns
    let reviewsQuery = `SELECT rating FROM reviews WHERE court_id = $1`;
    
    // Only filter by status if column exists and onlyVisible is true
    if (hasStatusColumn && onlyVisible) {
      reviewsQuery += ` AND status = 'visible'`;
    }

    const reviewsResult = await client.query(reviewsQuery, [courtId]);
    const reviews = reviewsResult.rows;

    let avgRating = 0;
    let finalRating = 0;
    const reviewCount = reviews.length;

    if (reviewCount > 0) {
      // Calculate average rating
      avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount;
      
      // Ensure rating is within database constraints (0-5, 1 decimal place)
      finalRating = Math.max(0, Math.min(5, Math.round(avgRating * 10) / 10));
      
      // Additional safety check
      if (isNaN(finalRating) || !isFinite(finalRating)) {
        finalRating = 0;
      }
    }

    return {
      avgRating,
      finalRating,
      reviewCount
    };

  } catch (error) {
    console.error('Error calculating court rating in transaction:', error);
    
    // Return safe defaults
    return {
      avgRating: 0,
      finalRating: 0,
      reviewCount: 0
    };
  }
}

/**
 * Format rating for display
 * @param rating - Rating value
 * @returns Formatted rating string
 */
export function formatRating(rating: number): string {
  const validRating = validateRating(rating);
  return validRating.toFixed(1);
}
