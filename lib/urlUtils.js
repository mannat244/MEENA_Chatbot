// URL utilities for detecting and fetching content from URLs
import https from 'https';
import { load } from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// Function to detect URLs in user input
export const detectURLs = (text) => {
  if (!text || typeof text !== 'string') return null;

  console.log('🔍 Scanning text for URLs:', text.substring(0, 100) + '...');

  // Enhanced URL regex to capture complete URLs including paths
  const urlRegex = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?/gi;
  
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    let url = match[0];
    
    urls.push({
      originalText: match[0],
      fullUrl: url,
      index: match.index
    });
  }

  // Also check for URLs without protocol
  const urlRegexNoProtocol = /(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}(?:\/[-a-zA-Z0-9()@:%_\+.~#?&=\/]*)?/gi;
  
  while ((match = urlRegexNoProtocol.exec(text)) !== null) {
    let url = match[0];
    
    // Skip if this URL was already captured with protocol
    const alreadyExists = urls.some(existingUrl => 
      existingUrl.originalText.includes(url) || url.includes(existingUrl.originalText)
    );
    
    if (!alreadyExists) {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      urls.push({
        originalText: match[0],
        fullUrl: url,
        index: match.index
      });
    }
  }

  console.log(`📋 Found ${urls.length} URLs:`, urls.map(u => u.fullUrl));
  return urls.length > 0 ? urls : null;
};

// Function to fetch and parse content from a URL
export const fetchURLContent = async (url, maxRetries = 3) => {
  console.log('🌐 Fetching content from:', url);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Import https for Node.js SSL handling
      const https = await import('https');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        // Handle SSL certificate issues like in notices route
        agent: process.env.NODE_ENV === 'production' ? undefined : new https.Agent({
          rejectUnauthorized: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return parseHTMLContent(html, url);
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for ${url}:`, error.message);
      
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error.message,
          url: url,
          content: null
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Function to parse HTML content using Mozilla Readability.js for better extraction
const parseHTMLContent = (html, url) => {
  try {
    console.log('🔍 Starting enhanced content extraction with Readability.js');
    
    // Create JSDOM instance for Readability
    const dom = new JSDOM(html, {
      url: url,
      pretendToBeVisual: false,
      runScripts: "outside-only",
      resources: "usable"
    });
    
    // Check if content is suitable for Readability processing
    const document = dom.window.document;
    
    // Create reader instance to check readability
    const reader = new Readability(document.cloneNode(true));
    let isReadable = false;
    let testParse = null;
    
    try {
      // Try to parse to see if it's readable
      testParse = reader.parse();
      isReadable = testParse && testParse.content && testParse.content.length > 200;
    } catch (e) {
      isReadable = false;
    }
    
    console.log('📊 Content readability check:', isReadable ? 'SUITABLE' : 'LIMITED');
    
    let extractedContent = null;
    let title = '';
    let description = '';
    let mainContent = '';
    
    if (isReadable) {
      // We already parsed it above, use that result
      extractedContent = testParse;
      
      if (extractedContent) {
        title = extractedContent.title || '';
        mainContent = extractedContent.textContent || extractedContent.content || '';
        description = extractedContent.excerpt || '';
        
        console.log('✅ Readability.js extraction successful');
        console.log('📄 Title:', title.substring(0, 100));
        console.log('📝 Content length:', mainContent.length);
        console.log('📋 Description:', description.substring(0, 150));
        console.log('👤 Author:', extractedContent.byline || 'Not specified');
        console.log('📊 Reading length:', extractedContent.length || 0, 'characters');
      }
    }
    
    // Fallback to Cheerio if Readability fails or content isn't suitable
    if (!extractedContent || !mainContent || mainContent.length < 200) {
      console.log('🔄 Using fallback extraction with enhanced Cheerio');
      const $ = load(html);
      
      // Aggressive cleanup - remove noise elements
      $('script, style, nav, footer, header, aside, noscript, iframe').remove();
      $('.nav, .navbar, .footer, .header, .sidebar, .menu').remove();
      $('.advertisement, .ads, .social, .share, .comments, .comment').remove();
      $('.breadcrumb, .pagination, .related-posts, .widget').remove();
      
      // Extract title with multiple fallbacks
      title = title || 
              $('title').text().trim() || 
              $('h1').first().text().trim() || 
              $('meta[property="og:title"]').attr('content') || 
              $('meta[name="twitter:title"]').attr('content') ||
              'Untitled';
      
      // Extract meta description with fallbacks
      description = description ||
                   $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="twitter:description"]').attr('content') ||
                   '';
      
      // Enhanced content extraction with priority selectors
      const contentSelectors = [
        'main article',
        'main .content',
        '[role="main"] article',
        'article',
        'main',
        '[role="main"]',
        '.main-content', 
        '.content', 
        '.page-content', 
        '.post-content',
        '.article-content',
        '.entry-content',
        '#main-content',
        '#content',
        '.container .content',
        'body'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          // Get text content and clean it
          const candidateContent = element.first().text();
          
          // Quality check - prefer longer, substantial content
          if (candidateContent.length > 300) {
            mainContent = candidateContent;
            console.log(`✅ Found good content with selector: ${selector}`);
            break;
          } else if (candidateContent.length > 100 && !mainContent) {
            mainContent = candidateContent; // Keep as backup
          }
        }
      }
    }
    
    // Advanced content cleaning
    mainContent = cleanTextContent(mainContent);
    
    // Extract structured information based on page type
    let pageTypeInfo = '';
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    if (lowerUrl.includes('scholarship') || lowerTitle.includes('scholarship')) {
      pageTypeInfo = extractScholarshipInfo(load(html));
    } else if (lowerUrl.includes('notice') || lowerUrl.includes('announcement')) {
      pageTypeInfo = extractNoticeInfo(load(html));
    } else if (lowerUrl.includes('news') || lowerTitle.includes('news')) {
      pageTypeInfo = 'News Article';
    } else if (lowerUrl.includes('blog') || lowerTitle.includes('blog')) {
      pageTypeInfo = 'Blog Post';
    }
    
    // Final content validation
    if (!mainContent || mainContent.length < 50) {
      console.log('⚠️ Warning: Minimal content extracted, may be a dynamic page');
      mainContent = 'Content extraction limited - this may be a dynamic page that requires JavaScript rendering.';
    }
    
    console.log('✅ Successfully parsed content from:', url);
    console.log('📄 Final Title:', title.substring(0, 100));
    console.log('📝 Final Content length:', mainContent.length);
    console.log('📋 Final Description:', description.substring(0, 150));
    console.log('🎯 Page Type Info:', pageTypeInfo || 'General Content');
    console.log('🔍 Content Preview (first 300 chars):', mainContent.substring(0, 300));
    
    return {
      success: true,
      url: url,
      title: title,
      description: description,
      content: mainContent.substring(0, 8000), // Increased limit for better content
      pageTypeInfo: pageTypeInfo,
      timestamp: new Date().toISOString(),
      extractionMethod: extractedContent ? 'Readability.js' : 'Enhanced Cheerio',
      contentLength: mainContent.length,
      isReadable: isReadable
    };
    
  } catch (error) {
    console.error('❌ Error parsing HTML content:', error);
    return {
      success: false,
      error: 'Failed to parse HTML content: ' + error.message,
      url: url,
      content: null
    };
  }
};

// Enhanced text content cleaning (better than unfluff)
const cleanTextContent = (text) => {
  if (!text) return '';
  
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive newlines but preserve paragraphs
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Remove common noise patterns (case insensitive)
    .replace(/\b(click here|read more|continue reading|share this|tweet this|facebook|instagram|linkedin|subscribe|sign up|newsletter)\b/gi, '')
    // Remove navigation elements
    .replace(/\b(home|about|contact|privacy policy|terms of service|cookie policy)\b/gi, '')
    // Remove common web elements
    .replace(/\b(loading|advertisement|sponsored|related articles|you may also like)\b/gi, '')
    // Clean up email addresses (keep format but genericize)
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL]')
    // Clean up phone numbers (keep essential format)
    .replace(/\b(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]')
    // Remove excessive punctuation
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    .replace(/[.]{3,}/g, '...')
    // Remove social media handles
    .replace(/@\w+/g, '[SOCIAL_HANDLE]')
    // Remove URLs from text content
    .replace(/https?:\/\/[^\s]+/g, '[URL]')
    // Clean up extra spaces around punctuation
    .replace(/\s+([.!?,:;])/g, '$1')
    .replace(/([.!?])\s{2,}/g, '$1 ')
    // Remove standalone numbers and dates that might be navigation
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE]')
    // Trim and clean final result
    .trim()
    // Remove any remaining multiple spaces
    .replace(/\s{2,}/g, ' ');
};

// Extract notice-specific information
const extractNoticeInfo = ($) => {
  const noticeData = {
    dates: [],
    deadlines: [],
    importantPoints: []
  };
  
  const text = $('body').text().toLowerCase();
  
  // Extract dates
  const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    noticeData.dates.push(match[0]);
  }
  
  // Extract deadlines
  const deadlineRegex = /(?:deadline|last date|apply by|before)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi;
  while ((match = deadlineRegex.exec(text)) !== null) {
    noticeData.deadlines.push(match[0]);
  }
  
  return noticeData;
};

// Function to extract scholarship-specific information
const extractScholarshipInfo = ($) => {
  const scholarshipData = {
    eligibility: [],
    amounts: [],
    deadlines: [],
    documents: [],
    contacts: []
  };
  
  // Look for common scholarship-related content
  const text = $('body').text().toLowerCase();
  
  // Extract eligibility criteria
  const eligibilitySelectors = [
    ':contains("eligibility")',
    ':contains("criteria")', 
    ':contains("eligible")',
    ':contains("requirement")'
  ];
  
  eligibilitySelectors.forEach(selector => {
    $(selector).each((i, elem) => {
      const elemText = $(elem).text().trim();
      if (elemText.length > 10 && elemText.length < 500) {
        scholarshipData.eligibility.push(elemText);
      }
    });
  });
  
  // Extract amounts/values
  const amountRegex = /(?:rs\.?|rupees?|₹|amount)\s*[:\-]?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi;
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    scholarshipData.amounts.push(match[0]);
  }
  
  // Extract deadlines
  const dateRegex = /(?:deadline|last date|apply by|before)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    scholarshipData.deadlines.push(match[0]);
  }
  
  return scholarshipData;
};

// Function to check if a URL is scholarship-related
export const isScholarshipURL = (url) => {
  const scholarshipKeywords = [
    'scholarship', 'fellowships', 'financial-aid', 
    'grants', 'bursary', 'stipend', 'fee-waiver'
  ];
  
  return scholarshipKeywords.some(keyword => 
    url.toLowerCase().includes(keyword)
  );
};

// Function to format URL content for LLM consumption
export const formatURLContentForLLM = (urlData) => {
  if (!urlData || !urlData.success) {
    return null;
  }
  
  let formatted = `\n📄 **Content from ${urlData.url}**\n\n`;
  formatted += `**Title:** ${urlData.title}\n\n`;
  
  if (urlData.description) {
    formatted += `**Description:** ${urlData.description}\n\n`;
  }
  
  if (urlData.scholarshipInfo && Object.keys(urlData.scholarshipInfo).length > 0) {
    formatted += `**📚 Scholarship Information:**\n`;
    
    if (urlData.scholarshipInfo.eligibility?.length > 0) {
      formatted += `\n*Eligibility:*\n${urlData.scholarshipInfo.eligibility.slice(0, 3).join('\n')}\n`;
    }
    
    if (urlData.scholarshipInfo.amounts?.length > 0) {
      formatted += `\n*Amount/Value:*\n${urlData.scholarshipInfo.amounts.slice(0, 3).join(', ')}\n`;
    }
    
    if (urlData.scholarshipInfo.deadlines?.length > 0) {
      formatted += `\n*Deadlines:*\n${urlData.scholarshipInfo.deadlines.slice(0, 3).join(', ')}\n`;
    }
  }
  
  formatted += `\n**Content:**\n${urlData.content}\n\n`;
  formatted += `*Source: ${urlData.url}*\n`;
  
  return formatted;
};

// Main function to process URLs in user messages
export const processURLsInMessage = async (message) => {
  const urls = detectURLs(message);
  
  if (!urls || urls.length === 0) {
    return { hasURLs: false, originalMessage: message, urlContent: null };
  }
  
  console.log(`🔗 Processing ${urls.length} URLs found in message`);
  
  const urlContentResults = [];
  
  // Process each URL (limit to first 2 to avoid too much content)
  for (const urlInfo of urls.slice(0, 2)) {
    const content = await fetchURLContent(urlInfo.fullUrl);
    if (content && content.success) {
      urlContentResults.push(content);
    }
  }
  
  if (urlContentResults.length === 0) {
    return { hasURLs: true, originalMessage: message, urlContent: null, error: 'Failed to fetch URL content' };
  }
  
  // Format the URL content for LLM
  const formattedContent = urlContentResults
    .map(formatURLContentForLLM)
    .filter(Boolean)
    .join('\n---\n');
  
  return {
    hasURLs: true,
    originalMessage: message,
    urlContent: formattedContent,
    urlData: urlContentResults,
    processedURLs: urls.length
  };
};