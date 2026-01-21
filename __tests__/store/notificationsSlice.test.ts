import notificationsReducer, {
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  selectAllNotifications,
  selectUnreadNotifications,
  selectUnreadCount,
} from '@/store/slices/notificationsSlice'
import { configureStore } from '@reduxjs/toolkit'
import type { Notification } from '@/store/slices/notificationsSlice'

describe('notificationsSlice', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'info',
    message: 'Test notification',
    timestamp: '2024-01-01T00:00:00Z',
    read: false,
  }

  const initialState = {
    items: [],
    unreadCount: 0,
  }

  it('should handle addNotification', () => {
    const state = notificationsReducer(initialState, addNotification(mockNotification))
    expect(state.items).toHaveLength(1)
    expect(state.unreadCount).toBe(1)
  })

  it('should add notification at the beginning', () => {
    let state = notificationsReducer(initialState, addNotification(mockNotification))
    const newNotif = { ...mockNotification, id: 'notif-2', message: 'Second' }
    state = notificationsReducer(state, addNotification(newNotif))
    
    expect(state.items[0].id).toBe('notif-2')
    expect(state.items[1].id).toBe('notif-1')
  })

  it('should handle removeNotification', () => {
    let state = notificationsReducer(initialState, addNotification(mockNotification))
    state = notificationsReducer(state, removeNotification('notif-1'))
    
    expect(state.items).toHaveLength(0)
    expect(state.unreadCount).toBe(0)
  })

  it('should handle markAsRead', () => {
    let state = notificationsReducer(initialState, addNotification(mockNotification))
    expect(state.unreadCount).toBe(1)
    
    state = notificationsReducer(state, markAsRead('notif-1'))
    expect(state.items[0].read).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('should handle markAllAsRead', () => {
    let state = notificationsReducer(initialState, addNotification(mockNotification))
    const notif2 = { ...mockNotification, id: 'notif-2' }
    state = notificationsReducer(state, addNotification(notif2))
    
    expect(state.unreadCount).toBe(2)
    state = notificationsReducer(state, markAllAsRead())
    
    expect(state.items.every(n => n.read)).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('should handle clearNotifications', () => {
    let state = notificationsReducer(initialState, addNotification(mockNotification))
    state = notificationsReducer(state, clearNotifications())
    
    expect(state.items).toHaveLength(0)
    expect(state.unreadCount).toBe(0)
  })

  it('should use selectors correctly', () => {
    const store = configureStore({
      reducer: {
        notifications: notificationsReducer,
      },
    })

    store.dispatch(addNotification(mockNotification))
    const notif2 = { ...mockNotification, id: 'notif-2', read: true }
    store.dispatch(addNotification(notif2))
    
    const state = store.getState()
    expect(selectAllNotifications(state)).toHaveLength(2)
    expect(selectUnreadNotifications(state)).toHaveLength(1)
    expect(selectUnreadCount(state)).toBe(1)
  })
})
