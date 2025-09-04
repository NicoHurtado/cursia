interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  publishedAt: string;
  embedUrl: string;
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  totalResults: number;
}

export class YouTubeService {
  private static readonly API_KEY = process.env.YOUTUBE_DATA_API_KEY;
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static cache = new Map<string, { data: YouTubeVideo[]; timestamp: number }>();

  /**
   * Search for YouTube videos related to a specific topic
   */
  static async searchVideos(
    query: string,
    maxResults: number = 5,
    duration: 'short' | 'medium' | 'long' | 'any' = 'medium'
  ): Promise<YouTubeVideo[]> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    // Check cache first
    const cacheKey = `${query}-${maxResults}-${duration}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`🎥 Cache hit for YouTube search: ${query}`);
      return cached.data;
    }

    try {
      console.log(`🔍 Searching YouTube for: ${query}`);
      
      // Build search parameters
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        key: this.API_KEY,
        videoEmbeddable: 'true',
        videoDuration: duration === 'any' ? '' : duration,
        order: 'relevance',
        safeSearch: 'moderate'
      });

      // Make API request
      const response = await fetch(`${this.BASE_URL}/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log(`⚠️ No videos found for: ${query}`);
        return [];
      }

      // Get video details for duration
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `${this.BASE_URL}/videos?part=contentDetails&id=${videoIds}&key=${this.API_KEY}`
      );

      let videoDetails: any[] = [];
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        videoDetails = detailsData.items || [];
      }

      // Process and format results
      const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => {
        const details = videoDetails.find(d => d.id === item.id.videoId);
        const duration = details?.contentDetails?.duration || 'PT0S';
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          duration: this.formatDuration(duration),
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
        };
      });

      // Cache the results
      this.cache.set(cacheKey, { data: videos, timestamp: Date.now() });

      console.log(`✅ Found ${videos.length} videos for: ${query}`);
      return videos;

    } catch (error) {
      console.error('❌ YouTube API error:', error);
      throw new Error(`Failed to search YouTube videos: ${error}`);
    }
  }

  /**
   * Search for a single relevant video for a specific lesson topic
   */
  static async findRelevantVideo(
    lessonTitle: string,
    lessonContent: string,
    courseTopic: string
  ): Promise<YouTubeVideo | null> {
    try {
      // Create a focused search query
      const searchQuery = this.createSearchQuery(lessonTitle, lessonContent, courseTopic);
      
      // Search for videos
      const videos = await this.searchVideos(searchQuery, 10, 'medium');
      
      if (videos.length === 0) {
        console.log(`⚠️ No videos found for lesson: ${lessonTitle}`);
        return null;
      }

      // Return the most relevant video (first result from relevance-ordered search)
      console.log(`✅ Found video for lesson: ${lessonTitle} - ${videos[0].title}`);
      return videos[0];

    } catch (error) {
      console.error('❌ Error finding relevant video:', error);
      return null;
    }
  }

  /**
   * Find and store video for a specific chunk during module generation
   */
  static async findVideoForChunk(
    chunkTitle: string,
    chunkContent: string,
    courseTitle: string,
    chunkOrder: number
  ): Promise<YouTubeVideo | null> {
    // Only search for videos on the second lesson of each module
    if (chunkOrder !== 2) {
      return null;
    }

    try {
      console.log(`🎥 Searching video for chunk: ${chunkTitle}`);
      const video = await this.findRelevantVideo(chunkTitle, chunkContent, courseTitle);
      
      if (video) {
        console.log(`✅ Video found and ready for chunk: ${chunkTitle}`);
      } else {
        console.log(`⚠️ No video found for chunk: ${chunkTitle}`);
      }
      
      return video;
    } catch (error) {
      console.error(`❌ Error finding video for chunk ${chunkTitle}:`, error);
      return null;
    }
  }

  /**
   * Create an optimized search query for YouTube
   */
  private static createSearchQuery(
    lessonTitle: string,
    lessonContent: string,
    courseTopic: string
  ): string {
    // Extract key terms from lesson title
    const titleWords = lessonTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3);

    // Extract key terms from course topic
    const topicWords = courseTopic
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 2);

    // Combine terms for a focused search
    const searchTerms = [...titleWords, ...topicWords];
    const query = searchTerms.join(' ');

    // Add educational keywords
    const educationalKeywords = ['tutorial', 'curso', 'aprender', 'explicación'];
    const finalQuery = `${query} ${educationalKeywords[Math.floor(Math.random() * educationalKeywords.length)]}`;

    return finalQuery.trim();
  }

  /**
   * Format YouTube duration (PT4M13S) to readable format (4:13)
   */
  private static formatDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🧹 YouTube cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
