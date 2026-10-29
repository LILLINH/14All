import { createContext, useState } from 'react'

export const NotesContext = createContext(null)

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([
    { id: 1, text: 'Buy milk' },
    { id: 2, text: 'Call the dentist' },
  ])
  const addNote = (text) => setNotes((current) => [...current, { id: current.length + 1, text }])
  return <NotesContext.Provider value={{ notes, addNote }}>{children}</NotesContext.Provider>
}
