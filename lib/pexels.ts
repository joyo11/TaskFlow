const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const PEXELS_API_URL = 'https://api.pexels.com/v1'

export async function fetchRelevantImage(description: string): Promise<string | null> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_api_key_here') {
    console.warn('Pexels API key not configured')
    return null
  }

  try {
    // Extract keywords from description for better image search
    const keywords = extractKeywords(description)
    const searchQuery = keywords.join(' ')
    
    const response = await fetch(
      `${PEXELS_API_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0]
      return photo.src.medium // Return medium-sized image URL
    }

    return null
  } catch (error) {
    console.error('Error fetching Pexels image:', error)
    return null
  }
}

function extractKeywords(description: string): string[] {
  // Simple keyword extraction - in production you might want to use NLP libraries
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ])

  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 5) // Take top 5 keywords

  return words
}

export async function searchImages(query: string, perPage: number = 10): Promise<any[]> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_api_key_here') {
    console.warn('Pexels API key not configured')
    return []
  }

  try {
    const response = await fetch(
      `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()
    return data.photos || []
  } catch (error) {
    console.error('Error searching Pexels images:', error)
    return []
  }
}
