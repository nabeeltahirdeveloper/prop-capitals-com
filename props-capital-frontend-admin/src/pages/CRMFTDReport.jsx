import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Search,
    Calendar,
    Filter,
    ChevronDown,
    ChevronUp,
    Download,
    Globe,
    Mail,
    Phone,
    User,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { apiGet } from '@/lib/api';
import { format } from 'date-fns';

export default function CRMFTDReport() {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({
        totalFtd: 0,
        totalDeposits: 0,
        avgFtdAmount: 0,
        activeAgents: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [agents, setAgents] = useState([]);
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedAgent, fromDate, toDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedAgent && selectedAgent !== 'all') params.append('agent', selectedAgent);
            if (fromDate) {
                const [y, m, d] = fromDate.split('-').map(Number);
                const start = new Date(y, m - 1, d, 0, 0, 0, 0);
                params.append('fromDate', start.toISOString());
            }
            if (toDate) {
                const [y, m, d] = toDate.split('-').map(Number);
                const end = new Date(y, m - 1, d, 23, 59, 59, 999);
                params.append('toDate', end.toISOString());
            }

            const [leadsData, statsData] = await Promise.all([
                apiGet(`/crm/leads/ftd-report?${params.toString()}`),
                apiGet(`/crm/leads/ftd-stats?${params.toString()}`)
            ]);

            setLeads(leadsData);
            setStats(statsData);

            // Extract unique agents from leads if we don't have a separate agents list
            const uniqueAgents = [...new Set(leadsData.map(l => l.assignedAgent).filter(Boolean))];
            setAgents(uniqueAgents);
        } catch (error) {
            console.error('Error fetching FTD data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (e) {
            return 'N/A';
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch (e) {
            return 'N/A';
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">FTD Report</h1>
                    <p className="text-slate-400 mt-1">First Time Deposit tracking from converted leads</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center justify-between hover:bg-slate-900/80 transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total FTD</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalFtd}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <Users className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center justify-between hover:bg-slate-900/80 transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total Deposits</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalDeposits)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center justify-between hover:bg-slate-900/80 transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Avg FTD Amount</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.avgFtdAmount)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center justify-between hover:bg-slate-900/80 transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Active Agents</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.activeAgents}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                        <User className="w-6 h-6" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10 bg-slate-900 border-slate-800 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-full lg:w-[200px] bg-slate-900 border-slate-800 text-white">
                        <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map(agent => (
                            <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                            onClick={() => fromDateRef.current?.showPicker()}
                        />
                        <Input
                            ref={fromDateRef}
                            type="date"
                            className="pl-10 bg-slate-900 border-slate-800 text-white text-xs h-9 w-40 no-calendar-icon"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="relative">
                        <Calendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                            onClick={() => toDateRef.current?.showPicker()}
                        />
                        <Input
                            ref={toDateRef}
                            type="date"
                            className="pl-10 bg-slate-900 border-slate-800 text-white text-xs h-9 w-40 no-calendar-icon"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">First Time Deposits</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-800">
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Lead Name</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Country</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Deposit Amount</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Converted Date</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading && leads.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        Loading FTD data...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        No first time deposits found.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <React.Fragment key={lead.id}>
                                        <tr
                                            className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                                            onClick={() => toggleRow(lead.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-white">{lead.personName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{lead.email}</td>
                                            <td className="px-6 py-4 text-slate-400">{lead.phoneNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-500" />
                                                    {lead.country || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-emerald-400 font-bold">{formatCurrency(lead.ftdAmount)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{formatDate(lead.convertedAt || lead.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">
                                                    Converted
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {expandedRows.has(lead.id) ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-500" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-500" />
                                                )}
                                            </td>
                                        </tr>
                                        {expandedRows.has(lead.id) && (
                                            <tr className="bg-slate-900/80 border-l-4 border-l-emerald-500/50">
                                                <td colSpan="8" className="px-12 py-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Agent</p>
                                                            <p className="text-white font-medium">{lead.assignedAgent || 'Unassigned'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Payment Method</p>
                                                            <p className="text-white font-medium">{lead.paymentMethod || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Payment Provider</p>
                                                            <p className="text-white font-medium">{lead.paymentProvider || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Source</p>
                                                            <p className="text-white font-medium">{lead.source || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Affiliate ID</p>
                                                            <p className="text-white font-medium">{lead.affiliateId || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Funnel Name</p>
                                                            <p className="text-white font-medium">{lead.funnelName || 'N/A'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">FTD Time</p>
                                                            <div className="flex items-center gap-2 text-white font-medium">
                                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                                {formatTime(lead.convertedAt || lead.updatedAt)}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold">Sub Parameters</p>
                                                            <p className="text-white font-medium">{lead.subParameters || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && leads.length > 0 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between text-slate-500 text-sm">
                        <p>Showing {leads.length} First Time Deposits</p>
                    </div>
                )}
            </Card>
        </div >
    );
}

const styles = `
  .no-calendar-icon::-webkit-calendar-picker-indicator {
    display: none !important;
    -webkit-appearance: none;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #334155;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
}
