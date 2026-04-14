import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIORITY_CONFIG, CalendarEvent } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export function CalendarGrid({ 
  events, 
  onAddEvent 
}: { 
  events: CalendarEvent[], 
  onAddEvent: (date: Date) => void 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd; // in real we'd pad for days of week
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></button>
          <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border-subtle)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg)' }}>
            {d}
          </div>
        ))}

        {/* we need padding for first day of month. let's just do a simple mapping */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: 'var(--bg-overlay)' }} />
        ))}

        {days.map(day => {
          const dayEvents = events.filter(e => e.event_date === format(day, 'yyyy-MM-dd'));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);

          return (
            <div 
              key={day.toString()} 
              style={{ minHeight: 100, padding: 8, background: 'var(--bg)', position: 'relative', border: isDayToday ? '1px solid #378ADD' : 'none' }}
              className="calendar-cell"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: isDayToday ? '#fff' : (isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'), background: isDayToday ? '#378ADD' : 'transparent', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {format(day, 'd')}
                </span>
                <button 
                  className="btn-icon hover-add"
                  style={{ width: 20, height: 20, opacity: 0 }}
                  onClick={() => onAddEvent(day)}
                >
                  <Plus size={12} />
                </button>
              </div>

              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} style={{ fontSize: 10, padding: '2px 4px', borderRadius: 4, background: e.priority ? PRIORITY_CONFIG[e.priority].bg : 'rgba(55,138,221,0.1)', color: e.priority ? PRIORITY_CONFIG[e.priority].color : '#378ADD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html:`
        .calendar-cell:hover .hover-add { opacity: 1 !important; }
      `}} />
    </div>
  );
}
