import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([
    { id: 1, text: 'Buy milk' },
    { id: 2, text: 'Call the dentist' },
  ])
  const addNote = (text) => {
    notes.value.push({ id: notes.value.length + 1, text })
  }
  return { notes, addNote }
})
