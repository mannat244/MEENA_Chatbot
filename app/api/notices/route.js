import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import https from 'https';

// Custom fetch function that handles SSL certificate issues for development
async function fetchWithSSLBypass(url, options = {}) {
  // For development, bypass SSL certificate verification
  if (process.env.NODE_ENV === 'development') {
    // Disable SSL verification for development
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      // Add longer timeout
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    return response;
  } finally {
    // Re-enable SSL verification after the request
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
  }
}

export async function GET(request) {
  try {
    console.log('🔍 Fetching latest notices from MANIT homepage...');
    
    // Fetch the main HTML page from MANIT
    let response;
    try {
      response = await fetchWithSSLBypass('https://www.manit.ac.in/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        cache: 'no-store',
        timeout: 15000 // 15 second timeout
      });
    } catch (sslError) {
      console.log('⚠️ HTTPS fetch failed, trying HTTP...');
      
      try {
        response = await fetch('http://www.manit.ac.in/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          cache: 'no-store',
          timeout: 15000
        });
      } catch (httpError) {
        console.log('⚠️ HTTP fetch also failed, using fallback data...');
        throw new Error('Both HTTPS and HTTP failed');
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch MANIT homepage: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();
    console.log('✅ HTML content fetched successfully, length:', htmlContent.length);
    
    // Parse the HTML to extract notices from the modal
    const notices = parseHTMLNotices(htmlContent);
    
    return NextResponse.json({
      success: true,
      notices,
      totalCount: notices.length,
      lastUpdated: new Date().toISOString(),
      source: 'live_html_scraping'
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
        note: 'Live website unavailable, showing sample recent notices. For latest updates visit https://www.manit.ac.in'
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

// Function to parse HTML and extract notices from the modal
function parseHTMLNotices(htmlContent) {
  const notices = [];
  
  try {
    const $ = cheerio.load(htmlContent);
    console.log('📋 HTML loaded successfully with Cheerio');
    
    // Look for the modal content containing notices
    const modalBody = $('.modal-body.quick');
    
    if (modalBody.length === 0) {
      console.log('⚠️ Modal body not found, trying alternative selectors...');
      
      // Alternative selectors - look for common patterns
      const alternativeSelectors = [
        '.modal-body',
        '#basicExampleModal .modal-body',
        '.latest-news',
        '.news-content',
        '.notices',
        '.announcements'
      ];
      
      let foundContent = false;
      for (const selector of alternativeSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          console.log(`✅ Found content with selector: ${selector}`);
          foundContent = true;
          break;
        }
      }
      
      if (!foundContent) {
        console.log('❌ No modal content found, using fallback approach');
        return [];
      }
    }
    
    // Extract notice links from the modal
    const noticeLinks = modalBody.find('a[href]');
    console.log(`🔍 Found ${noticeLinks.length} notice links`);
    
    noticeLinks.each((index, element) => {
      try {
        const $link = $(element);
        const href = $link.attr('href');
        const titleText = $link.text().trim();
        
        // Skip empty or invalid links
        if (!href || !titleText || titleText.length < 10) {
          return;
        }
        
        // Clean up the title text (remove extra whitespace and new.gif references)
        const cleanTitle = titleText.replace(/\s+/g, ' ').trim();
        
        // Extract file type from href
        let category = 'General';
        if (href.includes('examination') || href.includes('exam')) {
          category = 'Examination';
        } else if (href.includes('admission') || href.includes('registration')) {
          category = 'Admission & Registration';
        } else if (href.includes('placement') || href.includes('career') || href.includes('job')) {
          category = 'Placement & Career';
        } else if (href.includes('conference') || href.includes('workshop') || href.includes('seminar')) {
          category = 'Events & Conferences';
        } else if (href.includes('circular') || href.includes('notice')) {
          category = 'Official Circular';
        }
        
        // Determine if it's a recent notice (assume all are recent since they're on the homepage)
        const isRecent = true;
        
        // Create the notice object
        const notice = {
          id: `html_notice_${index + 1}`,
          title: cleanTitle,
          link: href.startsWith('http') ? href : `https://www.manit.ac.in${href}`,
          description: generateDescription(cleanTitle, category),
          category,
          pubDate: new Date().toISOString(), // Since these are current notices
          formattedDate: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
          }),
          isRecent
        };
        
        notices.push(notice);
        
      } catch (itemError) {
        console.warn('⚠️ Error parsing individual notice:', itemError.message);
      }
    });
    
    console.log(`📋 Successfully parsed ${notices.length} notices from HTML`);
    return notices.slice(0, 15); // Return top 15 notices
    
  } catch (error) {
    console.error('❌ Error parsing HTML content:', error);
    return [];
  }
}

// Helper function to generate description based on title and category
function generateDescription(title, category) {
  const descriptions = {
    'Examination': 'Important examination-related notice. Please check the detailed PDF document for specific dates, procedures, and requirements.',
    'Admission & Registration': 'Critical information regarding admission process or student registration. Students must review this notice carefully.',
    'Placement & Career': 'Career opportunity and placement-related announcement. Students should prepare and participate as required.',
    'Events & Conferences': 'Academic event, conference, or workshop announcement. Check for participation details and deadlines.',
    'Official Circular': 'Official institutional circular with important information. All stakeholders should review this document.',
    'General': 'Important institutional notice. Please refer to the complete document for detailed information.'
  };
  
  return descriptions[category] || descriptions['General'];
}

// Clean up text content
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
  if (!pubDate) return new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  
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

// Fallback function with actual notices from MANIT website structure
async function getFallbackNotices() {
  console.log('📋 Using fallback notices based on MANIT website structure...');
  
  const fallbackNotices = [
    {
      id: 'fallback_1',
      title: 'Even and Odd Semester Supplementary Examination Notice October 2025 Only for UG (Admitted Upto Academic Year 2021-22) and PG (Admitted Upto Academic Year 2022-23) to Be Filled on MIS',
      link: 'https://www.manit.ac.in/sites/default/files/addmissionsection/Sepplementary%20Examination%20Notice%20MIS.pdf',
      description: 'Important notice regarding supplementary examinations for UG students admitted up to 2021-22 and PG students admitted up to 2022-23. Students need to fill details on MIS system.',
      category: 'Examination',
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
      title: 'Even and Odd Semester Supplementary Examination Notice October 2025 Only for UG (Admitted from Academic Year 2022-23 to 2024-25) and PG (Admitted in the Academic Year from 2023-24 to 2024-25) to Be Filled on ERP Smile',
      link: 'https://www.manit.ac.in/sites/default/files/Sepplementary%20Examination%20Notice-1%20ERP.pdf',
      description: 'Supplementary examination notice for recently admitted UG and PG students. Forms to be filled on ERP Smile system.',
      category: 'Examination',
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
      title: 'Opening of central Library at 8:30 am for cleaning purpose',
      link: 'https://www.manit.ac.in/sites/default/files/news_and_events/Adobe%20Scan%2029-Sep-2025%20%281%29%20%281%29.pdf',
      description: 'Notice regarding central library opening hours and cleaning schedule. Students and faculty should note the updated timings.',
      category: 'Official Circular',
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
      title: 'Celebration of 156th Birth Anniversary of Mahatma Gandhi',
      link: 'https://www.manit.ac.in/sites/default/files/news_and_events/Circular%20-%20Gandhi%20Jayanti.pdf',
      description: 'Official circular regarding the celebration of Mahatma Gandhi\'s birth anniversary. All students and staff are invited to participate.',
      category: 'Events & Conferences',
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
      title: 'Revised Choices for Group C (Open Elective)- UG VII Semester (2025) M.A.N.I.T. Bhopal',
      link: 'https://www.manit.ac.in/sites/default/files/Revised%20Choices%20for%20Group%20C%20%28Open%20Elective%29-%20UG%20VII%20Semester%20%282025%29%20M.A.N.I.T.%20Bhopal%20dt%2026%2009%202025.pdf',
      description: 'Updated information about open elective choices for UG VII semester students. Students must review and submit their preferences.',
      category: 'Admission & Registration',
      pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_6',
      title: 'Time Table for Mid Term examination',
      link: 'https://www.manit.ac.in/content/time-table-classes-and-examinations',
      description: 'Complete schedule and timetable for upcoming mid-term examinations. Students should check dates and prepare accordingly.',
      category: 'Examination',
      pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_7',
      title: '1st IEEE International Conference on Recent Trends in Computing and Smart Mobility (RCSM) December 5th – 6th, 2025',
      link: 'https://conf.manit.ac.in/assets/pdf/RCSM_Broucher_Final%20(1).pdf',
      description: 'International conference on computing and smart mobility. Researchers and students are invited to participate and submit papers.',
      category: 'Events & Conferences',
      pubDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
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