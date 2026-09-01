export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  dressCode?: string;
}

export const calendarService = {
  // Phase 2 extension point
  getUpcomingEvents: async (): Promise<CalendarEvent[]> => {
    // Google Calendar API integration scheduled for Phase 2
    return [];
  },
};
