import React, { useState, useRef, useEffect } from 'react';
import { AtSign } from 'lucide-react';

interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

interface MentionPickerProps {
  users: MentionUser[];
  onSelectUser: (user: MentionUser) => void;
  onClose: () => void;
}

export const MentionPicker: React.FC<MentionPickerProps> = ({
  users,
  onSelectUser,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectUser(users[selectedIndex]);
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelectUser, onClose]);

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => {
            onSelectUser(user);
            onClose();
          }}
          className={`
            w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{user.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users: MentionUser[];
  onMention: (user: MentionUser) => void;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "Nachricht eingeben...",
  users,
  onMention
}) => {
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's no space after @ (meaning we're still typing the mention)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentionPicker(true);
        return;
      }
    }
    
    setShowMentionPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && e.key === 'Escape') {
      setShowMentionPicker(false);
      e.preventDefault();
    }
  };

  const handleSelectUser = (user: MentionUser) => {
    const beforeMention = value.substring(0, mentionPosition);
    const afterMention = value.substring(mentionPosition + mentionQuery.length + 1);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    
    onChange(newValue);
    onMention(user);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          w-full p-3 pr-10
          bg-gray-100 dark:bg-gray-700
          border border-gray-200 dark:border-gray-600
          rounded-lg resize-none
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
        "
        rows={1}
        style={{ maxHeight: '150px' }}
      />
      
      {showMentionPicker && filteredUsers.length > 0 && (
        <MentionPicker
          users={filteredUsers}
          onSelectUser={handleSelectUser}
          onClose={() => setShowMentionPicker(false)}
        />
      )}
    </div>
  );
};

// Utility function to parse mentions from text
export const parseMentions = (text: string): MentionUser[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: MentionUser[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      id: match[1], // In a real app, you'd look up the user ID
      name: match[1]
    });
  }

  return mentions;
};

// Utility function to render text with mentions
export const renderTextWithMentions = (text: string): React.ReactNode => {
  const parts = text.split(/(@\w+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={index}
          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};
