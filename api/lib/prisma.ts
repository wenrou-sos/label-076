import { PrismaClient } from '@prisma/client'
import type {
  User,
  UserWithPassword,
  GuestRegistration,
  Resident,
  Dormitory,
  Attendance,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
  AttendanceBatchRequest,
  AbsentAlert,
} from '../../shared/types.js'

let prisma: PrismaClient | null = null
let useMock = false
let connectionTested = false
let connectionAvailable = false

const mockUsers: UserWithPassword[] = [
  {
    id: '1',
    username: 'admin',
    dharmaName: '释 admin',
    role: 'admin',
    passwordHash: '$2a$10$PqPnQgye9g0SE8YgmceZqeqZovbX55tnYU88fNXFMf639mJaqUaCW',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    username: 'receptionist',
    dharmaName: '释知客',
    role: 'receptionist',
    passwordHash: '$2a$10$PqPnQgye9g0SE8YgmceZqeqZovbX55tnYU88fNXFMf639mJaqUaCW',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    username: 'chanting',
    dharmaName: '释维那',
    role: 'chanting_master',
    passwordHash: '$2a$10$PqPnQgye9g0SE8YgmceZqeqZovbX55tnYU88fNXFMf639mJaqUaCW',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

let mockDormitories: Dormitory[] = [
  {
    id: 'd1',
    roomNumber: '101',
    bedNumber: '1',
    floor: 1,
    capacity: 1,
    status: 'available',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'd2',
    roomNumber: '101',
    bedNumber: '2',
    floor: 1,
    capacity: 1,
    status: 'occupied',
    currentOccupantId: 'g1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'd3',
    roomNumber: '102',
    bedNumber: '1',
    floor: 1,
    capacity: 1,
    status: 'available',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'd4',
    roomNumber: '201',
    bedNumber: '1',
    floor: 2,
    capacity: 1,
    status: 'maintenance',
    notes: '空调维修',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'd5',
    roomNumber: '201',
    bedNumber: '2',
    floor: 2,
    capacity: 1,
    status: 'occupied',
    currentOccupantId: 'r1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

let mockRegistrations: GuestRegistration[] = [
  {
    id: 'g1',
    dharmaName: '释行者',
    originalTemple: '少林寺',
    preceptsCertificateNo: 'PC2024001',
    arrivalDate: new Date('2024-06-01'),
    expectedStayDays: 30,
    roomNumber: '101',
    bedNumber: '2',
    status: 'active',
    createdBy: '1',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'g2',
    dharmaName: '释云水',
    originalTemple: '普陀山',
    arrivalDate: new Date('2024-06-10'),
    expectedStayDays: 15,
    status: 'active',
    createdBy: '1',
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-10'),
  },
  {
    id: 'g3',
    dharmaName: '释修行',
    originalTemple: '五台山',
    preceptsCertificateNo: 'PC2024003',
    arrivalDate: new Date('2024-05-15'),
    expectedStayDays: 90,
    status: 'probation',
    roomNumber: '201',
    bedNumber: '2',
    createdBy: '2',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'g4',
    dharmaName: '释过往',
    originalTemple: '峨眉山',
    arrivalDate: new Date('2024-04-01'),
    expectedStayDays: 7,
    actualLeaveDate: new Date('2024-04-08'),
    status: 'checked_out',
    createdBy: '2',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-08'),
  },
]

let mockResidents: Resident[] = [
  {
    id: 'r1',
    guestRegistrationId: 'g3',
    dharmaName: '释修行',
    generationName: '妙',
    tonsureMaster: '释长老',
    preceptsDate: new Date('2020-06-01'),
    preceptsTemple: '少林寺',
    position: '悦众',
    probationStartDate: new Date('2024-06-01'),
    status: 'probation',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'r2',
    dharmaName: '释常住',
    generationName: '慧',
    tonsureMaster: '释大德',
    preceptsDate: new Date('2018-09-15'),
    preceptsTemple: '普陀山',
    position: '维那',
    probationStartDate: new Date('2023-01-01'),
    probationEndDate: new Date('2023-06-30'),
    ordinationCeremonyDate: new Date('2023-07-01'),
    status: 'active',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-07-01'),
  },
  {
    id: 'r3',
    dharmaName: '释知客',
    generationName: '明',
    tonsureMaster: '释长老',
    preceptsDate: new Date('2019-03-20'),
    preceptsTemple: '五台山',
    position: '知客',
    probationStartDate: new Date('2022-06-01'),
    probationEndDate: new Date('2022-12-31'),
    ordinationCeremonyDate: new Date('2023-01-15'),
    status: 'active',
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2023-01-15'),
  },
]

let mockAttendances: Attendance[] = [
  {
    id: 'a1',
    monkId: 'r1',
    monkType: 'resident',
    date: new Date('2024-06-15'),
    session: 'morning',
    status: 'present',
    recordedBy: '1',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'a2',
    monkId: 'r2',
    monkType: 'resident',
    date: new Date('2024-06-15'),
    session: 'morning',
    status: 'present',
    recordedBy: '1',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'a3',
    monkId: 'g1',
    monkType: 'guest',
    date: new Date('2024-06-15'),
    session: 'morning',
    status: 'absent',
    recordedBy: '1',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'a4',
    monkId: 'r1',
    monkType: 'resident',
    date: new Date('2024-06-14'),
    session: 'morning',
    status: 'absent',
    recordedBy: '1',
    createdAt: new Date('2024-06-14'),
  },
  {
    id: 'a5',
    monkId: 'r1',
    monkType: 'resident',
    date: new Date('2024-06-13'),
    session: 'morning',
    status: 'absent',
    recordedBy: '1',
    createdAt: new Date('2024-06-13'),
  },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

try {
  prisma = new PrismaClient()
} catch (error) {
  console.warn('Prisma client initialization failed, using mock data:', error)
  useMock = true
}

async function testConnection(): Promise<boolean> {
  if (useMock) return false
  if (connectionTested) return connectionAvailable
  try {
    await prisma!.$queryRaw`SELECT 1`
    connectionTested = true
    connectionAvailable = true
    return true
  } catch (error) {
    console.warn('Database connection failed, using mock data:', error)
    useMock = true
    connectionTested = true
    connectionAvailable = false
    return false
  }
}

export const userService = {
  async findByUsername(username: string): Promise<UserWithPassword | null> {
    if (useMock || !(await testConnection())) {
      return mockUsers.find((u) => u.username === username) || null
    }
    return prisma!.user.findUnique({ where: { username } }) as Promise<UserWithPassword | null>
  },

  async findById(id: string): Promise<User | null> {
    if (useMock || !(await testConnection())) {
      const user = mockUsers.find((u) => u.id === id)
      if (!user) return null
      const { passwordHash, ...userWithoutPassword } = user
      return userWithoutPassword
    }
    return prisma!.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        dharmaName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<User | null>
  },
}

export const dormitoryService = {
  async findAll(params?: PaginationParams): Promise<PaginatedResponse<Dormitory>> {
    if (useMock || !(await testConnection())) {
      let data = [...mockDormitories]
      if (params?.status) {
        data = data.filter((d) => d.status === params.status)
      }
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        data = data.filter(
          (d) =>
            d.roomNumber.toLowerCase().includes(kw) ||
            d.bedNumber.toLowerCase().includes(kw)
        )
      }
      const total = data.length
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const start = (page - 1) * pageSize
      data = data.slice(start, start + pageSize)
      return { data, total, page, pageSize }
    }
    const where: any = {}
    if (params?.status) where.status = params.status
    if (params?.keyword) {
      where.OR = [
        { roomNumber: { contains: params.keyword } },
        { bedNumber: { contains: params.keyword } },
      ]
    }
    const [total, data] = await Promise.all([
      prisma!.dormitory.count({ where }),
      prisma!.dormitory.findMany({
        where,
        skip: params?.page ? (params.page - 1) * (params.pageSize || 10) : 0,
        take: params?.pageSize || 10,
        orderBy: { createdAt: 'desc' },
      }) as Promise<Dormitory[]>,
    ])
    return {
      data,
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  },

  async findById(id: string): Promise<Dormitory | null> {
    if (useMock || !(await testConnection())) {
      return mockDormitories.find((d) => d.id === id) || null
    }
    return prisma!.dormitory.findUnique({ where: { id } }) as Promise<Dormitory | null>
  },

  async create(data: Omit<Dormitory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dormitory> {
    if (useMock || !(await testConnection())) {
      const newDorm: Dormitory = {
        ...data,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockDormitories.push(newDorm)
      return newDorm
    }
    return prisma!.dormitory.create({ data }) as Promise<Dormitory>
  },

  async update(
    id: string,
    data: Partial<Omit<Dormitory, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Dormitory | null> {
    if (useMock || !(await testConnection())) {
      const index = mockDormitories.findIndex((d) => d.id === id)
      if (index === -1) return null
      mockDormitories[index] = {
        ...mockDormitories[index],
        ...data,
        updatedAt: new Date(),
      }
      return mockDormitories[index]
    }
    return prisma!.dormitory.update({ where: { id }, data }) as Promise<Dormitory | null>
  },

  async findAvailable(): Promise<Dormitory[]> {
    if (useMock || !(await testConnection())) {
      return mockDormitories.filter((d) => d.status === 'available')
    }
    return prisma!.dormitory.findMany({ where: { status: 'available' } }) as Promise<Dormitory[]>
  },
}

export const registrationService = {
  async findAll(params?: PaginationParams): Promise<PaginatedResponse<GuestRegistration>> {
    if (useMock || !(await testConnection())) {
      let data = [...mockRegistrations]
      if (params?.status) {
        data = data.filter((g) => g.status === params.status)
      }
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        data = data.filter(
          (g) =>
            g.dharmaName.toLowerCase().includes(kw) ||
            g.originalTemple.toLowerCase().includes(kw)
        )
      }
      const total = data.length
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const start = (page - 1) * pageSize
      data = data.slice(start, start + pageSize)
      return { data, total, page, pageSize }
    }
    const where: any = {}
    if (params?.status) where.status = params.status
    if (params?.keyword) {
      where.OR = [
        { dharmaName: { contains: params.keyword } },
        { originalTemple: { contains: params.keyword } },
      ]
    }
    const [total, data] = await Promise.all([
      prisma!.guestRegistration.count({ where }),
      prisma!.guestRegistration.findMany({
        where,
        skip: params?.page ? (params.page - 1) * (params.pageSize || 10) : 0,
        take: params?.pageSize || 10,
        orderBy: { createdAt: 'desc' },
      }) as Promise<GuestRegistration[]>,
    ])
    return {
      data,
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  },

  async findById(id: string): Promise<GuestRegistration | null> {
    if (useMock || !(await testConnection())) {
      return mockRegistrations.find((g) => g.id === id) || null
    }
    return prisma!.guestRegistration.findUnique({ where: { id } }) as Promise<GuestRegistration | null>
  },

  async create(
    data: Omit<GuestRegistration, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      createdBy?: string
    }
  ): Promise<GuestRegistration> {
    if (useMock || !(await testConnection())) {
      const newReg: GuestRegistration = {
        ...data,
        id: generateId(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockRegistrations.push(newReg)
      return newReg
    }
    return prisma!.guestRegistration.create({
      data: { ...data, status: 'active' },
    }) as Promise<GuestRegistration>
  },

  async update(
    id: string,
    data: Partial<Omit<GuestRegistration, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<GuestRegistration | null> {
    if (useMock || !(await testConnection())) {
      const index = mockRegistrations.findIndex((g) => g.id === id)
      if (index === -1) return null
      mockRegistrations[index] = {
        ...mockRegistrations[index],
        ...data,
        updatedAt: new Date(),
      }
      return mockRegistrations[index]
    }
    return prisma!.guestRegistration.update({ where: { id }, data }) as Promise<GuestRegistration | null>
  },

  async delete(id: string): Promise<boolean> {
    if (useMock || !(await testConnection())) {
      const index = mockRegistrations.findIndex((g) => g.id === id)
      if (index === -1) return false
      mockRegistrations.splice(index, 1)
      return true
    }
    await prisma!.guestRegistration.delete({ where: { id } })
    return true
  },

  async assignBed(
    id: string,
    params: { dormitoryId?: string; roomNumber?: string; bedNumber?: string }
  ): Promise<GuestRegistration | null> {
    const { dormitoryId, roomNumber, bedNumber } = params

    if (useMock || !(await testConnection())) {
      const regIndex = mockRegistrations.findIndex((g) => g.id === id)
      let dormIndex = -1

      if (dormitoryId) {
        dormIndex = mockDormitories.findIndex((d) => d.id === dormitoryId)
      } else if (roomNumber && bedNumber) {
        dormIndex = mockDormitories.findIndex(
          (d) => d.roomNumber === roomNumber && d.bedNumber === bedNumber
        )
      }

      if (regIndex === -1 || dormIndex === -1) return null
      if (mockDormitories[dormIndex].status !== 'available') return null

      const oldDormIndex = mockDormitories.findIndex(
        (d) => d.currentOccupantId === id
      )
      if (oldDormIndex !== -1) {
        mockDormitories[oldDormIndex] = {
          ...mockDormitories[oldDormIndex],
          status: 'available',
          currentOccupantId: undefined,
          updatedAt: new Date(),
        }
      }

      mockDormitories[dormIndex] = {
        ...mockDormitories[dormIndex],
        status: 'occupied',
        currentOccupantId: id,
        updatedAt: new Date(),
      }

      mockRegistrations[regIndex] = {
        ...mockRegistrations[regIndex],
        roomNumber: mockDormitories[dormIndex].roomNumber,
        bedNumber: mockDormitories[dormIndex].bedNumber,
        updatedAt: new Date(),
      }
      return mockRegistrations[regIndex]
    }

    return prisma!.$transaction(async (tx) => {
      const reg = await tx.guestRegistration.findUnique({ where: { id } }) as GuestRegistration | null

      let dorm: Dormitory | null = null
      if (dormitoryId) {
        dorm = await tx.dormitory.findUnique({ where: { id: dormitoryId } }) as Dormitory | null
      } else if (roomNumber && bedNumber) {
        dorm = await tx.dormitory.findFirst({
          where: { roomNumber, bedNumber },
        }) as Dormitory | null
      }

      if (!reg || !dorm || dorm.status !== 'available') return null

      if (reg.roomNumber && reg.bedNumber) {
        await tx.dormitory.updateMany({
          where: {
            roomNumber: reg.roomNumber,
            bedNumber: reg.bedNumber,
          },
          data: { status: 'available', currentOccupantId: null },
        })
      }

      await tx.dormitory.update({
        where: { id: dorm.id },
        data: { status: 'occupied', currentOccupantId: id },
      })

      return tx.guestRegistration.update({
        where: { id },
        data: {
          roomNumber: dorm.roomNumber,
          bedNumber: dorm.bedNumber,
        },
      }) as Promise<GuestRegistration>
    })
  },

  async startProbation(id: string): Promise<GuestRegistration | null> {
    if (useMock || !(await testConnection())) {
      const index = mockRegistrations.findIndex((g) => g.id === id)
      if (index === -1) return null
      mockRegistrations[index] = {
        ...mockRegistrations[index],
        status: 'probation',
        updatedAt: new Date(),
      }
      return mockRegistrations[index]
    }
    return prisma!.guestRegistration.update({
      where: { id },
      data: { status: 'probation' },
    }) as Promise<GuestRegistration | null>
  },
}

export const residentService = {
  async findAll(params?: PaginationParams): Promise<PaginatedResponse<Resident>> {
    if (useMock || !(await testConnection())) {
      let data = [...mockResidents]
      if (params?.status) {
        data = data.filter((r) => r.status === params.status)
      }
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        data = data.filter(
          (r) =>
            r.dharmaName.toLowerCase().includes(kw) ||
            r.position?.toLowerCase().includes(kw)
        )
      }
      const total = data.length
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const start = (page - 1) * pageSize
      data = data.slice(start, start + pageSize)
      return { data, total, page, pageSize }
    }
    const where: any = {}
    if (params?.status) where.status = params.status
    if (params?.keyword) {
      where.OR = [
        { dharmaName: { contains: params.keyword } },
        { position: { contains: params.keyword } },
      ]
    }
    const [total, data] = await Promise.all([
      prisma!.resident.count({ where }),
      prisma!.resident.findMany({
        where,
        skip: params?.page ? (params.page - 1) * (params.pageSize || 10) : 0,
        take: params?.pageSize || 10,
        orderBy: { createdAt: 'desc' },
      }) as Promise<Resident[]>,
    ])
    return {
      data,
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  },

  async findProbation(): Promise<Resident[]> {
    if (useMock || !(await testConnection())) {
      return mockResidents.filter((r) => r.status === 'probation')
    }
    return prisma!.resident.findMany({ where: { status: 'probation' } }) as Promise<Resident[]>
  },

  async findById(id: string): Promise<Resident | null> {
    if (useMock || !(await testConnection())) {
      return mockResidents.find((r) => r.id === id) || null
    }
    return prisma!.resident.findUnique({ where: { id } }) as Promise<Resident | null>
  },

  async create(
    data: Omit<Resident, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Resident> {
    if (useMock || !(await testConnection())) {
      const newRes: Resident = {
        ...data,
        id: generateId(),
        status: 'probation',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockResidents.push(newRes)
      return newRes
    }
    return prisma!.resident.create({ data: { ...data, status: 'probation' } }) as Promise<Resident>
  },

  async update(
    id: string,
    data: Partial<Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Resident | null> {
    if (useMock || !(await testConnection())) {
      const index = mockResidents.findIndex((r) => r.id === id)
      if (index === -1) return null
      mockResidents[index] = {
        ...mockResidents[index],
        ...data,
        updatedAt: new Date(),
      }
      return mockResidents[index]
    }
    return prisma!.resident.update({ where: { id }, data }) as Promise<Resident | null>
  },

  async completeProbation(
    id: string,
    ordinationCeremonyDate: Date
  ): Promise<Resident | null> {
    if (useMock || !(await testConnection())) {
      const index = mockResidents.findIndex((r) => r.id === id)
      if (index === -1) return null
      mockResidents[index] = {
        ...mockResidents[index],
        status: 'active',
        probationEndDate: new Date(),
        ordinationCeremonyDate,
        updatedAt: new Date(),
      }
      return mockResidents[index]
    }
    return prisma!.resident.update({
      where: { id },
      data: {
        status: 'active',
        probationEndDate: new Date(),
        ordinationCeremonyDate,
      },
    }) as Promise<Resident | null>
  },
}

export const attendanceService = {
  async findAll(params?: PaginationParams & { date?: string; session?: string }): Promise<PaginatedResponse<Attendance>> {
    if (useMock || !(await testConnection())) {
      let data = [...mockAttendances]
      if (params?.date) {
        const targetDate = new Date(params.date).toDateString()
        data = data.filter((a) => new Date(a.date).toDateString() === targetDate)
      }
      if (params?.session) {
        data = data.filter((a) => a.session === params.session)
      }
      const total = data.length
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const start = (page - 1) * pageSize
      data = data.slice(start, start + pageSize)
      return { data, total, page, pageSize }
    }
    const where: any = {}
    if (params?.date) where.date = new Date(params.date)
    if (params?.session) where.session = params.session
    const [total, data] = await Promise.all([
      prisma!.attendance.count({ where }),
      prisma!.attendance.findMany({
        where,
        skip: params?.page ? (params.page - 1) * (params.pageSize || 10) : 0,
        take: params?.pageSize || 10,
        orderBy: { createdAt: 'desc' },
      }) as Promise<Attendance[]>,
    ])
    return {
      data,
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  },

  async batchCreate(
    request: AttendanceBatchRequest,
    recordedBy: string
  ): Promise<Attendance[]> {
    if (useMock || !(await testConnection())) {
      const newRecords: Attendance[] = request.records.map((r) => ({
        id: generateId(),
        monkId: r.monkId,
        monkType: r.monkType,
        date: new Date(request.date),
        session: request.session,
        status: r.status,
        notes: r.notes,
        recordedBy,
        createdAt: new Date(),
      }))
      mockAttendances.push(...newRecords)
      return newRecords
    }
    const records = request.records.map((r) => ({
      monkId: r.monkId,
      monkType: r.monkType,
      date: new Date(request.date),
      session: request.session,
      status: r.status,
      notes: r.notes,
      recordedBy,
    }))
    return prisma!.$transaction(
      records.map((r) =>
        prisma!.attendance.upsert({
          where: {
            monkId_date_session: {
              monkId: r.monkId,
              date: r.date,
              session: r.session,
            },
          },
          create: r,
          update: { status: r.status, notes: r.notes, recordedBy: r.recordedBy },
        })
      )
    ) as Promise<Attendance[]>
  },

  async getAbsentCount(days: number = 7): Promise<number> {
    if (useMock || !(await testConnection())) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return mockAttendances.filter(
        (a) => a.status === 'absent' && new Date(a.date) >= cutoff
      ).length
    }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return prisma!.attendance.count({
      where: { status: 'absent', date: { gte: cutoff } },
    })
  },

  async getAbsentAlerts(threshold: number = 3): Promise<AbsentAlert[]> {
    if (useMock || !(await testConnection())) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const absentMap = new Map<
        string,
        { count: number; lastDate: Date; monkType: 'guest' | 'resident' }
      >()

      mockAttendances
        .filter((a) => a.status === 'absent' && new Date(a.date) >= cutoff)
        .forEach((a) => {
          const existing = absentMap.get(a.monkId)
          if (!existing || new Date(a.date) > existing.lastDate) {
            absentMap.set(a.monkId, {
              count: (existing?.count || 0) + 1,
              lastDate: new Date(a.date),
              monkType: a.monkType,
            })
          } else {
            existing.count += 1
          }
        })

      const alerts: AbsentAlert[] = []
      absentMap.forEach((value, monkId) => {
        if (value.count >= threshold) {
          let dharmaName = ''
          if (value.monkType === 'guest') {
            const guest = mockRegistrations.find((g) => g.id === monkId)
            dharmaName = guest?.dharmaName || ''
          } else {
            const resident = mockResidents.find((r) => r.id === monkId)
            dharmaName = resident?.dharmaName || ''
          }
          alerts.push({
            monkId,
            monkType: value.monkType,
            dharmaName,
            absentCount: value.count,
            lastAbsentDate: value.lastDate,
          })
        }
      })
      return alerts
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)

    const result = await prisma!.$queryRaw<any[]>`
      SELECT 
        monk_id,
        monk_type,
        COUNT(*) as absent_count,
        MAX(date) as last_absent_date
      FROM attendance
      WHERE status = 'absent' AND date >= ${cutoff}
      GROUP BY monk_id, monk_type
      HAVING COUNT(*) >= ${threshold}
    `

    const alerts: AbsentAlert[] = []
    for (const row of result) {
      let dharmaName = ''
      if (row.monk_type === 'guest') {
        const guest = await prisma!.guestRegistration.findUnique({
          where: { id: row.monk_id },
          select: { dharmaName: true },
        })
        dharmaName = guest?.dharmaName || ''
      } else {
        const resident = await prisma!.resident.findUnique({
          where: { id: row.monk_id },
          select: { dharmaName: true },
        })
        dharmaName = resident?.dharmaName || ''
      }
      alerts.push({
        monkId: row.monk_id,
        monkType: row.monk_type,
        dharmaName,
        absentCount: parseInt(row.absent_count),
        lastAbsentDate: new Date(row.last_absent_date),
      })
    }
    return alerts
  },
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    if (useMock || !(await testConnection())) {
      const totalGuests = mockRegistrations.length
      const activeGuests = mockRegistrations.filter((g) => g.status === 'active').length
      const totalResidents = mockResidents.length
      const activeResidents = mockResidents.filter((r) => r.status === 'active').length
      const availableBeds = mockDormitories.filter((d) => d.status === 'available').length
      const occupiedBeds = mockDormitories.filter((d) => d.status === 'occupied').length
      const today = new Date().toDateString()
      const todayAttendances = mockAttendances.filter(
        (a) => new Date(a.date).toDateString() === today
      )
      const todayPresent = todayAttendances.filter((a) => a.status === 'present').length
      const todayAttendanceRate =
        todayAttendances.length > 0
          ? Math.round((todayPresent / todayAttendances.length) * 100)
          : 0
      const absentAlerts = (await attendanceService.getAbsentAlerts()).length

      const monthlyGuestTrend = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const count = mockRegistrations.filter((g) => {
          const regMonth = `${g.createdAt.getFullYear()}-${String(g.createdAt.getMonth() + 1).padStart(2, '0')}`
          return regMonth === monthStr
        }).length
        monthlyGuestTrend.push({ month: monthStr, count })
      }

      return {
        totalGuests,
        activeGuests,
        totalResidents,
        activeResidents,
        availableBeds,
        occupiedBeds,
        todayAttendanceRate,
        absentAlerts,
        monthlyGuestTrend,
      }
    }

    const [
      totalGuests,
      activeGuests,
      totalResidents,
      activeResidents,
      availableBeds,
      occupiedBeds,
      absentAlerts,
    ] = await Promise.all([
      prisma!.guestRegistration.count(),
      prisma!.guestRegistration.count({ where: { status: 'active' } }),
      prisma!.resident.count(),
      prisma!.resident.count({ where: { status: 'active' } }),
      prisma!.dormitory.count({ where: { status: 'available' } }),
      prisma!.dormitory.count({ where: { status: 'occupied' } }),
      attendanceService.getAbsentAlerts(),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendances = await prisma!.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    })
    const todayPresent = todayAttendances.filter((a) => a.status === 'present').length
    const todayAttendanceRate =
      todayAttendances.length > 0
        ? Math.round((todayPresent / todayAttendances.length) * 100)
        : 0

    const monthlyGuestTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const count = await prisma!.guestRegistration.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      })
      monthlyGuestTrend.push({ month: monthStr, count })
    }

    return {
      totalGuests,
      activeGuests,
      totalResidents,
      activeResidents,
      availableBeds,
      occupiedBeds,
      todayAttendanceRate,
      absentAlerts: absentAlerts.length,
      monthlyGuestTrend,
    }
  },
}

export { prisma, useMock }
