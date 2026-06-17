export type UserRole = 'admin' | 'receptionist' | 'chanting_master';

export type GuestStatus = 'active' | 'checked_out' | 'probation' | 'resident';

export type ResidentStatus = 'probation' | 'active' | 'suspended' | 'left';

export type DormitoryStatus = 'available' | 'occupied' | 'maintenance';

export type AttendanceSession = 'morning' | 'evening';

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export type MonkType = 'guest' | 'resident';

export interface User {
  id: string;
  username: string;
  dharmaName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface GuestRegistration {
  id: string;
  dharmaName: string;
  originalTemple: string;
  preceptsCertificateNo?: string;
  arrivalDate: Date;
  expectedStayDays: number;
  actualLeaveDate?: Date;
  roomNumber?: string;
  bedNumber?: string;
  status: GuestStatus;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  guestRegistrationId?: string;
  dharmaName: string;
  generationName: string;
  tonsureMaster: string;
  preceptsDate: Date;
  preceptsTemple: string;
  position?: string;
  probationStartDate: Date;
  probationEndDate?: Date;
  ordinationCeremonyDate?: Date;
  status: ResidentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dormitory {
  id: string;
  roomNumber: string;
  bedNumber: string;
  floor: number;
  capacity: number;
  currentOccupantId?: string;
  status: DormitoryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  monkId: string;
  monkType: MonkType;
  date: Date;
  session: AttendanceSession;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: string;
  createdAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalGuests: number;
  activeGuests: number;
  totalResidents: number;
  activeResidents: number;
  availableBeds: number;
  occupiedBeds: number;
  todayAttendanceRate: number;
  absentAlerts: number;
  monthlyGuestTrend: { month: string; count: number }[];
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AttendanceBatchItem {
  monkId: string;
  monkType: MonkType;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceBatchRequest {
  date: string;
  session: AttendanceSession;
  records: AttendanceBatchItem[];
}

export interface AbsentAlert {
  monkId: string;
  monkType: MonkType;
  dharmaName: string;
  absentCount: number;
  lastAbsentDate: Date;
}

export interface AttendanceWeeklyTrend {
  week: string;
  absentCount: number;
  totalCount: number;
  absentRate: number;
}

export interface AttendanceMonthlyTrend {
  month: string;
  absentCount: number;
  totalCount: number;
  absentRate: number;
}

export interface AttendanceSessionComparison {
  session: AttendanceSession;
  absentCount: number;
  totalCount: number;
  absentRate: number;
}

export interface AttendanceStatistics {
  weeklyTrend: AttendanceWeeklyTrend[];
  monthlyTrend: AttendanceMonthlyTrend[];
  sessionComparison: AttendanceSessionComparison[];
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  overallAttendanceRate: number;
}

export interface MonkAttendanceRecord {
  date: string;
  session: AttendanceSession;
  status: AttendanceStatus;
}

export interface MonkAttendanceCalendar {
  year: number;
  month: number;
  dharmaName: string;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  attendanceRate: number;
  records: MonkAttendanceRecord[];
}

export const RoleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  receptionist: '客堂知客',
  chanting_master: '维那师',
};

export const GuestStatusLabels: Record<GuestStatus, string> = {
  active: '在住',
  checked_out: '已离寺',
  probation: '考察期',
  resident: '已转常住',
};

export const ResidentStatusLabels: Record<ResidentStatus, string> = {
  probation: '考察期',
  active: '常住',
  suspended: '暂停',
  left: '已离寺',
};

export const DormitoryStatusLabels: Record<DormitoryStatus, string> = {
  available: '空闲',
  occupied: '已住',
  maintenance: '维修中',
};

export const AttendanceSessionLabels: Record<AttendanceSession, string> = {
  morning: '早课',
  evening: '晚课',
};

export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: '出勤',
  absent: '缺勤',
  leave: '请假',
};

export const PositionOptions = [
  { value: '知客', label: '知客' },
  { value: '维那', label: '维那' },
  { value: '典座', label: '典座' },
  { value: '监院', label: '监院' },
  { value: '首座', label: '首座' },
  { value: '西堂', label: '西堂' },
  { value: '后堂', label: '后堂' },
  { value: '堂主', label: '堂主' },
  { value: '悦众', label: '悦众' },
  { value: '衣钵', label: '衣钵' },
  { value: '汤药', label: '汤药' },
  { value: '侍者', label: '侍者' },
];
