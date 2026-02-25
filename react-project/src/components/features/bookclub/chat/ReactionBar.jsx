import React from 'react';

/**
 * ReactionBar — displays grouped reactions under a message.
 * Each reaction chip shows the emoji, count, and highlights if the current user reacted.
 * Clicking a chip toggles the reaction on/off.
 *
 * Props:
 *  - reactions: Array<{ emoji, count, userIds }> — grouped reactions from backend
 *  - currentUserId: string — the logged-in user's ID
 *  - onToggleReaction: (emoji: string, hasReacted: boolean) => void
 */
const ReactionBar = ({ reactions, currentUserId, onToggleReaction }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(({ emoji, count, userIds }) => {
        const hasReacted = userIds.includes(currentUserId);

        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(emoji, hasReacted);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
              hasReacted
                ? 'bg-purple-600/30 border-purple-500 text-purple-200 hover:bg-purple-600/40'
                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title={`${emoji} ${count}`}
          >
            <span className="text-sm">{emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
