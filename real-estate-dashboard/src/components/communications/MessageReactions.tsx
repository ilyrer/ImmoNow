import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface ReactionButtonProps {
  messageId: string;
  reactionType: string;
  count: number;
  hasReacted: boolean;
  onReaction: (messageId: string, reactionType: string) => void;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  messageId,
  reactionType,
  count,
  hasReacted,
  onReaction
}) => {
  return (
    <button
      onClick={() => onReaction(messageId, reactionType)}
      className={`
        px-2 py-1 rounded-full text-xs transition-colors
        ${hasReacted 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      <span className="mr-1">{reactionType}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
};

interface ReactionPickerProps {
  messageId: string;
  onReaction: (messageId: string, reactionType: string) => void;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  messageId,
  onReaction,
  onClose
}) => {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
      <div className="flex gap-1">
        {reactions.map((reaction) => (
          <button
            key={reaction}
            onClick={() => {
              onReaction(messageId, reaction);
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-lg">{reaction}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface MessageReactionsProps {
  messageId: string;
  reactions: { [key: string]: number };
  userReactions: string[];
  onReaction: (messageId: string, reactionType: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  userReactions,
  onReaction
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const reactionTypes = Object.keys(reactions);

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactionTypes.map((reactionType) => (
        <ReactionButton
          key={reactionType}
          messageId={messageId}
          reactionType={reactionType}
          count={reactions[reactionType]}
          hasReacted={userReactions.includes(reactionType)}
          onReaction={onReaction}
        />
      ))}
      
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Smile className="w-3 h-3" />
        </button>
        
        {showPicker && (
          <ReactionPicker
            messageId={messageId}
            onReaction={onReaction}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
};
