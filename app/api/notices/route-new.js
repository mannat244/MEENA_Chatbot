import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Disable SSL verification for development to handle MANIT website certificate issues
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET(request) {
  try {
    console.log('🔍 Fetching latest notices from MANIT homepage...');
    
    // Try fetching the MANIT homepage directly
    const response = await fetch('https://www.manit.ac.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const htmlContent = await response.text();
    console.log('✅ Successfully fetched MANIT homepage, length:', htmlContent.length);
    
    // Parse the HTML to extract notices from the modal
    const notices = parseMANITHomepage(htmlContent);
    
    if (notices.length === 0) {
      throw new Error('No notices found in HTML content');
    }
    
    return NextResponse.json({
      success: true,
      notices,
      totalCount: notices.length,
      lastUpdated: new Date().toISOString(),
      source: 'live_manit_homepage'
    });

  } catch (error) {
    console.error('❌ Error fetching notices:', error.message);
    
    // Use enhanced fallback notices based on the actual MANIT website structure
    console.log('🔄 Using enhanced fallback notices...');
    const fallbackNotices = getFallbackNotices();
    
    return NextResponse.json({
      success: true,
      notices: fallbackNotices,
      totalCount: fallbackNotices.length,
      lastUpdated: new Date().toISOString(),
      source: 'fallback_enhanced',
      note: 'Live website temporarily unavailable. Showing recent notices based on MANIT website structure. Visit https://www.manit.ac.in for latest updates.'
    });
  }
}

// Function to parse MANIT homepage and extract notices from the modal
function parseMANITHomepage(htmlContent) {
  const notices = [];
  
  try {
    const $ = cheerio.load(htmlContent);
    console.log('🔍 Parsing HTML content for notices...');
    
    // Look for the modal content with latest news
    const modalBody = $('.modal-body.quick');
    
    if (modalBody.length > 0) {
      console.log('✅ Found modal body with notices');
      
      // Extract all notice links from the modal
      modalBody.find('p a').each((index, element) => {
        try {
          const $link = $(element);
          const title = $link.text().trim();
          const href = $link.attr('href');
          
          // Skip empty titles or very short ones
          if (!title || title.length < 10) return;
          
          // Clean up the title (remove "new" image references)
          const cleanTitle = title.replace(/\s*<img[^>]*>\s*/g, '').trim();
          
          // Determine category from title content
          let category = 'General';
          const titleLower = cleanTitle.toLowerCase();
          
          if (titleLower.includes('exam') || titleLower.includes('supplementary')) {
            category = 'Examination';
          } else if (titleLower.includes('admission') || titleLower.includes('phd')) {
            category = 'Admission';
          } else if (titleLower.includes('placement') || titleLower.includes('company')) {
            category = 'Placement';
          } else if (titleLower.includes('conference') || titleLower.includes('workshop') || titleLower.includes('fdp')) {
            category = 'Events & Conferences';
          } else if (titleLower.includes('registration') || titleLower.includes('academic')) {
            category = 'Academic';
          } else if (titleLower.includes('library') || titleLower.includes('facility')) {
            category = 'Facilities';
          }
          
          // Generate description based on title
          let description = '';
          if (titleLower.includes('supplementary')) {
            description = 'Important notice regarding supplementary examinations. Please check the detailed requirements and deadlines.';
          } else if (titleLower.includes('admission')) {
            description = 'Admission related information and guidelines. Review the requirements and submit necessary documents.';
          } else if (titleLower.includes('registration')) {
            description = 'Student registration information. Complete the registration process within the specified timeline.';
          } else if (titleLower.includes('placement')) {
            description = 'Placement and career opportunity details. Students should prepare and participate actively.';
          } else if (titleLower.includes('conference') || titleLower.includes('workshop')) {
            description = 'Academic event information. Participate to enhance knowledge and networking opportunities.';
          } else {
            description = 'Important institute notice. Please read the complete details for relevant information.';
          }
          
          // Create full URL if relative
          let fullUrl = href;
          if (href && !href.startsWith('http')) {
            fullUrl = href.startsWith('/') 
              ? `https://www.manit.ac.in${href}` 
              : `https://www.manit.ac.in/${href}`;
          }
          
          const notice = {
            id: `notice_${index + 1}`,
            title: cleanTitle,
            link: fullUrl || 'https://www.manit.ac.in',
            description,
            category,
            pubDate: new Date().toISOString(),
            formattedDate: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'Asia/Kolkata'
            }),
            isRecent: true
          };
          
          notices.push(notice);
          
        } catch (itemError) {
          console.warn('⚠️ Error parsing notice item:', itemError.message);
        }
      });
    } else {
      console.log('❌ Modal body not found, trying alternative selectors...');
      
      // Try alternative selectors for notices
      const alternativeSelectors = [
        '.quick a',
        '.modal-content a',
        '.news a',
        '.notices a',
        '[class*="news"] a',
        '[class*="notice"] a'
      ];
      
      for (const selector of alternativeSelectors) {
        const links = $(selector);
        if (links.length > 0) {
          console.log(`✅ Found ${links.length} links with selector: ${selector}`);
          break;
        }
      }
    }
    
    console.log(`📋 Extracted ${notices.length} notices from homepage`);
    return notices.slice(0, 12); // Return top 12 notices
    
  } catch (error) {
    console.error('❌ Error parsing MANIT homepage:', error);
    return [];
  }
}

// Enhanced fallback notices based on actual MANIT website content
function getFallbackNotices() {
  console.log('📋 Using enhanced fallback notices based on MANIT website structure...');
  
  return [
    {
      id: 'fallback_1',
      title: 'Even and Odd Semester Supplementary Examination Notice October 2025 Only for UG (Admitted Upto Academic Year 2021-22) and PG (Admitted Upto Academic Year 2022-23) to Be Filled on MIS',
      link: 'https://www.manit.ac.in/sites/default/files/addmissionsection/Sepplementary%20Examination%20Notice%20MIS.pdf',
      description: 'Important supplementary examination notice for UG students admitted up to 2021-22 and PG students admitted up to 2022-23. Students must fill details on MIS system within the specified deadline.',
      category: 'Examination',
      pubDate: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_2',
      title: 'Even and Odd Semester Supplementary Examination Notice October 2025 Only for UG (Admitted from Academic Year 2022-23 to 2024-25) and PG (Admitted in the Academic Year from 2023-24 to 2024-25) to Be Filled on ERP Smile',
      link: 'https://www.manit.ac.in/sites/default/files/Sepplementary%20Examination%20Notice-1%20ERP.pdf',
      description: 'Supplementary examination notice for recent batch UG and PG students. Registration to be completed on ERP Smile portal.',
      category: 'Examination',
      pubDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_3',
      title: 'Opening of central Library at 8:30 am for cleaning purpose',
      link: 'https://www.manit.ac.in/sites/default/files/news_and_events/Adobe%20Scan%2029-Sep-2025%20%281%29%20%281%29.pdf',
      description: 'Notice regarding special opening hours of central library for cleaning and maintenance activities.',
      category: 'Facilities',
      pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_4',
      title: 'Celebration of 156th Birth Anniversary of Mahatma Gandhi',
      link: 'https://www.manit.ac.in/sites/default/files/news_and_events/Circular%20-%20Gandhi%20Jayanti.pdf',
      description: 'Notice regarding celebration of Gandhi Jayanti and related activities organized by the institute.',
      category: 'Events & Conferences',
      pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_5',
      title: 'Time Table for Mid Term examination',
      link: 'https://www.manit.ac.in/content/time-table-classes-and-examinations',
      description: 'Mid-term examination schedule and time table for all undergraduate and postgraduate programs.',
      category: 'Examination',
      pubDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_6',
      title: 'Six Days Online ATAL FDP on Emerging Power Converter Topologies and Control Methods for Electric Vehicles and Renewable Energy Systems',
      link: 'https://conf.manit.ac.in/assets/pdf/FINAL%20ATAL2025.pdf',
      description: 'Faculty Development Program on emerging technologies in electric vehicles and renewable energy. Registration open for faculty members.',
      category: 'Events & Conferences',
      pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_7',
      title: 'International Conference on Recent Trends in Functional Materials (ICRTFM-2025)',
      link: 'https://conf.manit.ac.in/ICRTFM2025/',
      description: 'International conference on functional materials with offline and online participation modes. Dates: December 1-3, 2025.',
      category: 'Events & Conferences',
      pubDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    },
    {
      id: 'fallback_8',
      title: '1st IEEE International Conference on Recent Trends in Computing and Smart Mobility (RCSM)',
      link: 'https://conf.manit.ac.in/assets/pdf/RCSM_Broucher_Final%20(1).pdf',
      description: 'IEEE conference on computing and smart mobility technologies. Dates: December 5-6, 2025.',
      category: 'Events & Conferences',
      pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      formattedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
      }),
      isRecent: true
    }
  ];
}