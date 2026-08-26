// interfaces

export interface AdminDashboardOutput {
  userCount: number;
  specialtyCount: number;
  examCount: number;
  questionCount: number;
  todaySubmissions: number;
  avgScore: number;
}

export interface UserDashboardOutput {
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  certificateCount: number;
}
