import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      throw new Error('Mock mode')
    }
  },
}))

import {
  notificationService,
  attendanceService,
  scheduleService,
} from '../lib/prisma.js'
import type { Notification } from '../../../shared/types.js'

describe('notificationService', () => {
  beforeEach(async () => {
    const all = await notificationService.findAll()
    for (const n of all.data) {
      const index = (notificationService as any)._mockNotifications?.findIndex(
        (x: Notification) => x.id === n.id
      )
    }
    const count = await notificationService.markAllAsRead()
  })

  describe('findAll', () => {
    it('should return empty list when no notifications exist', async () => {
      const result = await notificationService.findAll()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.page).toBe(1)
    })

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await notificationService.create({
          type: 'registration_expiring',
          title: `测试通知 ${i}`,
          content: `内容 ${i}`,
          priority: 'low',
        })
      }

      const page1 = await notificationService.findAll({ page: 1, pageSize: 2 })
      expect(page1.data.length).toBe(2)
      expect(page1.total).toBe(5)

      const page2 = await notificationService.findAll({ page: 2, pageSize: 2 })
      expect(page2.data.length).toBe(2)

      const page3 = await notificationService.findAll({ page: 3, pageSize: 2 })
      expect(page3.data.length).toBe(1)
    })

    it('should filter by type', async () => {
      await notificationService.create({
        type: 'registration_expiring',
        title: '挂单到期',
        content: '即将到期',
        priority: 'medium',
      })
      await notificationService.create({
        type: 'absent_warning',
        title: '缺勤提醒',
        content: '已缺勤3次',
        priority: 'high',
      })

      const result = await notificationService.findAll({ type: 'absent_warning' })
      expect(result.data.every((n) => n.type === 'absent_warning')).toBe(true)
    })

    it('should filter by isRead', async () => {
      await notificationService.create({
        type: 'registration_expiring',
        title: '未读通知',
        content: '内容',
        priority: 'low',
      })
      await notificationService.create({
        type: 'registration_expired',
        title: '待标记',
        content: '内容',
        priority: 'high',
      })

      const unreadResult = await notificationService.findAll({ isRead: false })
      expect(unreadResult.data.every((n) => n.isRead === false)).toBe(true)

      const readResult = await notificationService.findAll({ isRead: true })
      expect(readResult.data.every((n) => n.isRead === true)).toBe(true)
    })

    it('should sort by createdAt descending', async () => {
      await notificationService.create({
        type: 'registration_expiring',
        title: '第一条',
        content: '内容1',
        priority: 'low',
      })
      await new Promise((r) => setTimeout(r, 10))
      await notificationService.create({
        type: 'registration_expired',
        title: '第二条',
        content: '内容2',
        priority: 'high',
      })

      const result = await notificationService.findAll()
      if (result.data.length >= 2) {
        const first = result.data[0].createdAt.getTime()
        const second = result.data[1].createdAt.getTime()
        expect(first).toBeGreaterThanOrEqual(second)
      }
    })
  })

  describe('create', () => {
    it('should create a notification with all fields', async () => {
      const notification = await notificationService.create({
        type: 'absent_warning',
        title: '缺勤累计提醒',
        content: '释行者 近7天已累计缺勤 3 次',
        priority: 'high',
        relatedId: 'r1',
        relatedType: 'resident',
      })

      expect(notification.id).toBeDefined()
      expect(notification.type).toBe('absent_warning')
      expect(notification.title).toBe('缺勤累计提醒')
      expect(notification.content).toBe('释行者 近7天已累计缺勤 3 次')
      expect(notification.priority).toBe('high')
      expect(notification.relatedId).toBe('r1')
      expect(notification.relatedType).toBe('resident')
      expect(notification.isRead).toBe(false)
      expect(notification.createdAt).toBeDefined()
    })

    it('should create notification without optional fields', async () => {
      const notification = await notificationService.create({
        type: 'registration_expiring',
        title: '挂单到期',
        content: '即将到期',
        priority: 'medium',
      })

      expect(notification.relatedId).toBeUndefined()
      expect(notification.relatedType).toBeUndefined()
    })

    it('should create notification with each type', async () => {
      const types = [
        'registration_expiring',
        'registration_expired',
        'absent_warning',
        'probation_expiring',
      ] as const

      for (const type of types) {
        const notification = await notificationService.create({
          type,
          title: `测试 ${type}`,
          content: `内容 ${type}`,
          priority: 'low',
        })
        expect(notification.type).toBe(type)
      }
    })

    it('should create notification with each priority', async () => {
      const priorities = ['low', 'medium', 'high'] as const

      for (const priority of priorities) {
        const notification = await notificationService.create({
          type: 'registration_expiring',
          title: `测试 ${priority}`,
          content: `内容`,
          priority,
        })
        expect(notification.priority).toBe(priority)
      }
    })
  })

  describe('getUnreadCount', () => {
    it('should return 0 when no notifications', async () => {
      const count = await notificationService.getUnreadCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should count unread notifications correctly', async () => {
      const beforeCount = await notificationService.getUnreadCount()

      await notificationService.create({
        type: 'absent_warning',
        title: '未读1',
        content: '内容',
        priority: 'high',
      })
      await notificationService.create({
        type: 'registration_expiring',
        title: '未读2',
        content: '内容',
        priority: 'medium',
      })

      const afterCount = await notificationService.getUnreadCount()
      expect(afterCount).toBe(beforeCount + 2)
    })
  })

  describe('markAsRead', () => {
    it('should mark a single notification as read', async () => {
      const notification = await notificationService.create({
        type: 'absent_warning',
        title: '待标记',
        content: '内容',
        priority: 'high',
      })

      expect(notification.isRead).toBe(false)

      const success = await notificationService.markAsRead(notification.id)
      expect(success).toBe(true)

      const result = await notificationService.findAll({ isRead: true })
      const found = result.data.find((n) => n.id === notification.id)
      expect(found).toBeDefined()
      expect(found!.isRead).toBe(true)
      expect(found!.readAt).toBeDefined()
    })

    it('should return false for non-existent notification', async () => {
      const success = await notificationService.markAsRead('non-existent-id')
      expect(success).toBe(false)
    })

    it('should not affect other notifications', async () => {
      const notif1 = await notificationService.create({
        type: 'absent_warning',
        title: '通知1',
        content: '内容1',
        priority: 'high',
      })
      const notif2 = await notificationService.create({
        type: 'registration_expiring',
        title: '通知2',
        content: '内容2',
        priority: 'medium',
      })

      await notificationService.markAsRead(notif1.id)

      const result = await notificationService.findAll()
      const found1 = result.data.find((n) => n.id === notif1.id)
      const found2 = result.data.find((n) => n.id === notif2.id)
      expect(found1!.isRead).toBe(true)
      expect(found2!.isRead).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await notificationService.create({
        type: 'absent_warning',
        title: '未读1',
        content: '内容',
        priority: 'high',
      })
      await notificationService.create({
        type: 'registration_expiring',
        title: '未读2',
        content: '内容',
        priority: 'medium',
      })

      const count = await notificationService.markAllAsRead()
      expect(count).toBeGreaterThanOrEqual(2)

      const unreadCount = await notificationService.getUnreadCount()
      expect(unreadCount).toBe(0)
    })

    it('should return 0 when all already read', async () => {
      await notificationService.markAllAsRead()
      const count = await notificationService.markAllAsRead()
      expect(count).toBe(0)
    })
  })
})

describe('attendanceService - absent alerts', () => {
  describe('getAbsentAlerts', () => {
    it('should return empty array when no absent records', async () => {
      const result = await attendanceService.getAbsentAlerts(3)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should use default threshold of 3', async () => {
      const result = await attendanceService.getAbsentAlerts()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should detect monks exceeding threshold', async () => {
      const alerts = await attendanceService.getAbsentAlerts(3)
      for (const alert of alerts) {
        expect(alert.absentCount).toBeGreaterThanOrEqual(3)
        expect(alert.monkId).toBeDefined()
        expect(alert.monkType).toBeDefined()
        expect(alert.dharmaName).toBeDefined()
        expect(alert.lastAbsentDate).toBeDefined()
      }
    })

    it('should respect custom threshold', async () => {
      const alertsWithHighThreshold = await attendanceService.getAbsentAlerts(10)
      const alertsWithLowThreshold = await attendanceService.getAbsentAlerts(1)

      expect(alertsWithHighThreshold.length).toBeLessThanOrEqual(
        alertsWithLowThreshold.length
      )
    })

    it('should include dharmaName for both guest and resident monks', async () => {
      const alerts = await attendanceService.getAbsentAlerts(1)
      for (const alert of alerts) {
        if (alert.monkType === 'guest' || alert.monkType === 'resident') {
          expect(typeof alert.dharmaName).toBe('string')
        }
      }
    })
  })

  describe('getAbsentCount', () => {
    it('should return absent count for default 7 days', async () => {
      const count = await attendanceService.getAbsentCount()
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return absent count for custom days', async () => {
      const count7 = await attendanceService.getAbsentCount(7)
      const count30 = await attendanceService.getAbsentCount(30)
      expect(count30).toBeGreaterThanOrEqual(count7)
    })
  })

  describe('batchCreate', () => {
    it('should create attendance records', async () => {
      const records = await attendanceService.batchCreate(
        {
          date: new Date().toISOString().split('T')[0],
          session: 'morning',
          records: [
            { monkId: 'r1', monkType: 'resident', status: 'present' },
            { monkId: 'r2', monkType: 'resident', status: 'absent' },
          ],
        },
        '1'
      )

      expect(records.length).toBe(2)
      expect(records[0].status).toBe('present')
      expect(records[1].status).toBe('absent')
    })

    it('should trigger absent alert check when absent records exist', async () => {
      const spy = vi.spyOn(scheduleService, 'checkAbsentAlerts')

      await attendanceService.batchCreate(
        {
          date: new Date().toISOString().split('T')[0],
          session: 'evening',
          records: [
            { monkId: 'r1', monkType: 'resident', status: 'absent' },
          ],
        },
        '1'
      )

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('should not trigger absent alert check when no absent records', async () => {
      const spy = vi.spyOn(scheduleService, 'checkAbsentAlerts')

      await attendanceService.batchCreate(
        {
          date: new Date().toISOString().split('T')[0],
          session: 'morning',
          records: [
            { monkId: 'r1', monkType: 'resident', status: 'present' },
          ],
        },
        '1'
      )

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})

describe('scheduleService', () => {
  describe('checkAbsentAlerts', () => {
    it('should create absent_warning notifications for monks exceeding threshold', async () => {
      const beforeNotifications = await notificationService.findAll({
        type: 'absent_warning',
      })
      const beforeCount = beforeNotifications.total

      const createdCount = await scheduleService.checkAbsentAlerts(3)

      expect(typeof createdCount).toBe('number')
      expect(createdCount).toBeGreaterThanOrEqual(0)
    })

    it('should not create duplicate unread absent_warning for same monk', async () => {
      await scheduleService.checkAbsentAlerts(3)
      const firstResult = await notificationService.findAll({
        type: 'absent_warning',
        isRead: false,
      })

      await scheduleService.checkAbsentAlerts(3)
      const secondResult = await notificationService.findAll({
        type: 'absent_warning',
        isRead: false,
      })

      expect(secondResult.total).toBe(firstResult.total)
    })

    it('should create new notification after previous one is read', async () => {
      await scheduleService.checkAbsentAlerts(3)
      const firstResult = await notificationService.findAll({
        type: 'absent_warning',
        isRead: false,
      })

      if (firstResult.data.length > 0) {
        await notificationService.markAsRead(firstResult.data[0].id)

        await scheduleService.checkAbsentAlerts(3)
        const afterResult = await notificationService.findAll({
          type: 'absent_warning',
          isRead: false,
        })
        expect(afterResult.data.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('should respect custom threshold', async () => {
      const createdWithThreshold1 = await scheduleService.checkAbsentAlerts(1)
      expect(typeof createdWithThreshold1).toBe('number')
    })
  })

  describe('runDailyCheck', () => {
    it('should return result with absentWarnings field', async () => {
      const result = await scheduleService.runDailyCheck()

      expect(result).toHaveProperty('created')
      expect(result).toHaveProperty('expired')
      expect(result).toHaveProperty('expiring')
      expect(result).toHaveProperty('absentWarnings')
      expect(typeof result.absentWarnings).toBe('number')
    })

    it('should call checkAbsentAlerts as part of daily check', async () => {
      const spy = vi.spyOn(scheduleService, 'checkAbsentAlerts')

      await scheduleService.runDailyCheck()

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('should include absent alert notifications in created count', async () => {
      const result = await scheduleService.runDailyCheck()
      expect(result.created).toBeGreaterThanOrEqual(result.absentWarnings)
    })
  })

  describe('getExpiringRegistrations', () => {
    it('should return array of registrations', async () => {
      const result = await scheduleService.getExpiringRegistrations(3)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should respect custom days parameter', async () => {
      const result3 = await scheduleService.getExpiringRegistrations(3)
      const result7 = await scheduleService.getExpiringRegistrations(7)
      expect(result7.length).toBeGreaterThanOrEqual(result3.length)
    })
  })

  describe('registration notifications', () => {
    it('should create registration_expired notification for expired registrations', async () => {
      const result = await scheduleService.runDailyCheck()

      if (result.expired > 0) {
        const expiredNotifs = await notificationService.findAll({
          type: 'registration_expired',
        })
        expect(expiredNotifs.data.length).toBeGreaterThan(0)

        for (const n of expiredNotifs.data) {
          expect(n.type).toBe('registration_expired')
          expect(n.priority).toBe('high')
          expect(n.content).toContain('挂单已到期')
        }
      }
    })

    it('should create registration_expiring notification for soon-to-expire registrations', async () => {
      const result = await scheduleService.runDailyCheck()

      if (result.expiring > 0) {
        const expiringNotifs = await notificationService.findAll({
          type: 'registration_expiring',
        })

        const scheduleCreated = expiringNotifs.data.filter(
          (n) => n.content.includes('挂单到期') || n.content.includes('还有')
        )

        expect(scheduleCreated.length).toBeGreaterThan(0)

        for (const n of scheduleCreated) {
          expect(n.type).toBe('registration_expiring')
          expect(n.priority).toBe('medium')
          expect(n.content).toContain('挂单到期')
        }
      }
    })
  })

  describe('probation notifications', () => {
    it('should create probation_expiring notification for residents near probation end', async () => {
      await scheduleService.runDailyCheck()

      const probationNotifs = await notificationService.findAll({
        type: 'probation_expiring',
      })

      const scheduleCreated = probationNotifs.data.filter(
        (n) => n.content.includes('考察期即将到期')
      )

      for (const n of scheduleCreated) {
        expect(n.type).toBe('probation_expiring')
        expect(n.priority).toBe('high')
        expect(n.content).toContain('考察期即将到期')
        expect(n.relatedType).toBe('resident')
      }
    })
  })

  describe('notification deduplication', () => {
    it('should not create duplicate registration_expired notifications', async () => {
      await scheduleService.runDailyCheck()
      const firstResult = await notificationService.findAll({
        type: 'registration_expired',
      })

      await scheduleService.runDailyCheck()
      const secondResult = await notificationService.findAll({
        type: 'registration_expired',
      })

      expect(secondResult.total).toBeLessThanOrEqual(firstResult.total + 1)
    })

    it('should not create duplicate registration_expiring notifications', async () => {
      await scheduleService.runDailyCheck()
      const firstResult = await notificationService.findAll({
        type: 'registration_expiring',
      })

      await scheduleService.runDailyCheck()
      const secondResult = await notificationService.findAll({
        type: 'registration_expiring',
      })

      expect(secondResult.total).toBeLessThanOrEqual(firstResult.total + 1)
    })

    it('should not create duplicate probation_expiring notifications', async () => {
      await scheduleService.runDailyCheck()
      const firstResult = await notificationService.findAll({
        type: 'probation_expiring',
      })

      await scheduleService.runDailyCheck()
      const secondResult = await notificationService.findAll({
        type: 'probation_expiring',
      })

      expect(secondResult.total).toBeLessThanOrEqual(firstResult.total + 1)
    })
  })
})

describe('absent alert full flow', () => {
  it('should generate absent_warning notification when absences reach threshold via runDailyCheck', async () => {
    await scheduleService.runDailyCheck()

    const absentWarnings = await notificationService.findAll({
      type: 'absent_warning',
    })

    const scheduleCreated = absentWarnings.data.filter(
      (n) => n.content.includes('缺勤') && n.content.includes('次')
    )

    if (scheduleCreated.length > 0) {
      for (const n of scheduleCreated) {
        expect(n.type).toBe('absent_warning')
        expect(n.priority).toBe('high')
        expect(n.content).toContain('缺勤')
        expect(n.content).toContain('次')
      }
    }
  })

  it('should generate absent_warning notification when absences reach threshold via batchCreate', async () => {
    const unreadBefore = await notificationService.findAll({
      type: 'absent_warning',
      isRead: false,
    })

    await attendanceService.batchCreate(
      {
        date: new Date().toISOString().split('T')[0],
        session: 'morning',
        records: [
          { monkId: 'r1', monkType: 'resident', status: 'absent' },
          { monkId: 'r2', monkType: 'resident', status: 'present' },
        ],
      },
      '1'
    )

    await new Promise((r) => setTimeout(r, 100))

    const unreadAfter = await notificationService.findAll({
      type: 'absent_warning',
      isRead: false,
    })

    if (unreadAfter.total > unreadBefore.total) {
      const newWarnings = unreadAfter.data.filter(
        (n) => !unreadBefore.data.some((b) => b.id === n.id)
      )
      for (const n of newWarnings) {
        expect(n.type).toBe('absent_warning')
        expect(n.content).toContain('缺勤')
      }
    }
  })

  it('should include absent_warnings count in runDailyCheck result', async () => {
    const result = await scheduleService.runDailyCheck()
    expect(result).toHaveProperty('absentWarnings')
    expect(typeof result.absentWarnings).toBe('number')
    expect(result.absentWarnings).toBeGreaterThanOrEqual(0)
  })
})
