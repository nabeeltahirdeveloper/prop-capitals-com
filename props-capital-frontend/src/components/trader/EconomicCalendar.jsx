import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

// Demo calendar events
const generateCalendarEvents = () => {
  const events = [];
  const eventTypes = [
    { name: 'Non-Farm Payrolls', impact: 'high', currency: 'USD' },
    { name: 'Interest Rate Decision', impact: 'high', currency: 'EUR' },
    { name: 'GDP Growth Rate', impact: 'medium', currency: 'GBP' },
    { name: 'CPI Monthly', impact: 'high', currency: 'USD' },
    { name: 'Unemployment Rate', impact: 'medium', currency: 'EUR' },
    { name: 'Retail Sales', impact: 'medium', currency: 'GBP' },
    { name: 'PMI Manufacturing', impact: 'low', currency: 'USD' },
    { name: 'Trade Balance', impact: 'low', currency: 'JPY' },
  ];

  for (let day = 1; day <= 28; day++) {
    if (Math.random() > 0.6) {
      const eventCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < eventCount; i++) {
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        events.push({
          day,
          ...event,
          time: `${Math.floor(Math.random() * 12 + 8)}:${Math.random() > 0.5 ? '00' : '30'}`,
          actual: Math.random() > 0.5 ? (Math.random() * 5 - 2).toFixed(1) + '%' : null,
          forecast: (Math.random() * 5 - 2).toFixed(1) + '%',
          previous: (Math.random() * 5 - 2).toFixed(1) + '%',
        });
      }
    }
  }
  return events;
};

const calendarEvents = generateCalendarEvents();

const EconomicCalendar = () => {
  const { isDark } = useTraderTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);

  const getEventsForDay = (day) => calendarEvents.filter(e => e.day === day);

  const impactColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Economic Calendar</h2>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <span className="w-2 h-2 bg-red-500 rounded-full"></span> High Impact
          </span>
          <span className={`flex items-center gap-2 text-sm ml-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Medium
          </span>
          <span className={`flex items-center gap-2 text-sm ml-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Low
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={nextMonth} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before the 1st */}
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {/* Days */}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-start transition-all ${isSelected
                    ? 'bg-amber-500/20 border border-amber-500/50'
                    : hasEvents
                      ? isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-amber-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-1 mt-1 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${impactColors[event.impact]}`}></span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {selectedDay ? `Events - Day ${selectedDay}` : 'Upcoming Events'}
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(selectedDay ? getEventsForDay(selectedDay) : calendarEvents.slice(0, 10)).map((event, i) => (
              <div key={i} className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${impactColors[event.impact]}`}></span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.name}</span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{event.time}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>{event.currency}</span>
                  <div className="flex gap-3">
                    <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Forecast: <span className={isDark ? 'text-white' : 'text-slate-900'}>{event.forecast}</span></span>
                    <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Previous: <span className={isDark ? 'text-white' : 'text-slate-900'}>{event.previous}</span></span>
                    {event.actual && <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Actual: <span className="text-emerald-500">{event.actual}</span></span>}
                  </div>
                </div>
              </div>
            ))}

            {selectedDay && getEventsForDay(selectedDay).length === 0 && (
              <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>No events on this day</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;
