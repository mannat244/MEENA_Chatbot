// Simple test for URL extraction with Readability fix
import { fetchURLContent } from './lib/urlUtils.js';

console.log('🔍 Testing fixed URL extraction...');

const testUrl = 'https://moodle.org/';

try {
  console.log(`📡 Fetching content from: ${testUrl}`);
  const result = await fetchURLContent(testUrl);
  
  console.log('\n📋 ===== EXTRACTION RESULT =====');
  console.log('✅ Success:', result.success);
  
  if (result.success) {
    console.log('📄 Title:', result.title);
    console.log('📝 Description:', result.description?.substring(0, 200));
    console.log('📊 Content Length:', result.content?.length || 0);
    console.log('🔧 Extraction Method:', result.extractionMethod);
    console.log('📖 Readability Check:', result.isReadable ? 'PASSED' : 'FAILED');
    console.log('\n🔍 Content Preview (first 500 chars):');
    console.log((result.content || '').substring(0, 500));
    
    if (result.content && result.content.length > 1000) {
      console.log('\n📄 ===== FULL EXTRACTED CONTENT =====');
      console.log(result.content);
      console.log('📄 ===== END FULL CONTENT =====');
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n✅ URL extraction test complete!');