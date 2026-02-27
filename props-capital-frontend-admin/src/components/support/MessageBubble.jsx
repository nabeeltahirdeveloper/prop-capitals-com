import { format } from 'date-fns';

export default function MessageBubble({ message, senderType, createdAt }) {
  const isAdmin = senderType === 'ADMIN';

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isAdmin
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-sm'
              : 'bg-muted text-foreground border border-border rounded-bl-sm'
          }`}
        >
          {message}
        </div>
        <p
          className={`text-[10px] text-muted-foreground mt-1 ${
            isAdmin ? 'text-right' : 'text-left'
          }`}
        >
          {createdAt ? format(new Date(createdAt), 'MMM d, HH:mm') : ''}
        </p>
      </div>
    </div>
  );
}
