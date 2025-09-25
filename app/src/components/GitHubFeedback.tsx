import { ExternalLink, MessageSquare, Edit } from 'lucide-react';
import type { Node } from '../lib/schema';
import { getGitHubEditLink, getGitHubFeedbackLink } from '../lib/github';

interface GitHubFeedbackProps {
  node: Node;
  size?: 'sm' | 'md';
  showEdit?: boolean;
  showFeedback?: boolean;
}

export function GitHubFeedback({
  node,
  size = 'sm',
  showEdit = true,
  showFeedback = true
}: GitHubFeedbackProps) {
  const editLink = showEdit ? getGitHubEditLink(node) : null;
  const feedbackLink = showFeedback ? getGitHubFeedbackLink(node) : null;

  if (!editLink && !feedbackLink) {
    return null;
  }

  const linkClass = size === 'sm'
    ? 'inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors'
    : 'inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors';

  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <div className="flex items-center gap-3 mt-2">
      {editLink && (
        <a
          href={editLink}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title="Edit this content on GitHub"
        >
          <Edit size={iconSize} />
          Edit
          <ExternalLink size={iconSize - 2} />
        </a>
      )}
      {feedbackLink && (
        <a
          href={feedbackLink}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title="Provide feedback about this content"
        >
          <MessageSquare size={iconSize} />
          Feedback
          <ExternalLink size={iconSize - 2} />
        </a>
      )}
    </div>
  );
}