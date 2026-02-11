import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';


async function fetchCalendarMonth(monthYYYYMM) {
  const res = await fetch(`/api/economic-calendar?month=${encodeURIComponent(monthYYYYMM)}`);
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
  return res.json(); // { month, events: [...] }
}

function monthKeyUTC(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function utcDayKeyFromParts(y, m1to12, d1to31) {
  const mm = String(m1to12).padStart(2, '0');
  const dd = String(d1to31).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function utcDayKeyFromMs(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatUTCTime(ms) {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function impactToKey(importance) {
  if (importance === 'high') return 'high';
  if (importance === 'medium') return 'medium';
  if (importance === 'low') return 'low';
  return null; // "none"
}



const EconomicCalendar = () => {
  const { isDark } = useTraderTheme();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);


  const month = monthKeyUTC(currentMonth);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchCalendarMonth(month)
      .then((data) => {
        if (!alive) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
        setSelectedDay(null); // reset selection when month changes
      })
      .catch(() => {
        if (!alive) return;
        setEvents([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, [month]);


  // ✅ Step 5: group events by UTC day
  const eventsByDay = useMemo(() => {
    const map = new Map();

    for (const e of events) {
      const key = utcDayKeyFromMs(e.releaseAt); // "YYYY-MM-DD"
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }

    // sort events within each day by time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.releaseAt - b.releaseAt);
      map.set(k, arr);
    }

    return map;
  }, [events]);



  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // ✅ Step 6A: UTC-safe month calculations
  const getDaysInMonth = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

  const getFirstDayOfMonth = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).getUTCDay(); // 0=Sun


  const prevMonth = () =>
    setCurrentMonth(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1)));

  const nextMonth = () =>
    setCurrentMonth(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1)));


  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = (firstDay + 6) % 7; // Sun->6, Mon->0, Tue->1...
  const emptyDays = Array.from({ length: blanks }, (_, i) => i);
  // ✅ Step 5.1: read events from the grouped map
  const getEventsForDay = (day) => {
    const y = currentMonth.getUTCFullYear();
    const m = currentMonth.getUTCMonth() + 1; // 1-12
    const key = utcDayKeyFromParts(y, m, day); // "YYYY-MM-DD"
    return eventsByDay.get(key) ?? [];
  };


  const impactColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };

  const sidebarEvents = selectedDay ? getEventsForDay(selectedDay) : [];


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
              {monthNames[currentMonth.getUTCMonth()]} {currentMonth.getUTCFullYear()}
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
                      {(() => {
                        const counts = { high: 0, medium: 0, low: 0 };

                        for (const e of dayEvents) {
                          const k = impactToKey(e.importance); // importance -> high/medium/low
                          if (k) counts[k]++;
                        }

                        // show max 3 dots, prioritize high > medium > low
                        const dots = [];
                        for (let i = 0; i < Math.min(3, counts.high); i++) dots.push('high');
                        for (let i = 0; i < Math.min(3 - dots.length, counts.medium); i++) dots.push('medium');
                        for (let i = 0; i < Math.min(3 - dots.length, counts.low); i++) dots.push('low');

                        return dots.map((k, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${impactColors[k]}`} />
                        ));
                      })()}

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
            {selectedDay ? `Events - Day ${selectedDay}` : 'Select a day'}
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loading && (
              <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Loading...
              </p>
            )}

            {!loading && selectedDay && sidebarEvents.length === 0 && (
              <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                No events on this day
              </p>
            )}

            {!loading && sidebarEvents.map((event) => {
              const impact = impactToKey(event.importance);

              return (
                <div key={event.id} className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {impact && <span className={`w-2 h-2 rounded-full ${impactColors[impact]}`}></span>}
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.name}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                      {formatUTCTime(event.releaseAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {event.currency}
                    </span>
                    <div className="flex gap-3 flex-wrap">
                      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>
                        Forecast: <span className={isDark ? 'text-white' : 'text-slate-900'}>{event.forecast || '-'}</span>
                      </span>
                      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>
                        Previous: <span className={isDark ? 'text-white' : 'text-slate-900'}>{event.previous || '-'}</span>
                      </span>
                      {!!event.actual && (
                        <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>
                          Actual: <span className="text-emerald-500">{event.actual}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;
