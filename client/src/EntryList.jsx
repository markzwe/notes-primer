export default function EntryList({ entries, userId }) {
    if (entries.length === 0) return <p>No entries on this board yet.</p>;
    return (
        <ul className="entries">
            {entries.map((entry) => (
                <li key={entry.id}>
                    <strong>{entry.authorId === userId ? 'You' : `Member ${entry.authorId.slice(0, 6)}`}</strong>
                    <time dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleString()}
                    </time>
                    <p>{entry.body}</p>
                    <small>Saved ID: {entry.id}</small>
                </li>
            ))}
        </ul>
    );
}