// This component receives a list of notes and a delete handler from its parent.
// It renders each note as a list item with a button to remove it.
export default function NotesList({ notes, onDelete }) {
    return (
        <ul>
            {notes.map((note) => (
                <li key={note.id}>
                    <p>{note.text}</p>
                    <button onClick={() => onDelete(note.id)}>Delete</button>
                </li>
            ))}
        </ul>
    );
}