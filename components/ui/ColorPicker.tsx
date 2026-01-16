'use client'

import { useState, useRef, useEffect } from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, v: 100 }

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = max === 0 ? 0 : delta / max
  let v = max

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6)
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2)
    } else {
      h = 60 * ((r - g) / delta + 4)
    }
  }

  if (h < 0) h += 360

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

function hsvToHex(h: number, s: number, v: number): string {
  s = s / 100
  v = v / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  const red = Math.round((r + m) * 255)
  const green = Math.round((g + m) * 255)
  const blue = Math.round((b + m) * 255)

  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`.toUpperCase()
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hsv, setHsv] = useState(hexToHsv(color))
  const gradientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newHsv = hexToHsv(color)
    setHsv(newHsv)
  }, [color])

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = gradientRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newHsv = {
      ...hsv,
      s: Math.max(0, Math.min(100, x)),
      v: Math.max(0, Math.min(100, 100 - y)),
    }

    setHsv(newHsv)
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v))
  }

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHsv = { ...hsv, h: parseInt(e.target.value) }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v))
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.replace('#', '')
    if (/^[0-9A-F]{6}$/i.test(hex)) {
      const newHsv = hexToHsv('#' + hex)
      setHsv(newHsv)
      onChange('#' + hex)
    }
  }

  const hueColor = hsvToHex(hsv.h, 100, 100)
  const currentColor = hsvToHex(hsv.h, hsv.s, hsv.v)

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-stone-300 dark:border-stone-600">
      {/* Gradient Picker */}
      <div
        ref={gradientRef}
        onClick={handleGradientClick}
        className="relative w-full h-48 rounded-lg cursor-crosshair border border-stone-300 dark:border-stone-600 overflow-hidden"
        style={{
          background: `linear-gradient(to right, rgb(255,255,255), ${hueColor}), linear-gradient(to bottom, transparent, rgb(0,0,0))`,
          backgroundBlendMode: 'multiply',
        }}
      >
        {/* Cursor */}
        <div
          className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px black, 0 0 8px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Hue Slider */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Matiz</label>
        <input
          type="range"
          min="0"
          max="360"
          value={hsv.h}
          onChange={handleHueChange}
          className="w-full h-3 rounded-lg appearance-none bg-gradient-to-r"
          style={{
            backgroundImage: `linear-gradient(to right, 
              hsl(0,100%,50%), 
              hsl(60,100%,50%), 
              hsl(120,100%,50%), 
              hsl(180,100%,50%), 
              hsl(240,100%,50%), 
              hsl(300,100%,50%), 
              hsl(360,100%,50%))`,
          }}
        />
      </div>

      {/* Hex Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-2">Código Hex</label>
          <input
            type="text"
            value={currentColor}
            onChange={handleHexChange}
            maxLength={7}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white font-mono text-sm placeholder-stone-500 uppercase"
          />
        </div>
        <div
          className="w-12 h-10 rounded-lg border-2 border-stone-300 dark:border-stone-600"
          style={{ backgroundColor: currentColor }}
        />
      </div>

      {/* HSV Values */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-stone-100 dark:bg-slate-800 p-2 rounded text-center">
          <div className="font-medium text-stone-700 dark:text-stone-300">H</div>
          <div className="text-stone-600 dark:text-stone-400 font-mono">{hsv.h}°</div>
        </div>
        <div className="bg-stone-100 dark:bg-slate-800 p-2 rounded text-center">
          <div className="font-medium text-stone-700 dark:text-stone-300">S</div>
          <div className="text-stone-600 dark:text-stone-400 font-mono">{hsv.s}%</div>
        </div>
        <div className="bg-stone-100 dark:bg-slate-800 p-2 rounded text-center">
          <div className="font-medium text-stone-700 dark:text-stone-300">V</div>
          <div className="text-stone-600 dark:text-stone-400 font-mono">{hsv.v}%</div>
        </div>
      </div>
    </div>
  )
}
