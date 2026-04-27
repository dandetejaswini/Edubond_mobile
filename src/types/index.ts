export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'mentor' | 'alumni' | 'admin';
    institution: string;
    status?: 'pending' | 'approved' | 'rejected';
    bio?: string;
    expertise?: string[];
    avatar?: string;
    profileImage?: string;
    company?: string;
    domain?: string;
    yearsOfExperience?: number;
    batch?: string;
    jobsCracked?: string[];
    examsWritten?: string[];
    skills?: string[];
    extractedSkills?: string[];
    resumeUrl?: string;
    jobsPostedCount?: number;
    sessionsConducted?: number;
    referralsGiven?: number;
    matchScore?: number;
    rollNumber?: string;
    mobileNumber?: string;
    passingYear?: number;
    mentorId?: string;
    isOtpVerified?: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    message: string;
    status: number;
}

export interface Mentor {
    _id: string;
    name: string;
    email: string;
    role: string;
    institution: string;
    expertise: string[];
    bio: string;
    rating: number;
    avatar?: string;
}

export interface Chat {
    _id: string;
    participants: User[];
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

export interface Message {
    _id: string;
    chatId: string;
    sender: string;
    content: string;
    timestamp: string;
}

export interface Session {
    _id: string;
    mentor: { _id: string; name: string; email: string; company?: string };
    mentee: { _id: string; name: string; email: string };
    title: string;
    description?: string;
    date: string;
    scheduledDate?: string;
    duration: number;
    meetingLink: string;
    status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'declined';
    createdAt?: string;
}

export interface Notification {
    _id: string;
    userId?: string;
    title: string;
    message: string;
    type: 'connection' | 'session' | 'message' | 'system' | 'job' | 'referral' | 'job_apply';
    read: boolean;
    createdAt: string;
    metadata?: Record<string, string>;
}

export interface AlumniGroup {
    _id: string;
    name: string;
    batch?: string;
    year: number;
    institution: string;
    description?: string;
    members: User[];
    activities: string[];
}

export interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    experienceLevel: string;
    description: string;
    requirements: string[];
    domain?: string;
    skillsRequired?: string[];
    postedBy: User | string;
    status: 'pending' | 'approved' | 'rejected';
    applicants: User[] | string[];
    createdAt: string;
    // Per-applicant status (returned by my-applications endpoint)
    applicationStatus?: 'pending' | 'accepted' | 'rejected';
    appliedAt?: string;
}

export interface Meeting {
    _id: string;
    title: string;
    description?: string;
    scheduledBy: User | string;
    participants: User[];
    date: string;
    duration: number;
    meetingLink?: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    acceptedBy: User[] | string[];
    declinedBy?: User[] | string[];
    type: 'mentoring' | 'career' | 'general' | 'alumni';
    createdAt: string;
}

export interface AlumniDirectoryEntry {
    batch: string;
    members: User[];
}

export interface JobApplication {
    _id: string;
    job: Job;
    student: User;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: string;
}

export interface Referral {
    _id: string;
    alumni: User | string;
    student: User | string;
    job?: Job | string;
    jobTitle?: string;
    company?: string;
    status: 'pending' | 'given' | 'rejected';
    notes?: string;
    studentMessage?: string;
    createdAt: string;
}

export interface ResumeAnalysis {
    score: number;
    strengths: string[];
    improvements: string[];
    topSkills: string[];
}

export interface StudentAnalytics {
    applicationsCount: number;
    sessionsAttended: number;
    referralsReceived: number;
    meetingsPending: number;
    meetingsAccepted: number;
    profileCompletion: number;
    skillsCount: number;
}

export interface ContributionStats {
    referralsGiven: number;
    referralsPending: number;
    jobsPosted: number;
    sessionsTotal: number;
    sessionsCompleted: number;
    engagementScore: number;
    company: string;
    domain: string;
}
