import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Mail, Globe } from 'lucide-react';

export default function LeadsCardsView({ leads, onLeadClick, getStatusColor, maskPhone }) {
    const { t } = useTranslation();
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
                <Card
                    key={lead.id}
                    className="bg-card border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onLeadClick(lead)}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg">
                                {lead.name[0]}
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">{lead.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${lead.onlineStatus === 'online' ? 'bg-green-500' : 'bg-destructive'}`} />
                                    <span className="text-xs text-muted-foreground capitalize">{t(`crm.status.${lead.onlineStatus.toLowerCase()}`)}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                            {t(`crm.status.${lead.status.toLowerCase()}`)}
                        </span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span>{lead.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{maskPhone(lead.phone)}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10">
                            <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10">
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
