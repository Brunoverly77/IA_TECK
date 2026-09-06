import { useEffect, useState } from 'react'

// navegadores com cookies/armazenamento bloqueado lancam excecao ao acessar o
// localStorage, entao o tema nunca pode derrubar o app por causa disso
const lerTemaSalvo = () => {
  try {
    return localStorage.getItem('tema') === 'escuro'
  } catch {
    return false
  }
}

const salvarTema = (escuro) => {
  try {
    localStorage.setItem('tema', escuro ? 'escuro' : 'claro')
  } catch {
    // sem persistencia: o tema vale so para esta sessao
  }
}

export function useTema() {
  const [escuro, setEscuro] = useState(lerTemaSalvo)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light')
    salvarTema(escuro)
  }, [escuro])

  return [escuro, setEscuro]
}
