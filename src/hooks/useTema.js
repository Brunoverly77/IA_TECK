import { useEffect, useState } from 'react'

export function useTema() {
  const [escuro, setEscuro] = useState(() => localStorage.getItem('tema') === 'escuro')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light')
    localStorage.setItem('tema', escuro ? 'escuro' : 'claro')
  }, [escuro])

  return [escuro, setEscuro]
}
