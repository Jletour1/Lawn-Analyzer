import { config } from './config';

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  url: string;
  score: number;
  num_comments: number;
  subreddit: string;
  post_hint?: string;
  upvote_ratio: number;
  permalink: string;
  comments?: RedditComment[];
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  permalink: string;
}

export interface CollectionResult {
  posts: RedditPost[];
  totalCollected: number;
  duplicatesSkipped: number;
  errors: string[];
}

// Expanded target keywords matching your Python script
const TARGET_KEYWORDS: { [key: string]: string[] } = {
  // High confidence visual problems
  "dog_urine_spots": ["dog urine", "pet damage", "round dead patches", "dark green rings", "circular brown spots", "dog pee spots"],
  "dull_mower_blades": ["dull mower blades", "frayed grass", "shredded grass", "brown tips", "ragged edges", "torn grass"],
  "fertilizer_burn": ["fertilizer burn", "over fertilized", "yellow streaks", "chemical burn", "nitrogen burn", "fertilizer stripes"],
  "grubs": ["grubs", "white grubs", "grass peels like carpet", "animals digging", "soft lawn", "grub damage"],
  "chinch_bugs": ["chinch bugs", "sunny area damage", "spreading brown patches", "small bugs", "chinch bug damage"],

  // Disease issues
  "brown_patch_disease": ["brown patch", "circular brown spots", "smoky edge", "fungal disease", "humid", "brown patch disease"],
  "dollar_spot": ["dollar spot", "small round spots", "silver dollar size", "straw colored", "tiny spots"],
  "fairy_rings": ["fairy rings", "mushroom rings", "circular mushrooms", "dark green rings", "fairy ring"],
  "rust_fungus": ["rust disease", "orange dust", "orange powder", "rusty grass", "powder on blades", "rust fungus"],

  // Environmental problems
  "drought_stress": ["drought", "dry grass", "crispy grass", "footprints visible", "water stress", "drought stress"],
  "overwatering": ["overwatering", "soggy lawn", "yellow from water", "mushrooms", "too much water", "overwatered"],
  "compacted_soil": ["compacted soil", "hard soil", "water runs off", "hard ground", "dense soil", "soil compaction"],
  "thatch_buildup": ["thatch buildup", "spongy lawn", "thick thatch", "bouncy grass", "thatch layer"],
  "moss_invasion": ["moss", "green moss", "moss taking over", "moss problem", "moss replacing grass"],

  // Weed problems
  "broadleaf_weeds": ["dandelions", "clover", "broad leaves", "yellow flowers", "white flowers", "thistle", "broadleaf weeds"],
  "grassy_weeds": ["crabgrass", "nutsedge", "coarse grass", "different grass", "thick blades", "triangular stems"],
  "creeping_weeds": ["ground ivy", "creeping charlie", "vine weeds", "runners", "spreading weeds", "creeping weeds"],
  "general_weed_invasion": ["weeds taking over", "more weeds than grass", "weed invasion", "too many weeds", "lawn full of weeds"],

  // Additional common issues
  "crabgrass": ["crabgrass", "coarse grass", "thick blades", "spreading grass weed", "summer weed"],
  "bare_patches": ["bare spots", "thin grass", "patchy lawn", "bare patches", "thin areas"],
  "scalping": ["scalped lawn", "cut too short", "mowed too low", "scalping damage"],
  "salt_damage": ["salt damage", "road salt", "ice melt", "winter salt", "salt burn"]
};

// Flatten keywords for search
const ALL_KEYWORDS: string[] = [];
for (const category_keywords of Object.values(TARGET_KEYWORDS)) {
  ALL_KEYWORDS.push(...category_keywords);
}

// Reddit API endpoints
const REDDIT_API_BASE = 'https://www.reddit.com';
const OAUTH_URL = 'https://www.reddit.com/api/v1/access_token';

class RedditCollector {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!config.reddit.clientId || !config.reddit.clientSecret) {
      throw new Error('Reddit API credentials not configured. Please check your .env file.');
    }

    try {
      console.log('🔑 Getting Reddit access token...');
      const auth = btoa(`${config.reddit.clientId}:${config.reddit.clientSecret}`);

      const response = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': config.reddit.userAgent
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reddit OAuth error:', response.status, errorText);
        throw new Error(`Reddit OAuth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

      console.log('✅ Reddit access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('Reddit authentication failed:', error);
      throw error;
    }
  }

  private async makeRedditRequest(endpoint: string): Promise<any> {
    const token = await this.getAccessToken();

    console.log(`📡 Making Reddit API request: ${endpoint}`);
    const response = await fetch(`https://oauth.reddit.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': config.reddit.userAgent
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reddit API error:', response.status, errorText);
      throw new Error(`Reddit API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Reddit API response received: ${data?.data?.children?.length || 0} items`);
    return data;
  }

  async searchSubreddit(subreddit: string, query: string, limit: number = 25): Promise<RedditPost[]> {
    try {
      console.log(`🔍 Searching r/${subreddit} for "${query}" (limit: ${limit})`);
      const endpoint = `/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}&t=all`;
      const data = await this.makeRedditRequest(endpoint);

      if (!data?.data?.children) {
        console.warn('No data.children in Reddit response');
        return [];
      }

      const posts = data.data.children.map((child: any) => ({
        id: child.data.id,
        title: child.data.title || '',
        selftext: child.data.selftext || '',
        author: child.data.author || '[deleted]',
        created_utc: child.data.created_utc || 0,
        url: child.data.url || '',
        score: child.data.score || 0,
        num_comments: child.data.num_comments || 0,
        subreddit: child.data.subreddit || subreddit,
        post_hint: child.data.post_hint,
        upvote_ratio: child.data.upvote_ratio || 0,
        permalink: child.data.permalink || ''
      }));

      console.log(`✅ Found ${posts.length} posts in r/${subreddit} for "${query}"`);
      return posts;
    } catch (error) {
      console.error(`❌ Error searching r/${subreddit} for "${query}":`, error);
      return [];
    }
  }

  async getPostComments(permalink: string, limit: number = 10): Promise<RedditComment[]> {
    try {
      console.log(`💬 Getting comments for ${permalink}`);
      const endpoint = `${permalink}.json?limit=${limit}`;
      const data = await this.makeRedditRequest(endpoint);

      if (!data || !Array.isArray(data) || data.length < 2) {
        console.warn('Invalid comment data structure');
        return [];
      }

      const commentData = data[1];
      if (!commentData?.data?.children) {
        console.warn('No comment children found');
        return [];
      }

      const comments = commentData.data.children
        .filter((child: any) => child.kind === 't1') // Only comments, not "more" objects
        .map((child: any) => ({
          id: child.data.id,
          body: child.data.body || '',
          author: child.data.author || '[deleted]',
          score: child.data.score || 0,
          created_utc: child.data.created_utc || 0,
          permalink: child.data.permalink || ''
        }));

      console.log(`✅ Found ${comments.length} comments`);
      return comments;
    } catch (error) {
      console.error(`❌ Error getting comments for ${permalink}:`, error);
      return [];
    }
  }
}

const TARGET_SUBREDDITS = [
  'lawncare', 'landscaping', 'plantclinic', 'gardening', 'homeimprovement'
];

export const collectRedditData = async (options: {
  subreddits?: string[];
  keywords?: string[];
  postsPerKeyword?: number;
  includeComments?: boolean;
  startDate?: number; // Unix timestamp
  endDate?: number; // Unix timestamp
  existingPostIds?: Set<string>;
  onProgress?: (completed: number, total: number) => void;
} = {}): Promise<CollectionResult> => {
  const collector = new RedditCollector();
  const subreddits = options.subreddits || TARGET_SUBREDDITS;
  const keywords = options.keywords || ALL_KEYWORDS.slice(0, 15); // Use top 15 keywords
  const postsPerKeyword = options.postsPerKeyword || 10;
  const includeComments = options.includeComments !== false;
  const startDate = options.startDate;
  const endDate = options.endDate;
  const existingPostIds = options.existingPostIds || new Set();
  const onProgress = options.onProgress;

  const allPosts: RedditPost[] = [];
  const errors: string[] = [];
  let duplicatesSkipped = 0;

  console.log(`🌿 Starting Reddit collection from ${subreddits.length} subreddits with ${keywords.length} keywords...`);
  
  if (startDate || endDate) {
    console.log('📅 Date filtering enabled:', {
      startDate: startDate ? new Date(startDate * 1000).toLocaleDateString() : 'No start date',
      endDate: endDate ? new Date(endDate * 1000).toLocaleDateString() : 'No end date'
    });
  }
  
  if (existingPostIds.size > 0) {
    console.log('🔄 Duplicate detection enabled:', existingPostIds.size, 'existing posts to check against');
  }

  const totalOperations = subreddits.length * keywords.length;
  let completedOperations = 0;

  for (const subreddit of subreddits) {
    console.log(`\n📍 Collecting from r/${subreddit}...`);

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n🔎 [${i + 1}/${keywords.length}] Searching: "${keyword}"`);

      try {
        const posts = await collector.searchSubreddit(subreddit, keyword, postsPerKeyword);

        for (const post of posts) {
          // Check for duplicates first
          if (existingPostIds.has(post.id)) {
            duplicatesSkipped++;
            console.log(`⏭️ Skipping duplicate post: ${post.id}`);
            continue;
          }
          
          // Check date range if specified
          if (startDate && post.created_utc < startDate) {
            console.log(`📅 Skipping post before start date: ${post.title.substring(0, 30)}...`);
            continue;
          }
          
          if (endDate && post.created_utc > endDate) {
            console.log(`📅 Skipping post after end date: ${post.title.substring(0, 30)}...`);
            continue;
          }

          // Avoid duplicates
          if (!allPosts.find(p => p.id === post.id)) {
            // Get comments if requested and post has comments
            if (includeComments && post.num_comments > 0) {
              try {
                console.log(`💬 Getting comments for post: ${post.title.substring(0, 50)}...`);
                const comments = await collector.getPostComments(post.permalink, 10);
                post.comments = comments;

                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.warn(`⚠️ Failed to get comments for post ${post.id}:`, error);
                errors.push(`Failed to get comments for post ${post.id}: ${error}`);
              }
            }

            allPosts.push(post);
            console.log(`➕ Added post: ${post.title.substring(0, 50)}... (${post.score} score, ${post.num_comments} comments)`);
          } else {
            console.log(`⏭️ Skipping duplicate post: ${post.id}`);
          }
        }

        // Update progress after each keyword search
        completedOperations++;
        if (onProgress) {
          onProgress(completedOperations, totalOperations);
        }

        // Rate limiting - be respectful to Reddit API
        console.log('⏱️ Rate limiting delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        const errorMsg = `Failed to search r/${subreddit} for "${keyword}": ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);

        // Still update progress even on error
        completedOperations++;
        if (onProgress) {
          onProgress(completedOperations, totalOperations);
        }
      }
    }
  }

  console.log(`\n✅ Collection complete: ${allPosts.length} posts collected, ${duplicatesSkipped} duplicates skipped, ${errors.length} errors`);
  
  return {
    posts: allPosts,
    totalCollected: allPosts.length,
    duplicatesSkipped,
    errors
  };
};

// Export singleton instance
export const redditCollector = new RedditCollector();