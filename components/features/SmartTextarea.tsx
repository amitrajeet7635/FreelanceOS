import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export function SmartTextarea({ 
  value, 
  onChange, 
  placeholder,
  style
}: { 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [manualDate, setManualDate] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (textareaRef.current) {
      const backdrop = textareaRef.current.previousSibling as HTMLDivElement;
      if (backdrop) {
        backdrop.scrollTop = textareaRef.current.scrollTop;
      }
    }
  };

  // Check if a date keyword exists or if a specific /follow YYYY-MM-DD pattern was manually appended
  // Let's render the text highlighting dynamically
  const renderHighlights = (text: string) => {
    // We split the text into chunks of normal text and highlighted tokens
    // We want to highlight priority tags (p0, p1, p2, p3) and date keywords.
    // Also include the original /p1 format just in case
    const regex = /(\b(?:p[0-3])\b|\/(?:p[0-3]|bench|dm|follow\s+\d{4}-\d{2}-\d{2})\b|\b(?:tod(?:ay)?|tom(?:orrow)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b)/gi;
    
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const lower = part.toLowerCase();
      if (/^\b(?:p[0-3])\b$/i.test(part) || /^\/(?:p[0-3])\b$/i.test(part)) {
        const pType = part.replace('/', '').toLowerCase();
        let bg = '#3b82f6';
        if (pType === 'p0') bg = '#ef4444'; // Red
        else if (pType === 'p1') bg = '#eab308'; // Yellow
        else if (pType === 'p2') bg = '#3b82f6'; // Blue
        else if (pType === 'p3') bg = '#22c55e'; // Green
        return <mark key={i} style={{ backgroundColor: bg, color: '#ffffff', borderRadius: 4, padding: '2px 0', boxShadow: `1.5px 0 0 ${bg}, -1.5px 0 0 ${bg}` }}>{part}</mark>;
      }
      if (/^\/(?:bench|dm|follow\s+\d{4}-\d{2}-\d{2})\b$/i.test(part)) {
        return <mark key={i} style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderRadius: 4, padding: '2px 0', boxShadow: `1.5px 0 0 rgba(245, 158, 11, 0.2), -1.5px 0 0 rgba(245, 158, 11, 0.2)` }}>{part}</mark>;
      }
      if (/^\b(?:tod(?:ay)?|tom(?:orrow)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b$/i.test(part)) {
        return <mark key={i} style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: 4, cursor: 'pointer', padding: '2px 0', boxShadow: `1.5px 0 0 rgba(16, 185, 129, 0.2), -1.5px 0 0 rgba(16, 185, 129, 0.2)` }}>{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualDate(val);
    if (val) {
      // Append or replace follow date
      const replaced = value.replace(/\/follow\s+\d{4}-\d{2}-\d{2}/gi, '').trim();
      onChange(`${replaced} /follow ${val}`);
    }
  };

  const containsDateWord = /\b(?:tod(?:ay)?|tom(?:orrow)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i.test(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let text = e.target.value;
    
    // Priority cleanup
    const pRegex = /\b(?:p[0-3])\b|\/(?:p[0-3])\b/gi;
    const pMatches = Array.from(text.matchAll(pRegex));
    if (pMatches.length > 1) {
      const lastMatch = pMatches[pMatches.length - 1];
      text = text.replace(pRegex, (match, offset) => {
        return offset === lastMatch.index ? match : '';
      });
      text = text.replace(/  +/g, ' '); 
    }

    // Date cleanup
    const dRegex = /\b(?:tod(?:ay)?|tom(?:orrow)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b|\/follow\s+\d{4}-\d{2}-\d{2}\b/gi;
    const dMatches = Array.from(text.matchAll(dRegex));
    if (dMatches.length > 1) {
      const lastMatch = dMatches[dMatches.length - 1];
      text = text.replace(dRegex, (match, offset) => {
        return offset === lastMatch.index ? match : '';
      });
      text = text.replace(/  +/g, ' ');
    }

    onChange(text.trimStart());
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', minHeight: 80, ...style }}>
        {/* Backdrop for highlights */}
        <div 
          className="form-control"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            margin: 0,
            overflow: 'hidden', 
            whiteSpace: 'pre-wrap', 
            wordWrap: 'break-word',
            color: 'var(--text-primary)', // changed from transparent to handle rendering text
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* We must handle the trailing newline trick so the div matches the textarea height precisely */}
          {renderHighlights(value)}
          {value.endsWith('\n') ? <br /> : null}
        </div>
        {/* Actual invisible textarea (text is visible, background transparent) */}
        <textarea
          ref={textareaRef}
          className="form-control"
          style={{ 
            position: 'relative',
            background: 'transparent',
            color: 'transparent', // The real text is invisible, we only see the backdrop
            caretColor: 'var(--text-primary)',
            zIndex: 2,
            minHeight: '100%',
            height: '100%',
            resize: 'vertical'
          }}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder={placeholder}
        />
      </div>

      <div style={{ display: 'inline-flex', position: 'relative' }}>
        <button 
          className="btn btn-sm btn-ghost" 
          onClick={(e) => e.preventDefault()}
          style={{ padding: '4px 8px', fontSize: 11, pointerEvents: 'none' }}
        >
          <Calendar size={12} />
          {containsDateWord ? 'Date recognized' : 'Add manual date'}
        </button>
        <input 
          type="date"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
          value={manualDate}
          onChange={handleManualDateChange}
        />
      </div>
    </div>
  );
}
