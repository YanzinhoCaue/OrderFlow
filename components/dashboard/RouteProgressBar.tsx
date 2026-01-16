'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RouteProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout

    const startProgress = () => {
      setIsVisible(true)
      setProgress(10)

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 30
        })
      }, 200)
    }

    const completeProgress = () => {
      setProgress(100)
      setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 500)
    }

    // Override router methods
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = function (...args: any[]) {
      startProgress()
      clearInterval(interval)
      completeProgress()
      return originalPush.apply(router, args)
    }

    router.replace = function (...args: any[]) {
      startProgress()
      clearInterval(interval)
      completeProgress()
      return originalReplace.apply(router, args)
    }

    return () => {
      clearInterval(interval)
    }
  }, [router])

  return (
    <>
      {isVisible && (
        <div className="h-1 bg-stone-200/30 dark:bg-stone-700/30 rounded-full overflow-hidden w-full">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 transition-all duration-300 ease-out rounded-full"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}
    </>
  )
}

