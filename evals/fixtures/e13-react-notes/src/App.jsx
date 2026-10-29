import { NotesProvider } from './notes/NotesContext'
import Header from './components/Header'
import NotesList from './components/NotesList'

export default function App() {
  return (
    <NotesProvider>
      <Header />
      <NotesList />
    </NotesProvider>
  )
}
