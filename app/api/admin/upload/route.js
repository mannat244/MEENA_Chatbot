import { NextResponse } from 'next/server';
import chromaDBService from '../../../../lib/chromadb.js';

// POST - Handle file uploads (PDF, text, JSON)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const category = formData.get('category') || 'documents';
    const source = formData.get('source') || 'upload';
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        
        // Read file content
        const buffer = Buffer.from(await file.arrayBuffer());
        let content = '';
        let title = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
        
        // Process different file types
        if (fileType === 'application/pdf') {
          // For PDF processing, you'd typically use a library like pdf-parse
          // For now, we'll create a placeholder
          content = `PDF file: ${fileName} (${fileSize} bytes) - Content extraction requires PDF processing library`;
          title = `PDF: ${title}`;
          
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
          content = buffer.toString('utf-8');
          title = `Document: ${title}`;
          
        } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
          try {
            const jsonData = JSON.parse(buffer.toString('utf-8'));
            
            // If it's a knowledge base JSON with multiple entries
            if (Array.isArray(jsonData)) {
              for (const [index, entry] of jsonData.entries()) {
                if (entry.title && entry.content) {
                  const entryId = entry.id || `json_${Date.now()}_${index}`;
                  
                  const result = await chromaDBService.addKnowledgeEntry({
                    id: entryId,
                    title: entry.title,
                    content: entry.content,
                    category: entry.category || category,
                    subcategory: entry.subcategory || '',
                    tags: entry.tags || [],
                    source: `json_upload_${fileName}`,
                    priority: entry.priority || 'medium'
                  });
                  
                  results.push({
                    file: fileName,
                    entry: entry.title,
                    success: result.success,
                    error: result.error,
                    type: 'json_array_entry'
                  });
                }
              }
              continue; // Skip the regular processing for JSON arrays
            } else {
              // Single JSON object
              content = JSON.stringify(jsonData, null, 2);
              title = `JSON: ${title}`;
            }
          } catch (jsonError) {
            content = buffer.toString('utf-8');
            title = `Text: ${title}`;
          }
          
        } else if (fileName.endsWith('.md')) {
          content = buffer.toString('utf-8');
          title = `Markdown: ${title}`;
          
        } else {
          // Unknown file type, treat as text
          content = buffer.toString('utf-8');
          title = `File: ${title}`;
        }
        
        // Add to knowledge base (for non-JSON arrays)
        if (content && title) {
          const entryId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Split large content into chunks if needed
          const maxChunkSize = 2000;
          if (content.length > maxChunkSize) {
            const chunks = [];
            for (let i = 0; i < content.length; i += maxChunkSize) {
              chunks.push(content.substring(i, i + maxChunkSize));
            }
            
            // Add each chunk as a separate entry
            for (const [chunkIndex, chunk] of chunks.entries()) {
              const chunkId = `${entryId}_chunk_${chunkIndex}`;
              const chunkTitle = `${title} (Part ${chunkIndex + 1}/${chunks.length})`;
              
              const result = await chromaDBService.addKnowledgeEntry({
                id: chunkId,
                title: chunkTitle,
                content: chunk,
                category,
                subcategory: 'file_upload',
                tags: [`upload`, `${fileType}`, `multipart`],
                source: `file_upload_${fileName}`,
                priority: 'medium'
              });
              
              results.push({
                file: fileName,
                entry: chunkTitle,
                success: result.success,
                error: result.error,
                type: 'chunk',
                size: chunk.length
              });
            }
          } else {
            // Single entry
            const result = await chromaDBService.addKnowledgeEntry({
              id: entryId,
              title,
              content,
              category,
              subcategory: 'file_upload',
              tags: [`upload`, `${fileType}`],
              source: `file_upload_${fileName}`,
              priority: 'medium'
            });
            
            results.push({
              file: fileName,
              entry: title,
              success: result.success,
              error: result.error,
              type: 'single',
              size: content.length
            });
          }
        }
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        results.push({
          file: file.name,
          entry: null,
          success: false,
          error: fileError.message,
          type: 'error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return NextResponse.json({
      success: successCount > 0,
      message: `Processed ${totalCount} entries, ${successCount} successful`,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });
    
  } catch (error) {
    console.error('Error processing file uploads:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file uploads',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Get upload history or supported file types
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'supported-types') {
    return NextResponse.json({
      success: true,
      supportedTypes: [
        {
          type: 'text/plain',
          extensions: ['.txt'],
          description: 'Plain text files'
        },
        {
          type: 'application/json',
          extensions: ['.json'],
          description: 'JSON files (single entries or arrays)'
        },
        {
          type: 'text/markdown',
          extensions: ['.md'],
          description: 'Markdown files'
        },
        {
          type: 'application/pdf',
          extensions: ['.pdf'],
          description: 'PDF files (requires processing)'
        }
      ],
      maxFileSize: '10MB',
      maxFiles: 10
    });
  }
  
  // Default: return upload statistics
  try {
    await chromaDBService.initialize();
    
    // Get entries that were uploaded from files
    const knowledgeCollection = chromaDBService.collections.knowledgeBase;
    const uploadedEntries = await knowledgeCollection.get({
      where: {
        source: { $regex: '^(file_upload|json_upload)' }
      },
      limit: 100
    });
    
    const uploadStats = {
      totalUploaded: uploadedEntries.ids.length,
      recentUploads: uploadedEntries.ids.slice(0, 10).map((id, index) => ({
        id,
        title: uploadedEntries.metadatas[index]?.title || 'Unknown',
        source: uploadedEntries.metadatas[index]?.source || 'unknown',
        created_at: uploadedEntries.metadatas[index]?.created_at || new Date().toISOString()
      }))
    };
    
    return NextResponse.json({
      success: true,
      uploadStats
    });
    
  } catch (error) {
    console.error('Error fetching upload stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch upload statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}