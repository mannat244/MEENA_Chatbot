import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Get ChromaDB service with runtime loading
const getChromaService = async () => {
  try {
    const chromaDBModule = await import('@/lib/chromadb');
    const service = chromaDBModule.default;
    return service;
  } catch (error) {
    console.warn('ChromaDB loading failed:', error.message);
    throw new Error('ChromaDB service unavailable');
  }
};

// Intelligent text chunking for processed content
function chunkText(text, maxChunkSize = 1500, overlapSize = 300) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  let currentSize = 0;

  for (const paragraph of paragraphs) {
    const paragraphLength = paragraph.length;
    
    if (currentSize + paragraphLength > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const overlapSentences = sentences.slice(-2);
      currentChunk = overlapSentences.join('. ') + '. ' + paragraph;
      currentSize = currentChunk.length;
    } else {
      if (currentChunk) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      currentSize += paragraphLength;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 100);
}

export async function POST(request) {
  console.log('\n📄 ===== GEMINI MULTIMODAL PDF PROCESSING API =====');
  
  try {
    const chromaService = await getChromaService();
    await chromaService.initialize();
    console.log('✅ ChromaDB service ready');

    const formData = await request.formData();
    const file = formData.get('file');
    const options = {
      maxChunkSize: parseInt(formData.get('maxChunkSize')) || 1500,
      overlapSize: parseInt(formData.get('overlapSize')) || 300,
      storeInKnowledge: formData.get('storeInKnowledge') === 'true',
      analysisDepth: formData.get('analysisDepth') || 'standard'
    };

    console.log('📋 Processing options:', options);
    console.log('📁 File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        success: false,
        error: 'Only PDF files are supported'
      }, { status: 400 });
    }

    const maxInlineSize = 20 * 1024 * 1024; // 20MB
    const useFileAPI = file.size > maxInlineSize;

    console.log(`📄 Processing PDF with ${useFileAPI ? 'File API' : 'inline data'} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let geminiFile = null;
    let analysisResults = null;

    try {
      if (useFileAPI) {
        console.log('📤 Uploading file to Gemini File API...');
        
        const fileBlob = new Blob([buffer], { type: 'application/pdf' });
        
        geminiFile = await genAI.files.upload({
          file: fileBlob,
          config: {
            displayName: file.name,
            mimeType: 'application/pdf'
          }
        });

        console.log('⏳ Waiting for file processing...');
        
        let getFile = await genAI.files.get({ name: geminiFile.name });
        let attempts = 0;
        const maxAttempts = 12;
        
        while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          getFile = await genAI.files.get({ name: geminiFile.name });
          attempts++;
          console.log(`⏳ File status: ${getFile.state} (attempt ${attempts}/${maxAttempts})`);
        }

        if (getFile.state === 'FAILED') {
          throw new Error('File processing failed on Gemini servers');
        }

        if (getFile.state === 'PROCESSING') {
          throw new Error('File processing timeout - please try again');
        }

        console.log('✅ File processed successfully');

        const analysisPrompt = getAnalysisPrompt(options.analysisDepth);
        
        const response = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [
            { text: analysisPrompt },
            { 
              fileData: {
                mimeType: geminiFile.mimeType,
                fileUri: geminiFile.uri
              }
            }
          ]
        });

        analysisResults = parseAnalysisResponse(response.text);

      } else {
        console.log('📄 Processing PDF with inline data...');
        
        const base64Data = buffer.toString('base64');
        const analysisPrompt = getAnalysisPrompt(options.analysisDepth);

        const response = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data
              }
            }
          ]
        });

        analysisResults = parseAnalysisResponse(response.text);
      }

      console.log('🧠 Document analysis completed:', {
        type: analysisResults.type,
        category: analysisResults.category,
        topics: analysisResults.topics?.length || 0,
        contentLength: analysisResults.extractedText?.length || 0
      });

      if (geminiFile) {
        try {
          await genAI.files.delete({ name: geminiFile.name });
          console.log('🗑️ Temporary file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temporary file:', cleanupError.message);
        }
      }

      const processedText = analysisResults.extractedText || '';
      
      if (!processedText || processedText.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No readable text content found in PDF',
          suggestion: 'The PDF might be image-only or corrupted.'
        }, { status: 400 });
      }

      const chunks = chunkText(processedText, options.maxChunkSize, options.overlapSize);
      console.log('✂️ Text chunked into', chunks.length, 'pieces');

      let results = {
        filename: file.name,
        fileSize: file.size,
        textLength: processedText.length,
        chunks: chunks.length,
        processingOptions: options,
        analysis: {
          type: analysisResults.type,
          category: analysisResults.category,
          topics: analysisResults.topics,
          summary: analysisResults.summary,
          entities: analysisResults.entities,
          keyPhrases: analysisResults.keyPhrases
        },
        chunks_data: []
      };

      if (options.storeInKnowledge && chunks.length > 0) {
        console.log('💾 Storing document in ChromaDB...');
        
        try {
          const documentId = `pdf_document_${Date.now()}`;
          const addResult = await chromaService.addKnowledgeEntry({
            id: documentId,
            title: `${analysisResults.title || file.name} (Multimodal Analysis)`,
            content: processedText,
            category: analysisResults.category || 'document',
            tags: analysisResults.topics || [],
            source: 'pdf_gemini_upload',
            metadata: {
              filename: file.name,
              fileSize: file.size,
              chunks: chunks.length,
              analysis: analysisResults,
              processing_method: 'gemini_multimodal',
              upload_date: new Date().toISOString()
            }
          });

          if (addResult.success) {
            console.log('✅ Document stored successfully in ChromaDB');
            results.storage = {
              success: true,
              stored_chunks: chunks.length,
              collection: 'knowledge_base',
              document_id: addResult.id || documentId
            };
          } else {
            throw new Error(addResult.error || 'Failed to store in ChromaDB');
          }

        } catch (error) {
          console.error('❌ Error storing document:', error);
          results.storage = {
            success: false,
            error: error.message,
            stored_chunks: 0
          };
        }
      } else {
        console.log('⏭️ Skipping storage (not requested)');
        results.storage = {
          success: true,
          message: 'Storage not requested',
          stored_chunks: 0
        };
      }

      console.log('✅ Gemini PDF processing completed successfully');
      
      return NextResponse.json({
        success: true,
        message: `Successfully processed PDF "${file.name}" using Gemini Multimodal AI`,
        data: results
      });

    } catch (geminiError) {
      console.error('❌ Gemini processing error:', geminiError);
      
      if (geminiFile) {
        try {
          await genAI.files.delete({ name: geminiFile.name });
        } catch (cleanupError) {
          console.warn('Could not clean up file after error:', cleanupError.message);
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Gemini document analysis failed',
        details: geminiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ PDF processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'PDF processing failed',
      details: error.message
    }, { status: 500 });
  }
}

function getAnalysisPrompt(depth) {
  const basePrompt = `Analyze this PDF document comprehensively using your multimodal capabilities. Extract and understand:

1. **Document Type & Category**: Identify what type of document this is (academic notice, syllabus, exam schedule, fee structure, etc.)

2. **Content Extraction**: Extract all readable text content, preserving structure and formatting context

3. **Key Information**: Identify important dates, deadlines, contact information, procedures, requirements

4. **Topics & Themes**: List the main topics covered in the document

5. **Entities**: Extract people names, places, departments, courses, amounts, dates

6. **Summary**: Provide a comprehensive summary of the document's contents

Please respond in this JSON format:
{
  "type": "document_type_here",
  "category": "primary_category",
  "title": "inferred_document_title",
  "summary": "comprehensive_summary",
  "topics": ["topic1", "topic2", "topic3"],
  "entities": ["entity1", "entity2"],
  "keyPhrases": ["phrase1", "phrase2"],
  "extractedText": "full_extracted_text_content",
  "keyInformation": {
    "dates": [],
    "deadlines": [],
    "contacts": [],
    "procedures": []
  }
}`;

  if (depth === 'detailed') {
    return basePrompt + `

**Additional Requirements for Detailed Analysis**:
- Analyze any charts, tables, or diagrams present
- Extract specific numerical data and statistics
- Identify relationships between different sections
- Note any visual elements or formatting that adds meaning
- Provide section-by-section breakdown if applicable`;
  }

  if (depth === 'summary') {
    return `Provide a quick analysis of this PDF document. Focus on:
- Document type and main purpose
- Key topics and important information
- Brief summary
- Extract the main text content

Respond in the same JSON format but with concise information.`;
  }

  return basePrompt;
}

function parseAnalysisResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type || 'document',
        category: parsed.category || 'general',
        title: parsed.title || 'Untitled Document',
        summary: parsed.summary || '',
        topics: parsed.topics || [],
        entities: parsed.entities || [],
        keyPhrases: parsed.keyPhrases || [],
        extractedText: parsed.extractedText || '',
        keyInformation: parsed.keyInformation || {}
      };
    }
  } catch (parseError) {
    console.warn('Could not parse JSON response, using fallback parsing');
  }

  return {
    type: 'document',
    category: 'general',
    title: 'Document Analysis',
    summary: responseText.substring(0, 500),
    topics: [],
    entities: [],
    keyPhrases: [],
    extractedText: responseText,
    keyInformation: {}
  };
}