import { NextResponse } from 'next/server';
import chromaDBService from '../../../../lib/chromadb.js';

// Advanced text chunking with sentence-aware splitting
function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  
  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    const sentenceLength = sentenceWithPunctuation.length;
    
    // If adding this sentence would exceed the chunk size
    if (currentSize + sentenceLength > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        size: currentSize
      });
      
      // Start new chunk with overlap from previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentenceWithPunctuation;
      currentSize = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
      currentSize = currentChunk.length;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      size: currentSize
    });
  }
  
  return chunks;
}

// Enhanced HTML text extraction
function extractTextFromHTML(html) {
  // Remove script and style elements
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags but keep the text content
  let text = cleanHtml.replace(/<[^>]*>/g, ' ');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove empty lines and excessive spacing
  text = text.replace(/\n\s*\n/g, '\n').trim();
  
  return text;
}

// Extract title from HTML
function extractTitleFromHTML(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

// Generate comprehensive metadata
function generateMetadata(url, content, chunkIndex, totalChunks) {
  const domain = new URL(url).hostname;
  const title = extractTitleFromHTML(content) || domain;
  
  return {
    source: 'web_scraping',
    url: url,
    domain: domain,
    title: title.trim(),
    chunk_index: chunkIndex,
    total_chunks: totalChunks,
    scraped_at: new Date().toISOString(),
    category: 'web_content',
    subcategory: 'scraped_page',
    priority: 'medium'
  };
}

// POST - Enhanced web scraping with ScraperAPI
export async function POST(request) {
  try {
    const { urls, options = {} } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'URLs array is required'
      }, { status: 400 });
    }
    
    const API_KEY = process.env.SCRAPER_API_KEY;
    const useScraperAPI = !!API_KEY;
    
    console.log(`\n🕷️  Starting web scraping for ${urls.length} URLs...`);
    console.log(`📡 Using ${useScraperAPI ? 'ScraperAPI' : 'Direct Fetch'}`);
    
    const results = [];
    let totalChunks = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const url of urls) {
      try {
        console.log(`\n📄 Processing: ${url}`);
        
        let html;
        
        if (useScraperAPI) {
          // Use ScraperAPI for enhanced scraping
          const scraperParams = new URLSearchParams({
            api_key: API_KEY,
            url: url,
            render: options.render || 'false',
            country_code: options.country_code || 'us'
          });
          
          const scraperUrl = `http://api.scraperapi.com/?${scraperParams.toString()}`;
          console.log(`🔗 Using ScraperAPI...`);
          
          const response = await fetch(scraperUrl);
          
          if (!response.ok) {
            throw new Error(`ScraperAPI returned status ${response.status}: ${response.statusText}`);
          }
          
          html = await response.text();
        } else {
          // Fallback to direct fetch
          console.log(`🔗 Using direct fetch (no ScraperAPI key)...`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          html = await response.text();
        }
        
        console.log(`📥 Scraped ${html.length} characters of HTML`);
        
        // Extract clean text
        const cleanText = extractTextFromHTML(html);
        console.log(`🧹 Extracted ${cleanText.length} characters of clean text`);
        
        if (cleanText.length < 100) {
          console.log(`⚠️  Warning: Very short content extracted from ${url}`);
          results.push({
            url: url,
            success: false,
            error: 'Insufficient content extracted',
            contentLength: cleanText.length
          });
          errorCount++;
          continue;
        }
        
        // Intelligent chunking
        const chunks = chunkText(cleanText, options.chunkSize || 1000, options.overlap || 200);
        console.log(`📚 Created ${chunks.length} chunks from content`);
        
        // Add each chunk to ChromaDB
        let chunkSuccessCount = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkId = `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_chunk_${i}`;
          
          const metadata = generateMetadata(url, html, i + 1, chunks.length);
          const title = chunks.length > 1 
            ? `${metadata.title} (Part ${i + 1}/${chunks.length})`
            : metadata.title;
          
          const result = await chromaDBService.addKnowledgeEntry({
            id: chunkId,
            title: title,
            content: chunk.text,
            category: metadata.category,
            subcategory: metadata.subcategory,
            tags: [metadata.domain, 'scraped', 'web_content', url.includes('edu') ? 'education' : 'general'],
            source: metadata.source,
            priority: metadata.priority,
            metadata: metadata
          });
          
          if (result.success) {
            totalChunks++;
            chunkSuccessCount++;
            console.log(`✅ Added chunk ${i + 1}/${chunks.length} to knowledge base (ID: ${chunkId})`);
          } else {
            console.log(`❌ Failed to add chunk ${i + 1}/${chunks.length}`);
          }
        }
        
        results.push({
          url: url,
          success: true,
          chunks_created: chunkSuccessCount,
          total_characters: cleanText.length,
          title: generateMetadata(url, html, 0, 0).title
        });
        
        successCount++;
        console.log(`✅ Successfully processed: ${url}`);
        
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
        results.push({
          url: url,
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`\n📊 Scraping Summary:`);
    console.log(`✅ Successfully processed: ${successCount} URLs`);
    console.log(`❌ Failed: ${errorCount} URLs`);
    console.log(`📚 Total chunks created: ${totalChunks}`);
    
    return NextResponse.json({
      success: true,
      message: `Scraping completed. Processed ${successCount}/${urls.length} URLs successfully.`,
      summary: {
        total_urls: urls.length,
        successful_urls: successCount,
        failed_urls: errorCount,
        total_chunks_created: totalChunks,
        scraper_type: useScraperAPI ? 'ScraperAPI' : 'Direct Fetch'
      },
      results: results
    });
    
  } catch (error) {
    console.error('Web scraping error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process web scraping request',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Get scraping status and configuration
export async function GET(request) {
  try {
    const API_KEY = process.env.SCRAPER_API_KEY;
    
    // Get scraping statistics
    await chromaDBService.initialize();
    const knowledgeCollection = chromaDBService.collections.knowledgeBase;
    
    // Get scraped entries
    const allEntries = await knowledgeCollection.get({ limit: 1000 });
    const scrapedEntries = allEntries.ids.filter((id, index) => 
      allEntries.metadatas[index]?.source === 'web_scraping'
    );
    
    return NextResponse.json({
      success: true,
      configured: !!API_KEY,
      message: API_KEY ? 'ScraperAPI is configured and ready' : 'Using direct fetch (ScraperAPI key not configured)',
      features: {
        javascript_rendering: !!API_KEY,
        country_targeting: !!API_KEY,
        automatic_retries: !!API_KEY,
        captcha_solving: !!API_KEY,
        intelligent_chunking: true,
        sentence_aware_splitting: true
      },
      limits: {
        default_chunk_size: 1000,
        default_overlap: 200,
        max_chunk_size: 2000,
        supported_formats: ['HTML', 'Text content extraction']
      },
      statistics: {
        total_scraped_entries: scrapedEntries.length,
        last_scrape: 'Not available' // Could be enhanced to track this
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get scraping configuration'
    }, { status: 500 });
  }
}