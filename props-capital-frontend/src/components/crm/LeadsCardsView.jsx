import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Mail, Globe } from 'lucide-react';

export default function LeadsCardsView({ leads, onLeadClick, getStatusColor, maskPhone }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
                <Card
                    key={lead.id}
                    className="bg-slate-900 border-slate-800 p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
                    onClick={() => onLeadClick(lead)}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {lead.name[0]}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{lead.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${lead.onlineStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs text-slate-400 capitalize">{lead.onlineStatus}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                        </span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Globe className="w-4 h-4" />
                            <span>{lead.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-4 h-4" />
                            <span>{maskPhone(lead.phone)}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-800">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                            <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
