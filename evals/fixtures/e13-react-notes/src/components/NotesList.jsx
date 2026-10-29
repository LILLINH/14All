import { useNotes } from '../notes/useNotes'

export default function NotesList() {
  const { notes } = useNotes()
  return (
    <ul>
      {notes.map((note) => (
        <li key={note.id}>{note.text}</li>
      ))}
    </ul>
  )
}
