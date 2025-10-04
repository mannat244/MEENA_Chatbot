// Contact utilities for detecting and formatting emails and phone numbers
import React from 'react';

// Function to detect and extract contact information from text
export const detectContactInfo = (text) => {
  if (!text || typeof text !== 'string') return null;

  console.log('🔍 Scanning text for contact information:', text.substring(0, 100) + '...');

  const contacts = [];
  
  // Email patterns
  const emailPatterns = [
    // Standard email formats
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // Obfuscated email formats like deepaktomar[at]manit[dot]ac[dot]in
    /([a-zA-Z0-9._%+-]+)\[at\]([a-zA-Z0-9.-]+)\[dot\]([a-zA-Z0-9.-]+)\[dot\]([a-zA-Z]{2,})/g,
    // Other obfuscated formats
    /([a-zA-Z0-9._%+-]+)\(at\)([a-zA-Z0-9.-]+)\(dot\)([a-zA-Z0-9.-]+)\(dot\)([a-zA-Z]{2,})/g
  ];

  // Phone number patterns
  const phonePatterns = [
    // Indian phone numbers with country code
    /\+91[-\s]?(\d{10})/g,
    // Indian phone numbers without country code
    /(?:^|\s)([6-9]\d{9})(?:\s|$)/g,
    // Landline numbers with area codes
    /(?:^|\s)(\d{3,5}[-\s]?\d{6,8})(?:\s|$)/g,
    // International format
    /\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{6,8}/g
  ];

  // Extract emails
  emailPatterns.forEach((pattern, index) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let email;
      let originalText = match[0];
      
      if (index === 0) {
        // Standard email format
        email = match[1];
      } else {
        // Obfuscated format - reconstruct the email
        email = `${match[1]}@${match[2]}.${match[3]}.${match[4]}`;
      }
      
      contacts.push({
        type: 'email',
        value: email,
        originalText: originalText,
        displayText: email,
        action: `mailto:${email}`,
        icon: '📧',
        label: 'Send Email'
      });
    }
  });

  // Extract phone numbers
  phonePatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let phoneNumber = match[0].trim();
      let cleanNumber = phoneNumber.replace(/[-\s]/g, '');
      
      // Ensure Indian numbers have country code
      if (cleanNumber.match(/^[6-9]\d{9}$/)) {
        cleanNumber = '+91' + cleanNumber;
      } else if (cleanNumber.match(/^91[6-9]\d{9}$/)) {
        cleanNumber = '+' + cleanNumber;
      }
      
      contacts.push({
        type: 'phone',
        value: cleanNumber,
        originalText: phoneNumber,
        displayText: formatPhoneDisplay(cleanNumber),
        action: `tel:${cleanNumber}`,
        icon: '📞',
        label: 'Call Now'
      });
    }
  });

  console.log(`📋 Found ${contacts.length} contact items:`, contacts);
  return contacts.length > 0 ? contacts : null;
};

// Function to format phone numbers for display
const formatPhoneDisplay = (phoneNumber) => {
  // Remove non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+91')) {
    // Indian format: +91 98272 25851
    const number = cleaned.substring(3);
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  } else if (cleaned.startsWith('+')) {
    // International format
    return cleaned;
  } else if (cleaned.length === 10) {
    // Indian mobile without country code
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  
  return phoneNumber;
};

// Function to render text with contact information
export const renderTextWithContacts = (text, ContactButton) => {
  const contacts = detectContactInfo(text);
  
  if (!contacts || !ContactButton) {
    return { text, contacts: [] };
  }

  // Sort contacts by their position in the text (last occurrence first for replacement)
  const sortedContacts = contacts
    .map(contact => ({
      ...contact,
      index: text.lastIndexOf(contact.originalText)
    }))
    .filter(contact => contact.index !== -1)
    .sort((a, b) => b.index - a.index);

  // Keep the original text as-is for readability
  let processedText = text;
  const contactElements = [];

  sortedContacts.forEach((contact, index) => {
    // Create React component for rendering
    const contactComponent = React.createElement(ContactButton, {
      key: `contact_${index}`,
      contact: contact
    });
    
    contactElements.push(contactComponent);
  });

  return { text: processedText, contacts: contactElements };
};

// Function to clean and format contact information using LLM
export const formatContactWithLLM = async (rawContactText) => {
  // This could be enhanced to use the LLM for better contact formatting
  // For now, we'll use the pattern-based approach
  return detectContactInfo(rawContactText);
};

// Common contact patterns for MANIT
export const MANIT_CONTACT_PATTERNS = {
  EMAIL_DOMAINS: ['manit.ac.in', 'nit.ac.in'],
  OFFICE_PATTERNS: [
    /office:\s*(\+91[-\s]?\d{3,4}[-\s]?\d{6,8})/gi,
    /phone:\s*(\+91[-\s]?\d{3,4}[-\s]?\d{6,8})/gi,
    /tel:\s*(\+91[-\s]?\d{3,4}[-\s]?\d{6,8})/gi
  ],
  MOBILE_PATTERNS: [
    /mobile:\s*(\+91[-\s]?[6-9]\d{9})/gi,
    /cell:\s*(\+91[-\s]?[6-9]\d{9})/gi,
    /mob:\s*(\+91[-\s]?[6-9]\d{9})/gi
  ]
};

// Function to enhance contact detection for MANIT-specific patterns
export const detectManitContacts = (text) => {
  const contacts = detectContactInfo(text) || [];
  
  // Add MANIT-specific pattern detection
  const manitContacts = [];
  
  // Check for MANIT office numbers
  MANIT_CONTACT_PATTERNS.OFFICE_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      manitContacts.push({
        type: 'phone',
        subtype: 'office',
        value: match[1].replace(/[-\s]/g, ''),
        originalText: match[0],
        displayText: `Office: ${formatPhoneDisplay(match[1])}`,
        action: `tel:${match[1].replace(/[-\s]/g, '')}`,
        icon: '🏢',
        label: 'Call Office'
      });
    }
  });

  // Check for MANIT mobile numbers
  MANIT_CONTACT_PATTERNS.MOBILE_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      manitContacts.push({
        type: 'phone',
        subtype: 'mobile',
        value: match[1].replace(/[-\s]/g, ''),
        originalText: match[0],
        displayText: `Mobile: ${formatPhoneDisplay(match[1])}`,
        action: `tel:${match[1].replace(/[-\s]/g, '')}`,
        icon: '📱',
        label: 'Call Mobile'
      });
    }
  });

  return [...contacts, ...manitContacts];
};