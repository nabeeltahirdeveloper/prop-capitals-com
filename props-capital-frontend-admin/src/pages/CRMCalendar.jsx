import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    List,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    Phone,
    Video,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2,
    User,
    ArrowRight,
    Filter,
    CalendarDays
} from 'lucide-react';
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function CRMCalendar() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMeetings: 0,
        today: 0,
        calls: 0,
        meetings: 0
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);
    const meetingDateRef = useRef(null);
    const meetingTimeRef = useRef(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        clientName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        duration: '30',
        type: 'Call',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, [searchQuery, typeFilter, statusFilter, fromDate, toDate, currentMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
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

            // For calendar view, we might want to fetch the whole month
            // but for now let's use the same API
            const [meetingsData, statsData] = await Promise.all([
                apiGet(`/crm/meetings?${params.toString()}`),
                apiGet('/crm/meetings/stats')
            ]);

            setMeetings(meetingsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!newMeeting.title || !newMeeting.clientName) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            // Create a date object using the local timezone to ensure correct UTC conversion
            const [year, month, day] = newMeeting.date.split('-').map(Number);
            const [hours, minutes] = newMeeting.time.split(':').map(Number);
            const localDate = new Date(year, month - 1, day, hours, minutes);
            const startTime = localDate.toISOString();

            await apiPost('/crm/meetings', {
                ...newMeeting,
                startTime
            });

            toast({
                title: "Success",
                description: "Meeting scheduled successfully"
            });

            setIsModalOpen(false);
            setNewMeeting({
                title: '',
                clientName: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: '10:00',
                duration: '30',
                type: 'Call',
                description: ''
            });
            fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to schedule meeting",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sales Calendar</h1>
                    <p className="text-slate-400 mt-1">Your scheduled meetings</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Meeting
                </Button>
            </div>
        );
    };

    const renderFilters = () => {
        return (
            <div className="space-y-4 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search meetings, clients, or agents..."
                            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-white">
                                <Filter className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="Call">Call</SelectItem>
                                <SelectItem value="Meeting">Meeting</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-white">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors">
                        <p className="text-2xl font-bold text-white leading-none">{stats.totalMeetings}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2 uppercase tracking-wider">Total Meetings</p>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors">
                        <p className="text-2xl font-bold text-white leading-none">{stats.today}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2 uppercase tracking-wider">Today</p>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors">
                        <p className="text-2xl font-bold text-emerald-400 leading-none">{stats.calls}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2 uppercase tracking-wider">Calls</p>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors">
                        <p className="text-2xl font-bold text-blue-400 leading-none">{stats.meetings}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2 uppercase tracking-wider">Meetings</p>
                    </Card>
                </div>
            </div>
        );
    };

    const renderViewToggle = () => {
        return (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit mb-6">
                <Button
                    variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`h-8 px-4 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                    onClick={() => setViewMode('calendar')}
                >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Calendar View
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`h-8 px-4 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                    onClick={() => setViewMode('list')}
                >
                    <List className="w-4 h-4 mr-2" />
                    List View
                </Button>
            </div>
        );
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, 'd');
                const cloneDay = day;
                const dailyMeetings = meetings.filter(m => isSameDay(parseISO(m.startTime), cloneDay));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day}
                        className={`relative min-h-[100px] p-2 border-slate-800/50 border transition-all cursor-pointer hover:bg-slate-800/20 group
                            ${!isCurrentMonth ? 'opacity-20' : ''}
                            ${isSelected ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' : ''}
                        `}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                            {formattedDate}
                        </span>

                        <div className="mt-2 space-y-1">
                            {dailyMeetings.slice(0, 3).map((m, idx) => (
                                <div
                                    key={m.id}
                                    className={`text-[10px] px-1.5 py-0.5 rounded truncate border
                                        ${m.type === 'Call' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}
                                    `}
                                >
                                    {format(parseISO(m.startTime), 'HH:mm')} {m.title}
                                </div>
                            ))}
                            {dailyMeetings.length > 3 && (
                                <div className="text-[10px] text-slate-500 font-bold ml-1">
                                    + {dailyMeetings.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day}>
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Calendar Card */}
                <Card className="flex-1 bg-slate-900/50 border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/40">
                        <h2 className="text-xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 bg-slate-900/20">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="divide-y divide-slate-800">
                        {rows}
                    </div>
                </Card>

                {/* Day Details Card */}
                <Card className="w-full lg:w-[350px] bg-slate-900/50 border-slate-800 flex flex-col shadow-xl">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/40">
                        <h3 className="text-lg font-bold text-white">{format(selectedDate, 'MMMM d, yyyy')}</h3>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Today's Schedule</p>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {meetings.filter(m => isSameDay(parseISO(m.startTime), selectedDate)).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="w-8 h-8 text-slate-600" />
                                </div>
                                <p className="text-slate-500 font-medium">No meetings scheduled</p>
                                <Button
                                    variant="link"
                                    className="text-blue-500 mt-2 text-sm"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Schedule one now
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {meetings
                                    .filter(m => isSameDay(parseISO(m.startTime), selectedDate))
                                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                                    .map(meeting => (
                                        <div key={meeting.id} className="group relative p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-10 rounded-full ${meeting.type === 'Call' ? 'bg-emerald-500/50' : 'bg-blue-500/50'}`} />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{meeting.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                                            <User className="w-3 h-3" />
                                                            {meeting.clientName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-white">{format(parseISO(meeting.startTime), 'HH:mm')}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium mt-1">{meeting.duration} min</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    const renderListView = () => {
        return (
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/40">
                    <h2 className="text-xl font-bold text-white">All Meetings</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Meeting</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {meetings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">No meetings found</td>
                                </tr>
                            ) : (
                                meetings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).map((meeting) => (
                                    <tr key={meeting.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 leading-none">{format(parseISO(meeting.startTime), 'MMM')}</span>
                                                    <span className="text-sm font-bold text-white leading-none mt-1">{format(parseISO(meeting.startTime), 'dd')}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{format(parseISO(meeting.startTime), 'EEEE')}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(meeting.startTime), 'HH:mm aaa')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{meeting.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-300">{meeting.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider
                                                ${meeting.type === 'Call' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}
                                            `}>
                                                {meeting.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                                            {meeting.duration} min
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider
                                                ${meeting.status === 'SCHEDULED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                    meeting.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                        'bg-red-500/10 border-red-500/30 text-red-400'}
                                            `}>
                                                {meeting.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        );
    };

    return (
        <div className="p-4 sm:p-8 animate-in fade-in duration-500 w-full min-h-screen bg-transparent">
            {renderHeader()}
            {renderFilters()}
            {renderViewToggle()}

            {loading && meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-400 font-medium">Loading your schedule...</p>
                </div>
            ) : (
                viewMode === 'calendar' ? renderCalendar() : renderListView()
            )}

            {/* Schedule Meeting Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px] overflow-hidden p-0">
                    <DialogHeader className="p-6 bg-slate-900/50 border-b border-slate-800">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            Schedule New Meeting
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Title</label>
                            <Input
                                placeholder="e.g., Follow-up Call"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                                value={newMeeting.title}
                                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client Name</label>
                            <Input
                                placeholder="Enter client name"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                                value={newMeeting.clientName}
                                onChange={(e) => setNewMeeting({ ...newMeeting, clientName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                                <div className="relative">
                                    <CalendarIcon
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                                        onClick={() => meetingDateRef.current?.showPicker()}
                                    />
                                    <Input
                                        ref={meetingDateRef}
                                        type="date"
                                        className="pl-10 bg-slate-900 border-slate-800 text-white h-11 no-calendar-icon"
                                        value={newMeeting.date}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time</label>
                                <div className="relative">
                                    <Clock
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white cursor-pointer z-10"
                                        onClick={() => meetingTimeRef.current?.showPicker()}
                                    />
                                    <Input
                                        ref={meetingTimeRef}
                                        type="time"
                                        className="pl-10 bg-slate-900 border-slate-800 text-white h-11 no-calendar-icon"
                                        value={newMeeting.time}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duration (minutes)</label>
                                <Input
                                    type="number"
                                    className="bg-slate-950 border-slate-800 text-white h-11"
                                    value={newMeeting.duration}
                                    onChange={(e) => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                                <Select
                                    value={newMeeting.type}
                                    onValueChange={(val) => setNewMeeting({ ...newMeeting, type: val })}
                                >
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="Call">Call</SelectItem>
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-900/50 border-t border-slate-800 gap-3">
                        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-lg shadow-lg shadow-blue-500/20"
                            onClick={handleScheduleMeeting}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Schedule Meeting
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style>{`
                .no-calendar-icon::-webkit-calendar-picker-indicator {
                  display: none !important;
                  -webkit-appearance: none;
                }
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
            `}</style>
        </div>
    );
}

