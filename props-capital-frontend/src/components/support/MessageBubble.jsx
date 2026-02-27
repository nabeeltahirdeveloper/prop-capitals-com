import { format } from 'date-fns';
import { useTraderTheme } from '@/components/trader/TraderPanelLayout';

export default function MessageBubble({ message, senderType, createdAt }) {
  const { isDark } = useTraderTheme();
  const isAdmin = senderType === 'ADMIN';

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] ${isAdmin ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isAdmin
              ? isDark
                ? 'bg-[#12161d] text-gray-200 border border-white/10 rounded-bl-sm'
                : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-sm'
          }`}
        >
          {message}
        </div>
        <p
          className={`text-[10px] mt-1 ${
            isAdmin ? 'text-left' : 'text-right'
          } ${isDark ? 'text-gray-600' : 'text-slate-400'}`}
        >
          {createdAt ? format(new Date(createdAt), 'MMM d, HH:mm') : ''}
        </p>
      </div>
    </div>
  );
}
