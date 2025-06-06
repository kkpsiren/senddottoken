'use client'
import { useEffect, useState } from 'react'

export const ThemeToggle = () => {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'dark') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !dark
    setDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      window.localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      window.localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
