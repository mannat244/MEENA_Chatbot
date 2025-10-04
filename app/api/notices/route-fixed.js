import { NextResponse } from 'next/server';
import https from 'https';

// Custom fetch function that handles SSL certificate issues
async function fetchWithSSLBypass(url, options = {}) {
  if (process.env.NODE_ENV === 'development') {
    // For development, create custom agent that bypasses SSL verification
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    return fetch(url, {
      ...options,
      agent
    });
  } else {
    // In production, use normal fetch
    return fetch(url, options);
  }
}

export async function GET(request) {
  try {
    console.log('🔍 Fetching latest notices from MANIT RSS feed...');
    
    // Try primary RSS feed with SSL bypass for development
    let response;
    try {
      response = await fetchWithSSLBypass('https://www.manit.ac.in/rss.xml', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        cache: 'no-store',
        timeout: 10000 // 10 second timeout
      });
    } catch (sslError) {
      console.log('⚠️ SSL fetch failed, trying alternative approach...');
      
      // Alternative: Try with different headers or HTTP instead of HTTPS
      try {
        response = await fetch('http://www.manit.ac.in/rss.xml', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          cache: 'no-store',
          timeout: 10000
        });
      } catch (httpError) {
        console.log('⚠️ HTTP fetch also failed, using fallback data...');
        throw new Error('Both HTTPS and HTTP failed');
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('✅ RSS feed fetched successfully, length:', xmlText.length);
    
    // Parse the XML to extract notices
    const notices = parseRSSXML(xmlText);
    
    return NextResponse.json({
      success: true,
      notices,
      totalCount: notices.length,
      lastUpdated: new Date().toISOString(),
      source: 'live_rss_feed'
    });

  } catch (error) {
    console.error('❌ Error fetching notices:', error.message);
    
    // Use fallback notices
    try {
      console.log('🔄 Using fallback notices...');
      const fallbackNotices = await getFallbackNotices();
      
      return NextResponse.json({
        success: true,
        notices: fallbackNotices,
        totalCount: fallbackNotices.length,
        lastUpdated: new Date().toISOString(),
        source: 'fallback_data',
        note: 'Live RSS feed unavailable, showing sample recent notices. For latest updates visit https://www.manit.ac.in'
      });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      
      return NextResponse.json({
        success: false,
        error: 'Unable to fetch notices at this time',
        details: error.message,
        suggestion: 'Please visit https://www.manit.ac.in directly for the latest notices and announcements'
      }, { status: 500 });
    }
  }
}

// Function to parse RSS XML and extract notice information
function parseRSSXML(xmlText) {
  const notices = [];
  
  try {
    // Extract items using regex patterns (simple XML parsing)
    const itemPattern = /<item>([\s\S]*?)<\/item>/g;
    const items = xmlText.match(itemPattern) || [];
    
    console.log(`🔍 Found ${items.length} items in RSS feed`);
    
    items.forEach((item, index) => {
      try {
        // Extract title
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : 'Untitled Notice';
        
        // Extract link
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const link = linkMatch ? linkMatch[1].trim() : '';
        
        // Extract publication date
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
        
        // Extract description (clean up HTML)
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
        let description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
        
        // Clean up description - remove HTML tags and decode entities
        description = cleanDescription(description);
        
        // Extract category if present
        const categoryMatch = item.match(/property="rdfs:label skos:prefLabel"[^>]*>(.*?)<\/a>/);
        const category = categoryMatch ? categoryMatch[1].trim() : 'General';
        
        // Parse date for better formatting
        const formattedDate = formatDate(pubDate);
        
        // Only add if we have essential information
        if (title && title.length > 10) {
          notices.push({
            id: `notice_${index + 1}`,
            title,
            link,
            description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
            category,
            pubDate,
            formattedDate,
            isRecent: isRecentNotice(pubDate)
          });
        }
      } catch (itemError) {
        console.warn('⚠️ Error parsing individual notice item:', itemError.message);
      }
    });
    
    // Sort by publication date (newest first)
    notices.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    console.log(`📋 Parsed ${notices.length} notices successfully`);
    return notices.slice(0, 15); // Return top 15 notices
    
  } catch (error) {
    console.error('❌ Error parsing RSS XML:', error);
    return [];
  }
}

// Clean up HTML description
function cleanDescription(description) {
  if (!description) return '';
  
  // Remove HTML tags
  let cleaned = description.replace(/<[^>]*>/g, ' ');
  
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Format publication date
function formatDate(pubDate) {
  if (!pubDate) return 'Date not available';
  
  try {
    const date = new Date(pubDate);
    if (isNaN(date.getTime())) return pubDate;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  } catch (error) {
    return pubDate;
  }
}

// Check if notice is recent (within last 30 days)
function isRecentNotice(pubDate) {
  if (!pubDate) return false;
  
  try {
    const noticeDate = new Date(pubDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return noticeDate >= thirtyDaysAgo;
  } catch (error) {
    return false;
  }
}

// Fallback function with sample notices when live feed fails
async function getFallbackNotices() {
  console.log('📋 Using fallback notices data...');
  
  const fallbackNotices = [
    {
      id: 'fallback_1',
      title: 'Even and Odd Semester Supplementary Examination Notice October 2025',
      link: 'https://www.manit.ac.in/content/even-and-odd-semester-supplementary-examination-notice-october-2025-only-ug-admitted-upto',
      description: 'Important notice regarding supplementary examinations for UG students admitted up to 2021-22 and PG students admitted up to 2022-23. Students need to fill details on MIS system.',
      category: 'Supplementary Examination',
      pubDate: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_2',
      title: 'Allotment of Supervisor for Newly Ph.D Full Time and Part Time Scholars Admitted in 2025',
      link: 'https://www.manit.ac.in/content/allotment-supervisor-newly-phd-full-time-and-part-time-scholars-admitted-2025',
      description: 'Official notification for supervisor allotment to newly admitted Ph.D scholars in 2025. Check the detailed list and contact information.',
      category: 'Ph.D Admission 2025-26',
      pubDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_3',
      title: 'UG & PG Students Registration Notice - Current Semester 2025',
      link: 'https://www.manit.ac.in/content/following-ug-pg-students-admitted-year-2024-20232022-are-not-registered-current-semester',
      description: 'List of UG & PG students who have not yet registered for the current semester. Students must complete registration immediately.',
      category: 'Registration Notice 2025-26',
      pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_4',
      title: 'Placement Drive - Multiple Companies Visiting Campus',
      link: 'https://www.manit.ac.in',
      description: 'Various companies including ICICI Bank, Uber, Cisco, and others are conducting placement drives. Students should prepare and participate actively.',
      category: 'Placement & Career',
      pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_5',
      title: 'Academic Calendar and Important Dates 2025-26',
      link: 'https://www.manit.ac.in/content/time-table-classes-and-examinations',
      description: 'Complete academic calendar with examination schedules, registration deadlines, and other important academic dates for the current session.',
      category: 'Academic Calendar',
      pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    }
  ];
  
  return fallbackNotices;
}