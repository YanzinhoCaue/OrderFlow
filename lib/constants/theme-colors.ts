export const THEME_COLORS = [
  { name: 'Red', value: '#FF6B6B', key: 'red' },
  { name: 'Orange', value: '#FF8B3D', key: 'orange' },
  { name: 'Yellow', value: '#FFD93D', key: 'yellow' },
  { name: 'Green', value: '#6BCF7F', key: 'green' },
  { name: 'Teal', value: '#4FD1C5', key: 'teal' },
  { name: 'Blue', value: '#4299E1', key: 'blue' },
  { name: 'Indigo', value: '#667EEA', key: 'indigo' },
  { name: 'Purple', value: '#9F7AEA', key: 'purple' },
  { name: 'Pink', value: '#ED64A6', key: 'pink' },
  { name: 'Rose', value: '#F56565', key: 'rose' },
] as const

export type ThemeColorKey = typeof THEME_COLORS[number]['key']
