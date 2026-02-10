import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Plus,
    Phone,
    Mail,
    Globe,
    Eye,
    EyeOff,
    Calendar,
    X,
    User,
    TrendingUp,
    Loader2,
    Filter,
    MoreVertical,
    Flag,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

// Status configurations with colors and icons
const STATUS_COLUMNS = [
    { id: 'NEW', title: 'New Leads', color: 'blue', icon: User },
    { id: 'CONTACTED', title: 'Contacted', color: 'purple', icon: Phone },
    { id: 'QUALIFIED', title: 'Qualified', color: 'cyan', icon: TrendingUp },
    { id: 'CALLBACK', title: 'Callback', color: 'yellow', icon: Calendar },
    { id: 'FOLLOW_UP', title: 'Follow Up', color: 'orange', icon: TrendingUp },
    { id: 'CONVERTED', title: 'Converted', color: 'emerald', icon: TrendingUp },
    { id: 'LOST', title: 'Lost', color: 'red', icon: X },
];

const STATUS_COLORS = {
    NEW: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    CONTACTED: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    QUALIFIED: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    CALLBACK: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    FOLLOW_UP: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
    CONVERTED: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    LOST: 'border-red-500/50 bg-red-500/10 text-red-400',
};

const ITEMS_PER_PAGE = 100;

const transformLead = (lead) => ({
    id: lead.id,
    name: lead.personName,
    email: lead.email,
    phone: lead.phoneNumber || '',
    country: lead.country || '',
    status: lead.leadStatus || 'NEW',
    priority: lead.priority || 'MEDIUM',
    source: lead.source || '',
    agent: lead.assignedAgent || '-',
    onlineStatus: lead.onlineStatus || 'OFFLINE',
    leadReceived: lead.leadReceivedDate,
    ftdAmount: lead.ftdAmount,
    paymentMethod: lead.paymentMethod,
    paymentProvider: lead.paymentProvider,
    age: lead.age,
    salary: lead.salary,
    jobIndustry: lead.jobIndustry,
    workTitle: lead.workTitle,
    callAttempts: lead.callAttempts || 0,
    activities: lead.activities || [],
    convertedAt: lead.convertedAt,
    affiliateId: lead.affiliateId || '',
    funnelName: lead.funnelName || '',
    subParameters: lead.subParameters || '',
});

export default function CRMPipeline() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [leadsByStatus, setLeadsByStatus] = useState(
        STATUS_COLUMNS.reduce((acc, col) => {
            acc[col.id] = { items: [], hasMore: true, skip: 0, loading: false };
            return acc;
        }, {})
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [showSensitive, setShowSensitive] = useState({ email: false, phone: false });
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    // Lead details editing state
    const [editableFields, setEditableFields] = useState({});
    const [updatingLead, setUpdatingLead] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchLeadsForColumn = useCallback(async (status, skip = 0, isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLeadsByStatus(prev => ({
                    ...prev,
                    [status]: { ...prev[status], loading: true }
                }));
            }

            const params = new URLSearchParams();
            params.append('status', status);
            params.append('skip', skip.toString());
            params.append('take', ITEMS_PER_PAGE.toString());
            if (searchQuery) params.append('search', searchQuery);
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);

            const data = await apiGet(`/crm/leads?${params.toString()}`);
            const transformed = data.map(transformLead);

            setLeadsByStatus(prev => ({
                ...prev,
                [status]: {
                    items: isRefreshing ? transformed : [...prev[status].items, ...transformed],
                    hasMore: data.length === ITEMS_PER_PAGE,
                    skip: skip + data.length,
                    loading: false
                }
            }));
        } catch (error) {
            console.error(`Error fetching leads for ${status}:`, error);
            setLeadsByStatus(prev => ({
                ...prev,
                [status]: { ...prev[status], loading: false }
            }));
        }
    }, [searchQuery, fromDate, toDate]);

    const refreshAllColumns = useCallback(async () => {
        setLoading(true);
        const promises = STATUS_COLUMNS.map(col => fetchLeadsForColumn(col.id, 0, true));
        await Promise.all(promises);
        setLoading(false);
    }, [fetchLeadsForColumn]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            refreshAllColumns();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, fromDate, toDate]);

    const handleScroll = (e, status) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const colState = leadsByStatus[status];
        if (colState.hasMore && !colState.loading && scrollHeight - scrollTop <= clientHeight + 200) {
            fetchLeadsForColumn(status, colState.skip);
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceStatus = source.droppableId;
        const destStatus = destination.droppableId;

        // Optimistic update
        const sourceList = [...leadsByStatus[sourceStatus].items];
        const destList = sourceStatus === destStatus ? sourceList : [...leadsByStatus[destStatus].items];

        const [movedLead] = sourceList.splice(source.index, 1);
        const updatedLead = { ...movedLead, status: destStatus };
        destList.splice(destination.index, 0, updatedLead);

        setLeadsByStatus(prev => ({
            ...prev,
            [sourceStatus]: { ...prev[sourceStatus], items: sourceList },
            [destStatus]: { ...prev[destStatus], items: destList },
        }));

        // API Call
        try {
            setUpdatingStatus(draggableId);
            await apiPatch(`/crm/leads/${draggableId}`, { leadStatus: destStatus });
            toast({
                title: 'Status Updated',
                description: `Lead moved to ${destStatus}`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update lead status. Reverting...',
                variant: 'destructive',
            });
            refreshAllColumns(); // Revert on failure
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleLeadClick = async (lead) => {
        try {
            const fullLead = await apiGet(`/crm/leads/${lead.id}`);
            const transformed = transformLead(fullLead);
            setSelectedLead(transformed);
            setEditableFields({
                personName: transformed.name || '',
                email: transformed.email || '',
                phoneNumber: transformed.phone || '',
                country: transformed.country || '',
                source: transformed.source || '',
                leadStatus: transformed.status,
                onlineStatus: transformed.onlineStatus,
                ftdAmount: transformed.ftdAmount?.toString() || '',
                paymentMethod: transformed.paymentMethod || '',
                paymentProvider: transformed.paymentProvider || '',
                priority: transformed.priority || 'MEDIUM',
                assignedAgent: transformed.agent !== '-' ? transformed.agent : '',
                age: transformed.age?.toString() || '',
                salary: transformed.salary || '',
                jobIndustry: transformed.jobIndustry || '',
                workTitle: transformed.workTitle || '',
                affiliateId: transformed.affiliateId || '',
                funnelName: transformed.funnelName || '',
                subParameters: transformed.subParameters || '',
                convertedAt: transformed.convertedAt ? new Date(transformed.convertedAt).toISOString().split('T')[0] : '',
            });
            setIsLeadModalOpen(true);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load lead details', variant: 'destructive' });
        }
    };

    const handleUpdateLead = async () => {
        if (!selectedLead) return;
        try {
            setUpdatingLead(true);
            const updateData = { ...editableFields };
            if (updateData.ftdAmount) updateData.ftdAmount = parseFloat(updateData.ftdAmount);
            if (updateData.age) updateData.age = parseInt(updateData.age);

            await apiPatch(`/crm/leads/${selectedLead.id}`, updateData);
            toast({ title: 'Success', description: 'Lead updated successfully' });
            setIsLeadModalOpen(false);
            refreshAllColumns();
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to update lead', variant: 'destructive' });
        } finally {
            setUpdatingLead(false);
        }
    };

    const handleAddNote = async () => {
        if (!selectedLead || !newNote.trim()) return;
        try {
            await apiPost(`/crm/leads/${selectedLead.id}/activities`, {
                activityType: 'NOTE',
                notes: newNote,
            });
            toast({ title: 'Success', description: 'Note added successfully' });
            setNewNote('');
            // Refresh lead details
            const fullLead = await apiGet(`/crm/leads/${selectedLead.id}`);
            setSelectedLead(transformLead(fullLead));
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
                    <p className="text-slate-400">Track and manage leads through stages</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
                        />
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-40">
                            <Calendar
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                                onClick={() => fromDateRef.current?.showPicker()}
                            />
                            <Input
                                ref={fromDateRef}
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="pl-10 bg-slate-900 border-slate-800 text-white text-xs h-9 no-calendar-icon"
                            />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                        <div className="relative w-full sm:w-40">
                            <Calendar
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                                onClick={() => toDateRef.current?.showPicker()}
                            />
                            <Input
                                ref={toDateRef}
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="pl-10 bg-slate-900 border-slate-800 text-white text-xs h-9 no-calendar-icon"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                        <p className="text-slate-400">Loading Pipeline...</p>
                    </div>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex gap-4 h-full min-w-max p-1">
                            {STATUS_COLUMNS.map((column) => {
                                const colState = leadsByStatus[column.id];
                                const currentLeads = colState.items;
                                return (
                                    <div key={column.id} className="w-[320px] flex flex-col gap-3 h-full">
                                        {/* Column Header */}
                                        <div className={`p-4 rounded-xl border-t-4 bg-slate-900/50 border border-slate-800 shrink-0 ${column.color === 'blue' ? 'border-t-blue-500' : column.color === 'purple' ? 'border-t-purple-500' : column.color === 'cyan' ? 'border-t-cyan-500' : column.color === 'yellow' ? 'border-t-yellow-500' : column.color === 'orange' ? 'border-t-orange-500' : column.color === 'emerald' ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${STATUS_COLORS[column.id]}`}>
                                                        <column.icon className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">{column.title}</h3>
                                                </div>
                                                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs font-bold">
                                                    {currentLeads.length}{colState.hasMore ? '+' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Droppable Area / Scrollable Container */}
                                        <div
                                            className="flex-1 overflow-y-auto custom-scrollbar pr-1 bg-slate-900/10 rounded-xl"
                                            onScroll={(e) => handleScroll(e, column.id)}
                                        >
                                            <Droppable droppableId={column.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={`flex flex-col gap-3 min-h-[100px] transition-colors rounded-xl p-1 ${snapshot.isDraggingOver ? 'bg-slate-900/30' : ''}`}
                                                    >
                                                        {currentLeads.map((lead, index) => (
                                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        onClick={() => handleLeadClick(lead)}
                                                                        className={`group relative p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer shadow-lg ${snapshot.isDragging ? 'rotate-3 scale-105 shadow-purple-500/20 z-50' : ''}`}
                                                                    >
                                                                        {updatingStatus === lead.id && (
                                                                            <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex items-center justify-center z-10">
                                                                                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                                                                            </div>
                                                                        )}

                                                                        <div className="flex items-start gap-3">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${column.color === 'blue' ? 'bg-blue-600' : column.color === 'purple' ? 'bg-purple-600' : column.color === 'cyan' ? 'bg-cyan-600' : column.color === 'yellow' ? 'bg-yellow-600' : column.color === 'orange' ? 'bg-orange-600' : column.color === 'emerald' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                                                                {lead.name[0]}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                                                                        {lead.name}
                                                                                    </h4>
                                                                                    <div className={`w-2 h-2 rounded-full ${lead.onlineStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                                                                                    <Globe className="w-3 h-3" />
                                                                                    <span className="truncate">{lead.country || 'Unknown'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-4 pt-3 border-t border-slate-800/50 space-y-2">
                                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                                <Mail className="w-3 h-3" />
                                                                                <span className="truncate">{lead.email}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    <span>{lead.leadReceived ? format(new Date(lead.leadReceived), 'MMM d, yy') : '-'}</span>
                                                                                </div>
                                                                                <div className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                                                                                    {lead.source || 'Direct'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                        {colState.loading && (
                                                            <div className="py-4 text-center">
                                                                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DragDropContext>
            )}

            {/* Lead Details Modal */}
            <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col text-white">
                    {selectedLead && (
                        <>
                            {/* Modal Header - Fixed at top */}
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${STATUS_COLORS[selectedLead.status] || 'bg-slate-600'}`}>
                                        {selectedLead.name[0]}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                                            {selectedLead.name}
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${leadOnlineStatusColor(selectedLead.onlineStatus)}`}>
                                                {selectedLead.onlineStatus}
                                            </span>
                                        </DialogTitle>
                                        <p className="text-slate-400 text-sm">{selectedLead.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => setIsLeadModalOpen(false)}>Close</Button>
                                </div>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Side: Info */}
                                    <div className="space-y-6">
                                        {/* Basic Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Full Name</label>
                                                    <Input value={editableFields.personName} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Email Address</label>
                                                    <div className="relative">
                                                        <Input type={showSensitive.email ? "text" : "password"} value={editableFields.email} readOnly className="bg-slate-950 border-slate-800 pr-10 text-slate-400" />
                                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onClick={() => setShowSensitive({ ...showSensitive, email: !showSensitive.email })}>
                                                            {showSensitive.email ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Phone Number</label>
                                                    <div className="relative">
                                                        <Input type={showSensitive.phone ? "text" : "password"} value={editableFields.phoneNumber} readOnly className="bg-slate-950 border-slate-800 pr-10 text-slate-400" />
                                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onClick={() => setShowSensitive({ ...showSensitive, phone: !showSensitive.phone })}>
                                                            {showSensitive.phone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Country</label>
                                                    <Input value={editableFields.country} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Assignment */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status & Assignment</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Status</label>
                                                    <Select value={editableFields.leadStatus} disabled>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-400">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800">
                                                            {STATUS_COLUMNS.map(col => <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Priority</label>
                                                    <Select value={editableFields.priority} disabled>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-400">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800">
                                                            <SelectItem value="LOW">Low</SelectItem>
                                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                                            <SelectItem value="HIGH">High</SelectItem>
                                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Additional Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Age</label>
                                                    <Input type="number" value={editableFields.age} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Salary Range</label>
                                                    <Input value={editableFields.salary} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Job Industry</label>
                                                    <Input value={editableFields.jobIndustry} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Work Title</label>
                                                    <Input value={editableFields.workTitle} readOnly className="bg-slate-950 border-slate-800 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* FTD Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">FTD Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Deposit Amount ($)</label>
                                                    <Input type="number" value={editableFields.ftdAmount} readOnly className="bg-slate-900 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Payment Method</label>
                                                    <Select value={editableFields.paymentMethod} disabled>
                                                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-400">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800">
                                                            <SelectItem value="CARD">Card</SelectItem>
                                                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                            <SelectItem value="CRYPTO">Crypto</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Payment Provider</label>
                                                    <Select value={editableFields.paymentProvider} disabled>
                                                        <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-left text-slate-400">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800">
                                                            <SelectItem value="STRIPE">Stripe</SelectItem>
                                                            <SelectItem value="PAYPAL">PayPal</SelectItem>
                                                            <SelectItem value="SKRILL">Skrill</SelectItem>
                                                            <SelectItem value="NETELLER">Neteller</SelectItem>
                                                            <SelectItem value="BINANCE_PAY">Binance Pay</SelectItem>
                                                            <SelectItem value="COINBASE">Coinbase</SelectItem>
                                                            <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
                                                            <SelectItem value="OTHER">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-slate-400">Converted Date</label>
                                                    <Input type="date" value={editableFields.convertedAt} readOnly className="bg-slate-900 border-slate-800 text-slate-400" />
                                                </div>
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-xs text-slate-400">Funnel Name</label>
                                                    <Input value={editableFields.funnelName} readOnly className="bg-slate-900 border-slate-800 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Timeline/Notes */}
                                    <div className="flex flex-col h-full space-y-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Activity Timeline</h3>
                                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[600px] space-y-4 custom-scrollbar">
                                            {selectedLead.activities?.length === 0 ? (
                                                <p className="text-center text-slate-500 text-sm py-8">No activities recorded yet</p>
                                            ) : (
                                                [...selectedLead.activities].reverse().map((activity, idx) => (
                                                    <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-800 last:pb-0">
                                                        <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full ${activityColor(activity.activityType)}`} />
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-bold text-slate-500">{format(new Date(activity.createdAt), 'MMM d, HH:mm')}</span>
                                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">{activity.activityType}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-300">{activity.notes || 'No description provided'}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.4);
        }
        .no-calendar-icon::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
        </div >
    );

    function leadOnlineStatusColor(status) {
        return status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }

    function activityColor(type) {
        switch (type) {
            case 'CALL': return 'bg-blue-500';
            case 'EMAIL': return 'bg-purple-500';
            case 'NOTE': return 'bg-slate-500';
            case 'STATUS_CHANGE': return 'bg-yellow-500';
            default: return 'bg-slate-500';
        }
    }

    async function logQuickActivity(type) {
        if (!selectedLead) return;
        try {
            await apiPost(`/crm/leads/${selectedLead.id}/activities`, {
                activityType: type,
                notes: `${type} attempt made via Pipeline Quick Actions`
            });
            toast({ title: 'Activity Logged', description: `${type} recorded` });
            const fullLead = await apiGet(`/crm/leads/${selectedLead.id}`);
            setSelectedLead(transformLead(fullLead));
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to log activity', variant: 'destructive' });
        }
    }
}
