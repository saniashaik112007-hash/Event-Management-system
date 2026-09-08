const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const activeUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeUser) {
    headers['x-user-id'] = activeUser.id;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'An API error occurred');
  }
  return data;
}

export const api = {
  // Auth & Users
  login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getUsers: () => fetchApi('/auth/users'),
  getMe: () => fetchApi('/auth/me'),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/events${query ? `?${query}` : ''}`);
  },
  getEventCategories: () => fetchApi('/events/categories'),
  getEventById: (id) => fetchApi(`/events/${id}`),
  createEvent: (data) => fetchApi('/events', { method: 'POST', body: JSON.stringify(data) }),
  resubmitEvent: (id, data) => fetchApi(`/events/${id}/resubmit`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => fetchApi(`/events/${id}`, { method: 'DELETE' }),
  updateTimeline: (eventId, data) => fetchApi(`/events/${eventId}/timeline`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadDocument: (eventId, data) => fetchApi(`/events/${eventId}/documents`, { method: 'POST', body: JSON.stringify(data) }),

  // Approvals & Workflow
  getPendingApprovals: (roleName) => fetchApi(`/approvals/pending${roleName ? `?role_name=${roleName}` : ''}`),
  submitApproval: (approvalId, data) => fetchApi(`/approvals/${approvalId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (data) => fetchApi('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId, data) => fetchApi(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (taskId) => fetchApi(`/tasks/${taskId}`, { method: 'DELETE' }),

  // Attendance Management
  getAttendance: (eventId) => fetchApi(`/attendance/event/${eventId}`),
  getRegistrations: (eventId) => fetchApi(`/attendance/event/${eventId}/registrations`),
  markAttendance: (data) => fetchApi('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),

  // Competitions & Judging
  getCompetitions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/competitions${query ? `?${query}` : ''}`);
  },
  createCompetition: (data) => fetchApi('/competitions', { method: 'POST', body: JSON.stringify(data) }),
  registerParticipant: (compId, data = {}) => fetchApi(`/competitions/${compId}/register`, { method: 'POST', body: JSON.stringify(data) }),
  assignJudge: (compId, data) => fetchApi(`/competitions/${compId}/assign-judge`, { method: 'POST', body: JSON.stringify(data) }),
  getAssignedJudging: (userId) => fetchApi(`/judging/assigned${userId ? `?user_id=${userId}` : ''}`),
  submitScores: (data) => fetchApi('/judging/scores', { method: 'POST', body: JSON.stringify(data) }),
  getResultsLeaderboard: (compId) => fetchApi(`/judging/results/${compId}`),
  verifyResults: (compId) => fetchApi(`/judging/verify/${compId}`, { method: 'POST' }),
  publishResults: (compId) => fetchApi(`/judging/publish/${compId}`, { method: 'POST' }),

  // Certificates
  getUserCertificates: (userId) => fetchApi(`/certificates/user/${userId}`),
  verifyCertificate: (code) => fetchApi(`/certificates/verify/${code}`),

  // Photo Gallery & Memories
  getGallery: (category = '') => fetchApi(`/gallery${category ? `?category=${category}` : ''}`),
  getPendingGallery: () => fetchApi('/gallery/pending'),
  uploadGalleryPhoto: (data) => fetchApi('/gallery/upload', { method: 'POST', body: JSON.stringify(data) }),
  updateGalleryStatus: (photoId, status) => fetchApi(`/gallery/${photoId}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  toggleLike: (photoId) => fetchApi(`/gallery/${photoId}/like`, { method: 'POST' }),
  postComment: (photoId, text) => fetchApi(`/gallery/${photoId}/comment`, { method: 'POST', body: JSON.stringify({ comment_text: text }) }),

  // Notifications
  getNotifications: (userId) => fetchApi(`/notifications/${userId}`),
  markNotificationRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PUT' }),
};
