import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Event Types
export const getEventTypes      = ()         => api.get('/event-types');
export const getEventTypeBySlug = (slug)     => api.get(`/event-types/slug/${slug}`);
export const createEventType    = (data)     => api.post('/event-types', data);
export const updateEventType    = (id, data) => api.put(`/event-types/${id}`, data);
export const deleteEventType    = (id)       => api.delete(`/event-types/${id}`);

// Availability
export const getAvailability    = ()       => api.get('/availability');
export const updateAvailability = (data)   => api.put('/availability', data);

// Questions
export const getQuestions    = (eventTypeId)         => api.get(`/questions/${eventTypeId}`);
export const updateQuestions = (eventTypeId, data)   => api.put(`/questions/${eventTypeId}`, data);

// Bookings
export const getSlots      = (date, eventTypeId) =>
  api.get(`/bookings/slots?date=${date}&eventTypeId=${eventTypeId}`);
export const createBooking   = (data)   => api.post('/bookings', data);
export const rescheduleBooking = (id, data) => api.post(`/bookings/${id}/reschedule`, data);

// Meetings
export const getMeetings         = () => api.get('/meetings');
export const getUpcomingMeetings = () => api.get('/meetings/upcoming');
export const getPastMeetings     = () => api.get('/meetings/past');
export const cancelMeeting       = (id) => api.patch(`/meetings/${id}/cancel`);