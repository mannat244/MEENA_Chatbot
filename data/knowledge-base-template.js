// Enhanced Knowledge Base Template for MANIT
export const knowledgeEntryTemplate = {
  // Required Fields
  id: "unique_identifier", // e.g., "manit_cse_admission_2025"
  title: "Clear, descriptive title",
  content: "Detailed content with facts, procedures, dates, etc.",
  category: "one of: institutional|academics|admissions|departments|facilities|student_services|research|policies|contact",
  subcategory: "specific subcategory from structure",
  
  // Optional Fields
  tags: [], // Array of relevant keywords for search
  source: "official|website|handbook|circular|manual", // Information source
  last_updated: "2025-09-26", // ISO date string
  priority: "high|medium|low", // Information importance
  related_entries: [], // Array of related entry IDs
  effective_date: "2025-08-01", // When this info becomes valid
  expiry_date: "2026-07-31", // When this info expires (optional)
  
  // Metadata (auto-generated)
  created_at: "2025-09-26T10:00:00Z",
  updated_at: "2025-09-26T10:00:00Z",
  version: "1.0",
  author: "system|admin|reviewer_name",
  status: "active|draft|archived|needs_review"
};

// Content Quality Guidelines
export const contentGuidelines = {
  optimal_length: "500-2000 characters for best embedding performance",
  structure: {
    use_headers: "For long content, use clear section headers",
    bullet_points: "Use bullet points for lists and procedures",
    dates: "Always include specific dates where applicable",
    numbers: "Include specific numbers, fees, deadlines",
    contacts: "Include relevant contact information"
  },
  language: {
    tone: "Professional but accessible",
    clarity: "Avoid jargon, explain technical terms",
    completeness: "Include all necessary details for student queries"
  },
  updates: {
    versioning: "Maintain version history for important changes",
    notifications: "Flag entries that need regular updates",
    validation: "Include sources and last verification date"
  }
};

// Search Optimization
export const searchOptimization = {
  keywords: "Include common search terms students might use",
  synonyms: "Add alternative terms and abbreviations",
  context: "Provide context for acronyms and technical terms",
  cross_reference: "Link related information across entries"
};