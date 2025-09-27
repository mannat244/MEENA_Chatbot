// import { NextResponse } from 'next/server';
// import pdf from 'pdf-parse';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// // Dummy ChromaDB service to prevent build-time issues
// const getDummyChromaService = () => ({
//   initialize: async () => { 
//     console.log('✅ Using dummy ChromaDB service'); 
//     return true; 
//   },
//   addDocuments: async () => ({ 
//     success: true, 
//     message: 'Dummy storage - documents not actually stored' 
//   })
// });

// // Get ChromaDB service with runtime loading
// const getChromaService = async () => {
//   // During build or if ChromaDB fails, use dummy service
//   if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
//     return getDummyChromaService();
//   }
  
//   try {
//     // Only load ChromaDB during actual runtime
//     const { ChromaDBService } = await import('@/lib/chromadb');
//     const service = new ChromaDBService();
//     return service;
//   } catch (error) {
//     console.warn('ChromaDB loading failed, using dummy service:', error.message);
//     return getDummyChromaService();
//   }
// };

// // Intelligent text chunking function (same as scraping)
// function chunkText(text, maxChunkSize = 1000, overlapSize = 200) {
//   if (!text || typeof text !== 'string') {
//     return [];
//   }

//   const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
//   const chunks = [];
//   let currentChunk = '';
//   let currentSize = 0;

//   for (const sentence of sentences) {
//     const sentenceLength = sentence.length;
    
//     // If adding this sentence would exceed max size, save current chunk
//     if (currentSize + sentenceLength > maxChunkSize && currentChunk.length > 0) {
//       chunks.push(currentChunk.trim());
      
//       // Start new chunk with overlap from previous chunk
//       const words = currentChunk.split(' ');
//       const overlapWords = words.slice(-Math.floor(overlapSize / 5)); // Approximate word overlap
//       currentChunk = overlapWords.join(' ') + ' ' + sentence;
//       currentSize = currentChunk.length;
//     } else {
//       currentChunk += sentence;
//       currentSize += sentenceLength;
//     }
//   }

//   // Add the last chunk if it exists
//   if (currentChunk.trim().length > 0) {
//     chunks.push(currentChunk.trim());
//   }

//   // Filter out very small chunks
//   return chunks.filter(chunk => chunk.length > 50);
// }

// // Generate metadata for PDF chunks
// function generateMetadata(filename, chunkIndex, totalChunks, pageInfo = null) {
//   const now = new Date();
  
//   // Extract meaningful information from filename
//   const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove extension
//   const fileType = filename.split('.').pop()?.toLowerCase() || 'pdf';
  
//   // Create hierarchical categories
//   const categories = ['document', 'pdf'];
  
//   // Add category based on filename patterns
//   if (baseName.toLowerCase().includes('syllabus')) categories.push('academic', 'syllabus');
//   else if (baseName.toLowerCase().includes('notice')) categories.push('announcement', 'notice');
//   else if (baseName.toLowerCase().includes('exam')) categories.push('academic', 'examination');
//   else if (baseName.toLowerCase().includes('fee')) categories.push('administrative', 'fees');
//   else if (baseName.toLowerCase().includes('admission')) categories.push('academic', 'admission');
//   else if (baseName.toLowerCase().includes('result')) categories.push('academic', 'results');
//   else if (baseName.toLowerCase().includes('timetable') || baseName.toLowerCase().includes('schedule')) categories.push('academic', 'schedule');
//   else categories.push('general');

//   return {
//     // Source identification
//     source: 'pdf_upload',
//     filename: filename,
//     document_name: baseName,
//     file_type: fileType,
    
//     // Chunk positioning
//     chunk_index: chunkIndex,
//     total_chunks: totalChunks,
//     chunk_position: `${chunkIndex + 1}/${totalChunks}`,
    
//     // Page information if available
//     ...(pageInfo && {
//       page_number: pageInfo.page,
//       page_total: pageInfo.totalPages
//     }),
    
//     // Categorization
//     categories: categories,
//     primary_category: categories[categories.length - 1],
//     document_type: 'pdf',
    
//     // Temporal data
//     upload_date: now.toISOString(),
//     upload_timestamp: now.getTime(),
//     date_readable: now.toLocaleDateString('en-IN'),
    
//     // Processing metadata
//     processing_method: 'pdf_parse',
//     chunk_method: 'sentence_aware_chunking',
//     overlap_used: true,
    
//     // Search optimization
//     searchable_title: `${baseName} - Chunk ${chunkIndex + 1}`,
//     document_section: `Part ${chunkIndex + 1} of ${totalChunks}`,
    
//     // Quality indicators
//     is_structured: true,
//     content_quality: 'high',
    
//     // Administrative
//     manit_related: true,
//     requires_updates: false
//   };
// }

// export async function POST(request) {
//   console.log('\n📄 ===== PDF PROCESSING API CALLED =====');
  
//   try {
//     // Initialize ChromaDB service (or dummy if unavailable)
//     const chromaService = await getChromaService();
//     await chromaService.initialize();
//     console.log('✅ ChromaDB service ready');

//     const formData = await request.formData();
//     const file = formData.get('file');
//     const options = {
//       maxChunkSize: parseInt(formData.get('maxChunkSize')) || 1000,
//       overlapSize: parseInt(formData.get('overlapSize')) || 200,
//       storeInKnowledge: formData.get('storeInKnowledge') === 'true'
//     };

//     console.log('📋 Processing options:', options);
//     console.log('📁 File info:', {
//       name: file?.name,
//       size: file?.size,
//       type: file?.type
//     });

//     if (!file) {
//       return NextResponse.json({
//         success: false,
//         error: 'No file provided'
//       }, { status: 400 });
//     }

//     if (file.type !== 'application/pdf') {
//       return NextResponse.json({
//         success: false,
//         error: 'Only PDF files are supported'
//       }, { status: 400 });
//     }

//     // Convert file to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     console.log('📄 Starting PDF parsing...');
    
//     // Parse PDF
//     let pdfData;
//     try {
//       pdfData = await pdf(buffer);
//       console.log('✅ PDF parsed successfully');
//       console.log('📊 PDF info:', {
//         pages: pdfData.numpages,
//         textLength: pdfData.text?.length || 0,
//         hasText: !!pdfData.text
//       });
//     } catch (parseError) {
//       console.error('❌ PDF parsing failed:', parseError);
//       return NextResponse.json({
//         success: false,
//         error: 'Failed to parse PDF',
//         details: parseError.message
//       }, { status: 400 });
//     }

//     if (!pdfData.text || pdfData.text.trim().length === 0) {
//       return NextResponse.json({
//         success: false,
//         error: 'No text content found in PDF. The PDF might be image-based or corrupted.',
//         suggestion: 'Try using OCR software to convert the PDF to searchable text first.'
//       }, { status: 400 });
//     }

//     // Clean and prepare text
//     const cleanedText = pdfData.text
//       .replace(/\s+/g, ' ')
//       .replace(/\n\s*\n/g, '\n')
//       .trim();

//     console.log('🧹 Text cleaned, length:', cleanedText.length);

//     // Chunk the text using intelligent chunking
//     const chunks = chunkText(cleanedText, options.maxChunkSize, options.overlapSize);
//     console.log('✂️ Text chunked into', chunks.length, 'pieces');

//     let results = {
//       filename: file.name,
//       fileSize: file.size,
//       pages: pdfData.numpages,
//       textLength: cleanedText.length,
//       chunks: chunks.length,
//       processingOptions: options,
//       chunks_data: []
//     };

//     // Process and store chunks if requested
//     if (options.storeInKnowledge && chunks.length > 0) {
//       console.log('💾 Storing chunks in ChromaDB...');
      
//       const embeddings = [];
//       const metadataList = [];
//       const ids = [];

//       // Generate embeddings for all chunks
//       try {
//         const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        
//         for (let i = 0; i < chunks.length; i++) {
//           const chunk = chunks[i];
          
//           // Generate embedding
//           const result = await model.embedContent(chunk);
//           const embedding = result.embedding;
          
//           if (!embedding?.values) {
//             throw new Error(`Failed to generate embedding for chunk ${i + 1}`);
//           }

//           // Generate metadata
//           const metadata = generateMetadata(file.name, i, chunks.length, {
//             page: Math.floor(i / (chunks.length / pdfData.numpages)) + 1,
//             totalPages: pdfData.numpages
//           });

//           // Create unique ID
//           const chunkId = `pdf_${Date.now()}_${i}`;

//           embeddings.push(embedding.values);
//           metadataList.push(metadata);
//           ids.push(chunkId);

//           results.chunks_data.push({
//             id: chunkId,
//             text: chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''),
//             length: chunk.length,
//             metadata: metadata
//           });
//         }

//         // Store in ChromaDB
//         const chromaService = await getChromaService();
//         const addResult = await chromaService.addDocuments(
//           'knowledge_base',
//           {
//             ids: ids,
//             embeddings: embeddings,
//             metadatas: metadataList,
//             documents: chunks
//           }
//         );

//         if (addResult.success) {
//           console.log('✅ All chunks stored successfully in ChromaDB');
//           results.storage = {
//             success: true,
//             stored_chunks: chunks.length,
//             collection: 'knowledge_base'
//           };
//         } else {
//           throw new Error(addResult.error || 'Failed to store in ChromaDB');
//         }

//       } catch (error) {
//         console.error('❌ Error storing chunks:', error);
//         results.storage = {
//           success: false,
//           error: error.message,
//           stored_chunks: 0
//         };
//       }
//     } else {
//       console.log('⏭️ Skipping storage (not requested or no chunks)');
//       results.storage = {
//         success: true,
//         message: 'Storage not requested',
//         stored_chunks: 0
//       };
//     }

//     console.log('✅ PDF processing completed successfully');
    
//     return NextResponse.json({
//       success: true,
//       message: `Successfully processed PDF "${file.name}"`,
//       data: results
//     });

//   } catch (error) {
//     console.error('❌ PDF processing error:', error);
//     return NextResponse.json({
//       success: false,
//       error: 'PDF processing failed',
//       details: error.message
//     }, { status: 500 });
//   }
// }