export function mergeEntries(current, incoming) {
    const byId = new Map(current.map((entry) => [entry.id, entry]));
    for (const entry of incoming) byId.set(entry.id, entry);
    return [...byId.values()].sort((a, b) => {
        const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
        return byTime || b.id.localeCompare(a.id);
    });
}