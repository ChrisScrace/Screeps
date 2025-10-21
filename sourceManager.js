

/**
 * Assigns an energy source to a creep, balancing load across available sources.
 * Stores the assigned source in creep memory.
 */
function assignSource(creep) {
    const sources = creep.room.find(FIND_SOURCES);
    if (!sources.length) {
        creep.memory.sourceId = null;
        return null;
    }

    // If the creep already has a valid source, keep it
    const existing = Game.getObjectById(creep.memory.sourceId);
    if (existing) return existing;

    // Count how many creeps are targeting each source
    const sourceUsage = {};
    for (const s of sources) sourceUsage[s.id] = 0;

    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.sourceId && sourceUsage[c.memory.sourceId] !== undefined) {
            sourceUsage[c.memory.sourceId]++;
        }
    }

    // Pick the source with the fewest assigned creeps
    const chosen = _.min(sources, s => sourceUsage[s.id] || 0);

    creep.memory.sourceId = chosen.id;
    return chosen;
}

module.exports = { assignSource };
