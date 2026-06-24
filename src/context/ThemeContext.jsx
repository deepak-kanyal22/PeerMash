import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme] = useState('dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('dark')
    root.classList.remove('light')
  }, [])

  const toggleTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
