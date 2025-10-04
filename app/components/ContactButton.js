'use client';

import { useState } from 'react';
import { Mail, Phone, Building, Smartphone, ExternalLink, Copy, Check } from 'lucide-react';

const ContactButton = ({ contact, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const getIcon = () => {
    if (contact.type === 'email') {
      return <Mail className="w-4 h-4" />;
    } else if (contact.type === 'phone') {
      if (contact.subtype === 'office') {
        return <Building className="w-4 h-4" />;
      } else if (contact.subtype === 'mobile') {
        return <Smartphone className="w-4 h-4" />;
      }
      return <Phone className="w-4 h-4" />;
    }
    return <ExternalLink className="w-4 h-4" />;
  };

  const getButtonColor = () => {
    if (contact.type === 'email') {
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    } else if (contact.type === 'phone') {
      return 'bg-green-500 hover:bg-green-600 text-white';
    }
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  };

  const handleClick = (e) => {
    e.preventDefault();
    
    if (contact.action.startsWith('mailto:') || contact.action.startsWith('tel:')) {
      // Open default app (email client or phone dialer)
      window.location.href = contact.action;
    } else {
      // Fallback to external link
      window.open(contact.action, '_blank');
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(contact.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = contact.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 my-1 ${className}`}>
      {/* Main contact button */}
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getButtonColor()}`}
        title={contact.label}
      >
        {getIcon()}
        <span className="truncate max-w-[200px]">{contact.displayText}</span>
        <ExternalLink className="w-3 h-3 opacity-75" />
      </button>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default ContactButton;