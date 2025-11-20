import React, { useState } from 'react';

const TruncatedText = ({ 
  text, 
  maxLength = 100, 
  maxLines = 2, 
  className = '', 
  showMoreText = 'Show more', 
  showLessText = 'Show less',
  truncateBy = 'length' // 'length' or 'lines'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = truncateBy === 'length' 
    ? text.length > maxLength 
    : text.split('\n').length > maxLines;

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  const truncatedText = truncateBy === 'length' 
    ? text.substring(0, maxLength) + '...'
    : text;

  return (
    <div className={className}>
      {isExpanded ? (
        <div>
          <div className="session-description-expanded">{text}</div>
          <button 
            className="show-more-btn" 
            onClick={() => setIsExpanded(false)}
          >
            {showLessText}
          </button>
        </div>
      ) : (
        <div>
          <div className={truncateBy === 'lines' ? 'session-description-truncated' : ''}>
            {truncatedText}
          </div>
          <button 
            className="show-more-btn" 
            onClick={() => setIsExpanded(true)}
          >
            {showMoreText}
          </button>
        </div>
      )}
    </div>
  );
};

export default TruncatedText;
