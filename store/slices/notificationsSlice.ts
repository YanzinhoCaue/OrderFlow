import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: string
  read: boolean
  orderId?: string
}

interface NotificationsState {
  items: Notification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload)
      if (!action.payload.read) {
        state.unreadCount += 1
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        state.unreadCount -= 1
      }
      state.items = state.items.filter(n => n.id !== action.payload)
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    markAllAsRead: (state) => {
      state.items.forEach(n => {
        n.read = true
      })
      state.unreadCount = 0
    },

    clearNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    },

    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload
      state.unreadCount = action.payload.filter(n => !n.read).length
    },
  },
})

export const {
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setNotifications,
} = notificationsSlice.actions

// Selectors
export const selectAllNotifications = (state: RootState) => state.notifications.items
export const selectUnreadNotifications = (state: RootState) =>
  state.notifications.items.filter(n => !n.read)
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount
export const selectNotificationById = (state: RootState, id: string) =>
  state.notifications.items.find(n => n.id === id)

export default notificationsSlice.reducer
