import { storage } from '../utils/storage';
import { ApiResponse, ApiError } from '../types';

export const API_URL ='http://10.86.221.239:8000';

interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    [key: string]: any;
}

const fetchClient = async (endpoint: string, options: RequestOptions = {}) => {
    const token = await storage.getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: options.method || 'GET',
        headers,
        ...options,
    };

    if (options.body) {
        if (options.body instanceof FormData) {
            config.body = options.body;
            delete headers['Content-Type'];
        } else {
            config.body = JSON.stringify(options.body);
        }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try { data = await response.json(); } catch (e) { data = {}; }
        } else {
            try {
                const text = await response.text();
                if (text && (text.startsWith('{') || text.startsWith('['))) {
                    data = JSON.parse(text);
                } else {
                    data = { message: text };
                }
            } catch (e) { data = {}; }
        }

        if (response.ok) {
            return data;
        } else {
            const apiError: ApiError = {
                message: data?.message || data?.error || 'An error occurred',
                status: response.status,
            };
            return Promise.reject(apiError);
        }
    } catch (error: any) {
        const apiError: ApiError = {
            message: error.message || 'Network request failed',
            status: 0,
        };
        return Promise.reject(apiError);
    }
};

const apiClient = {
    get: (url: string, config?: any) => fetchClient(url, { ...config, method: 'GET' }),
    post: (url: string, data?: any, config?: any) => fetchClient(url, { ...config, method: 'POST', body: data }),
    put: (url: string, data?: any, config?: any) => fetchClient(url, { ...config, method: 'PUT', body: data }),
    delete: (url: string, config?: any) => fetchClient(url, { ...config, method: 'DELETE' }),
};

// Auth API
export const authApi = {
    login: (credentials: { email: string; password: string }) =>
        apiClient.post('/api/auth/login', credentials),

    register: (data: any) => apiClient.post('/api/auth/register', data),

    getColleges: () => apiClient.get('/api/auth/colleges'),

    checkAlumni: (data: { rollNumber: string; name: string; mobileNumber: string }) =>
        apiClient.post('/api/auth/check-alumni', data),

    checkMentor: (data: { mentorId: string; name: string }) =>
        apiClient.post('/api/auth/check-mentor', data),

    sendOtp: (data: { rollNumber: string; email: string }) =>
        apiClient.post('/api/auth/send-otp', data),

    verifyOtp: (data: { rollNumber: string; otp: string }) =>
        apiClient.post('/api/auth/verify-otp', data),
};

// User API
export const userApi = {
    getProfile: () => apiClient.get('/api/users/profile'),

    updateProfile: (data: any) => apiClient.put('/api/users/profile', data),

    getAllUsers: (filters?: { role?: string; search?: string }) => {
        const qs = filters ? new URLSearchParams(filters as any).toString() : '';
        return apiClient.get(`/api/users${qs ? `?${qs}` : ''}`);
    },

    getUserById: (id: string) => apiClient.get(`/api/users/${id}`),

    getMentors: (filters?: any) => {
        if (!filters) return apiClient.get('/api/mentors');
        const params = new URLSearchParams(filters).toString();
        return apiClient.get(`/api/mentors${params ? `?${params}` : ''}`);
    },

    getMentorById: (mentorId: string) => apiClient.get(`/api/mentors/${mentorId}`),

    uploadResume: (data: FormData) => apiClient.post('/api/users/upload-resume', data),

    getRecommendedStudents: (filters?: any) => {
        if (!filters) return apiClient.get('/api/users/students/recommended');
        const params = new URLSearchParams(filters).toString();
        return apiClient.get(`/api/users/students/recommended${params ? `?${params}` : ''}`);
    },

    getAlumniRecommended: () => apiClient.get('/api/users/alumni/recommended'),

    getContributionStats: () => apiClient.get('/api/users/alumni/contribution-stats'),

    getStudentAnalytics: () => apiClient.get('/api/users/student/analytics'),

    getResumeScore: (domain?: string) => apiClient.post('/api/users/resume-score', { domain }),
};

// Job API
export const jobApi = {
    getJobs: () => apiClient.get('/api/jobs'),

    getAdminJobs: (status?: string) => apiClient.get(`/api/jobs/all${status ? `?status=${status}` : ''}`),

    getJobById: (id: string) => apiClient.get(`/api/jobs/${id}`),

    postJob: (data: any) => apiClient.post('/api/jobs', data),

    updateJob: (id: string, data: any) => apiClient.put(`/api/jobs/${id}`, data),

    deleteJob: (id: string) => apiClient.delete(`/api/jobs/${id}`),

    applyJob: (id: string) => apiClient.post(`/api/jobs/${id}/apply`),

    approveJob: (id: string) => apiClient.put(`/api/jobs/${id}/approve`),

    rejectJob: (id: string) => apiClient.put(`/api/jobs/${id}/reject`),

    getMyApplications: () => apiClient.get('/api/jobs/my-applications'),

    getAlumniPostedJobs: () => apiClient.get('/api/jobs/alumni/posted'),

    acceptApplicant: (jobId: string, studentId: string) =>
        apiClient.post(`/api/jobs/${jobId}/apply/${studentId}/accept`),

    rejectApplicant: (jobId: string, studentId: string) =>
        apiClient.post(`/api/jobs/${jobId}/apply/${studentId}/reject`),

    getMentorJobs: () => apiClient.get('/api/jobs/mentor/all'),
};

// Chat API
export const chatApi = {
    getChats: () => apiClient.get('/api/chats'),

    getChatMessages: (chatId: string) => apiClient.get(`/api/chats/${chatId}/messages`),

    sendMessage: (chatId: string, content: string) =>
        apiClient.post(`/api/chats/${chatId}/messages`, { content }),

    createChat: (data: any) => apiClient.post('/api/chats', data),
};

// Session API
export const sessionApi = {
    getSessions: () => apiClient.get('/api/sessions'),

    // Student creates session: pass { mentorId, title, description, date, duration }
    // Alumni creates session: pass { menteeId, title, description, date, duration }
    createSession: (data: any) => apiClient.post('/api/sessions', data),

    updateSession: (sessionId: string, data: any) =>
        apiClient.put(`/api/sessions/${sessionId}`, data),

    updateSessionStatus: (sessionId: string, status: string) =>
        apiClient.put(`/api/sessions/${sessionId}/status`, { status }),

    cancelSession: (sessionId: string) => apiClient.delete(`/api/sessions/${sessionId}`),

    acceptSession: (sessionId: string) => apiClient.put(`/api/sessions/${sessionId}/accept`),

    declineSession: (sessionId: string) => apiClient.put(`/api/sessions/${sessionId}/decline`),

    getAlumniHistory: () => apiClient.get('/api/sessions/alumni/history'),
};

// Connection API
export const connectionApi = {
    sendRequest: (mentorId: string) =>
        apiClient.post('/api/mentors/connections', { mentorId }),

    getConnections: () => apiClient.get('/api/mentors/connections/my'),

    approveConnection: (connectionId: string) =>
        apiClient.put(`/api/connections/${connectionId}`, { status: 'approved' }),

    rejectConnection: (connectionId: string) =>
        apiClient.delete(`/api/connections/${connectionId}`),
};

// Referral API
export const referralApi = {
    requestReferral: (data: {
        alumniId: string;
        jobId?: string;
        jobTitle?: string;
        company?: string;
        studentMessage?: string;
    }) => apiClient.post('/api/referrals/request', data),

    getMyReferrals: () => apiClient.get('/api/referrals/my'),

    updateStatus: (referralId: string, status: 'given' | 'rejected', notes?: string) =>
        apiClient.put(`/api/referrals/${referralId}/status`, { status, notes }),

    getStats: () => apiClient.get('/api/referrals/stats'),
};

// AI API
export const aiApi = {
    chat: (message: string) => apiClient.post('/api/ai/chat', { message }),
    resumeScore: (domain?: string) => apiClient.post('/api/ai/resume-score', { domain }),
};

// Notification API
export const notificationApi = {
    getNotifications: () => apiClient.get('/api/notifications'),

    markAsRead: (notificationId: string) =>
        apiClient.put(`/api/notifications/${notificationId}/read`),

    markAllRead: () => apiClient.put('/api/notifications/read-all'),

    deleteNotification: (notificationId: string) =>
        apiClient.delete(`/api/notifications/${notificationId}`),

    getUnreadCount: () => apiClient.get('/api/notifications/unread-count'),
};

// Alumni API
export const alumniApi = {
    getGroups: () => apiClient.get('/api/alumni-groups'),

    getMyGroups: () => apiClient.get('/api/alumni-groups/my/groups'),

    joinGroup: (groupId: string) => apiClient.post(`/api/alumni-groups/${groupId}/join`),

    leaveGroup: (groupId: string) => apiClient.post(`/api/alumni-groups/${groupId}/leave`),

    createGroup: (data: { name: string; year: string | number; description?: string; institution: string }) =>
        apiClient.post('/api/alumni-groups', data),

    getGroupMessages: (groupId: string) =>
        apiClient.get(`/api/alumni-groups/${groupId}/messages`),

    sendGroupMessage: (groupId: string, content: string) =>
        apiClient.post(`/api/alumni-groups/${groupId}/messages`, { content }),
};

// Admin API
export const adminApi = {
    getStats: () => apiClient.get('/api/admin/stats'),

    getAllUsers: (params?: { role?: string; status?: string }) => {
        const qs = params ? new URLSearchParams(params as any).toString() : '';
        return apiClient.get(`/api/admin/users${qs ? `?${qs}` : ''}`);
    },

    deleteUser: (userId: string) => apiClient.delete(`/api/admin/users/${userId}`),

    approveUser: (userId: string) => apiClient.put(`/api/admin/users/${userId}/approve`),

    rejectUser: (userId: string) => apiClient.put(`/api/admin/users/${userId}/reject`),

    getAlumniVerificationQueue: () => apiClient.get('/api/admin/alumni-verification'),

    // Meetings
    getMeetings: () => apiClient.get('/api/admin/meetings'),

    createMeeting: (data: any) => apiClient.post('/api/admin/meetings', data),

    updateMeeting: (id: string, data: any) => apiClient.put(`/api/admin/meetings/${id}`, data),

    deleteMeeting: (id: string) => apiClient.delete(`/api/admin/meetings/${id}`),

    getMeetingUsers: (role?: string) =>
        apiClient.get(`/api/admin/meeting-users${role ? `?role=${role}` : ''}`),

    deleteJob: (jobId: string) => apiClient.delete(`/api/admin/jobs/${jobId}`),

    // Alumni dataset management
    getAlumniDataset: () => apiClient.get('/api/admin/alumni-dataset'),

    addAlumniToDataset: (data: any) => apiClient.post('/api/admin/alumni-dataset', data),

    // Mentor dataset management
    getMentorDataset: () => apiClient.get('/api/admin/mentor-dataset'),

    addMentorToDataset: (data: any) => apiClient.post('/api/admin/mentor-dataset', data),
};

// Meetings API (for participants)
export const meetingApi = {
    getMyMeetings: () => apiClient.get('/api/meetings'),

    acceptMeeting: (id: string) => apiClient.put(`/api/meetings/${id}/accept`),

    declineMeeting: (id: string) => apiClient.put(`/api/meetings/${id}/decline`),
};

// System API
export const systemApi = {
    checkConnection: () => apiClient.get('/'),
};

// Alumni Directory API
export const alumniDirectoryApi = {
    getDirectory: (filters?: { company?: string; domain?: string; batch?: string; examsWritten?: string }) => {
        const qs = filters ? new URLSearchParams(filters as any).toString() : '';
        return apiClient.get(`/api/users/alumni/directory${qs ? `?${qs}` : ''}`);
    },
};

// Student Filter API (for alumni)
export const studentFilterApi = {
    filterStudents: (filters?: { skills?: string; domain?: string; batch?: string; search?: string }) => {
        const qs = filters ? new URLSearchParams(filters as any).toString() : '';
        return apiClient.get(`/api/users/students/filter${qs ? `?${qs}` : ''}`);
    },
};
