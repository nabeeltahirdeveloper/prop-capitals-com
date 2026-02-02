import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsListView({ leads, onLeadClick, getStatusColor, getPriorityColor, maskPhone }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Lead</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Country</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Priority</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Source</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Agent</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr
                            key={lead.id}
                            className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => onLeadClick(lead)}
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {lead.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{lead.name}</p>
                                        <p className="text-xs text-slate-400">{format(new Date(lead.leadReceived), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div>
                                    <p className="text-sm text-white">{lead.email}</p>
                                    <p className="text-xs text-slate-400">{maskPhone(lead.phone)}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-300">{lead.country}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`} />
                                    <span className="text-sm text-slate-300 capitalize">{lead.priority}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm text-slate-300">{lead.source}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm text-slate-400">{lead.agent}</span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={(e) => { e.stopPropagation(); }}>
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={(e) => { e.stopPropagation(); }}>
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
