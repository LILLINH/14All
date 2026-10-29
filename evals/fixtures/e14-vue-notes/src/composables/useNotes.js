import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes'

export function useNotes() {
  const store = useNotesStore()
  const { notes } = storeToRefs(store)
  return { notes, addNote: store.addNote }
}
