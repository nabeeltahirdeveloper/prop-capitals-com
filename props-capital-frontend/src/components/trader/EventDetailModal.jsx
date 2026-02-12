import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Globe, Calendar, TrendingUp, Info, ExternalLink, History, BarChart3 } from 'lucide-react';

const EventDetailModal = ({
  isOpen,
  onClose,
  event,
  eventDetail,
  loading,
  error,
  isDark,
}) => {
  const impactColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };

  const impactToKey = (importance) => {
    if (importance === 'high') return 'high';
    if (importance === 'medium') return 'medium';
    if (importance === 'low') return 'low';
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-2xl max-h-[85vh] overflow-y-auto ${
          isDark
            ? 'bg-[#12161d] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {event?.name || 'Event Details'}
          </DialogTitle>
          {event && (
            <DialogDescription asChild>
              <div className="flex items-center gap-3 mt-2">
                {event.importance && impactToKey(event.importance) && (
                  <span
                    className={`w-2 h-2 rounded-full ${impactColors[impactToKey(event.importance)]}`}
                  />
                )}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {event.currency}
                </span>
                {event.countryName && (
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {event.countryName}
                  </span>
                )}
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2
                className={`w-8 h-8 animate-spin ${isDark ? 'text-amber-500' : 'text-amber-600'}`}
              />
              <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Loading event details...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div
              className={`rounded-xl p-4 ${
                isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </p>
            </div>
          )}

          {/* Event details */}
          {!loading && !error && eventDetail && (
            <div className="space-y-6">
              {/* Current values from event */}
              {event && (
                <div
                  className={`rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Latest Values
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Forecast
                      </p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.forecast || '-'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Previous
                      </p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.previous || '-'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Actual
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          event.actual ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {event.actual || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {eventDetail.description && (
                <div
                  className={`rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    Description
                  </h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    {eventDetail.description}
                  </p>
                </div>
              )}

              {/* Additional info grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Country & Currency */}
                {(eventDetail.country || eventDetail.currency) && (
                  <div
                    className={`rounded-xl p-4 ${
                      isDark ? 'bg-white/5' : 'bg-slate-50'
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Region
                    </h4>
                    {eventDetail.country && (
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                        {eventDetail.country}
                      </p>
                    )}
                    {eventDetail.currency && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Currency: {eventDetail.currency}
                      </p>
                    )}
                  </div>
                )}

                {/* Schedule */}
                {(eventDetail.nextRelease || eventDetail.frequency) && (
                  <div
                    className={`rounded-xl p-4 ${
                      isDark ? 'bg-white/5' : 'bg-slate-50'
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </h4>
                    {eventDetail.frequency && (
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                        {eventDetail.frequency}
                      </p>
                    )}
                    {eventDetail.nextRelease && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Next: {eventDetail.nextRelease}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Source */}
              {eventDetail.source && (
                <div
                  className={`rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Source
                  </h4>
                  {eventDetail.sourceUrl ? (
                    <a
                      href={eventDetail.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm flex items-center gap-1 ${
                        isDark
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-amber-600 hover:text-amber-700'
                      }`}
                    >
                      {eventDetail.source}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                      {eventDetail.source}
                    </p>
                  )}
                </div>
              )}

              {/* Unit */}
              {eventDetail.unit && (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  Unit: {eventDetail.unit}
                </p>
              )}

              {/* History Table */}
              {eventDetail.history && eventDetail.history.length > 0 && (
                <div
                  className={`rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    Historical Data
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                          <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Date
                          </th>
                          <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Actual
                          </th>
                          <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Forecast
                          </th>
                          <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Previous
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventDetail.history.slice(0, 10).map((entry, idx) => (
                          <tr
                            key={idx}
                            className={`border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}
                          >
                            <td className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                              {entry.date}
                            </td>
                            <td className={`py-2 px-2 text-right ${entry.actual ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                              {entry.actual || '-'}
                            </td>
                            <td className={`py-2 px-2 text-right ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                              {entry.forecast || '-'}
                            </td>
                            <td className={`py-2 px-2 text-right ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                              {entry.previous || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {eventDetail.history.length > 10 && (
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        Showing 10 of {eventDetail.history.length} entries
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Chart Series Info */}
              {eventDetail.chartSeries && eventDetail.chartSeries.length > 0 && (
                <div
                  className={`rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Chart Data Available
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {eventDetail.chartSeries.length} data points available
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fallback when no details available */}
          {!loading && !error && !eventDetail && event && (
            <div
              className={`rounded-xl p-4 ${
                isDark ? 'bg-white/5' : 'bg-slate-50'
              }`}
            >
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                No additional details available for this event.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
