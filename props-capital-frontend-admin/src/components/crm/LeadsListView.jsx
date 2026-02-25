import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsListView({ leads, onLeadClick, getStatusColor, getPriorityColor, maskPhone }) {
    const { t } = useTranslation();

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.personName')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.contactInfo')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.country')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.leadStatus')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.priority')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.source')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.assignedAgent')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('crm.leads.quickActions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr
                            key={lead.id}
                            className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onLeadClick(lead)}
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                                        {lead.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(lead.leadReceived), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div>
                                    <p className="text-sm text-foreground">{lead.email}</p>
                                    <p className="text-xs text-muted-foreground">{maskPhone(lead.phone)}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{lead.country}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                    {t(`crm.status.${lead.status.toLowerCase()}`)}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`} />
                                    <span className="text-sm text-foreground capitalize">{t(`crm.priority.${lead.priority.toLowerCase()}`)}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm text-foreground">{lead.source}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm text-muted-foreground">{lead.agent}</span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={(e) => { e.stopPropagation(); }}>
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); }}>
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
