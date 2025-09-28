import { MessageSquare } from 'lucide-react';
import type { Node } from '../lib/schema';
import { trackEvent } from '../lib/analytics';

interface FeedbackProps {
  node: Node;
  size?: 'sm' | 'md';
  showFeedback?: boolean;
}

const FEEDBACK_EMAIL = 'hello@ethicic.com';

function buildFeedbackMailto(node: Node): string {
  const subject = encodeURIComponent(`Dryvest feedback on ${node.id}`);
  const body = encodeURIComponent(
    `Node ID: ${node.id}\nType: ${node.type}\n\nFeedback:\n`
  );
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

export function GitHubFeedback({
  node,
  size = 'sm',
  showFeedback = true,
}: FeedbackProps) {
  if (!showFeedback) {
    return null;
  }

  const linkClass =
    size === 'sm'
      ? 'inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors'
      : 'inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors';

  const iconSize = size === 'sm' ? 12 : 16;
  const mailto = buildFeedbackMailto(node);

  return (
    <div className="flex items-center gap-3 mt-2">
      <a
        href={mailto}
        className={linkClass}
        title="Email feedback about this content"
        onClick={() =>
          trackEvent('feedback_link_clicked', {
            linkType: 'email_feedback',
            nodeId: node.id,
          })
        }
      >
        <MessageSquare size={iconSize} />
        Feedback via email
      </a>
    </div>
  );
}
