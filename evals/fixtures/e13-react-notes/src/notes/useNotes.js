import { useContext } from 'react'
import { NotesContext } from './NotesContext'

export function useNotes() {
  const value = useContext(NotesContext)
  if (!value) throw new Error('useNotes must be used inside NotesProvider')
  return value
}
