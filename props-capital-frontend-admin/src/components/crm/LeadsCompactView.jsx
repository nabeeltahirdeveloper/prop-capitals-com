import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Globe } from 'lucide-react';

export default function LeadsCompactView({ leads, onLeadClick, getStatusColor, getPriorityColor, maskPhone }) {
    return (
        <div className="space-y-2">
            {leads.map((lead) => (
                <Card
                    key={lead.id}
                    className="bg-slate-900 border-slate-800 p-3 cursor-pointer hover:border-emerald-500/50 transition-colors"
                    onClick={() => onLeadClick(lead)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {lead.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{lead.name}</p>
                                <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Globe className="w-3 h-3" />
                                <span>{lead.country}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                {lead.status}
                            </span>
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`} />
                                <span className="text-xs text-slate-400 capitalize">{lead.priority}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={(e) => { e.stopPropagation(); }}>
                                <Phone className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={(e) => { e.stopPropagation(); }}>
                                <MessageCircle className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
