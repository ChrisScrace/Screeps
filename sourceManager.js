/**
 * sourceManager
 * Tracks free/occupied tiles around each source in each room
 */

const memory = () => {
    if (!Memory.sourceTiles) Memory.sourceTiles = {};
    return Memory.sourceTiles;
};

module.exports = {
    /**
     * Assign a free tile to a creep next to a source
     * @param {string} sourceId 
     * @param {string} creepName
     * @param {string} roomName
     * @returns {object|null} tile {x, y} or null if none available
     */
    assignTile(sourceId, creepName, roomName) {
        const mem = memory();
        if (!mem[roomName]) mem[roomName] = {};
        if (!mem[roomName][sourceId]) mem[roomName][sourceId] = {};

        const assignedTiles = mem[roomName][sourceId];

        const source = Game.getObjectById(sourceId);
        if (!source) return null;

        // Scan all tiles around source (1 tile radius)
        const positions = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // skip the source tile itself
                const x = source.pos.x + dx;
                const y = source.pos.y + dy;
                if (x < 0 || x > 49 || y < 0 || y > 49) continue;

                const terrain = source.room.getTerrain().get(x, y);
                if (terrain === TERRAIN_MASK_WALL) continue;

                const hasStructure = source.room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
                if (hasStructure) continue;

                positions.push({ x, y });
            }
        }

        // Find a free tile
        for (const pos of positions) {
            const key = `${pos.x},${pos.y}`;
            if (!assignedTiles[key]) {
                assignedTiles[key] = creepName;
                return pos;
            }
        }

        // No free tile found
        return null;
    },

    /**
     * Release a tile when creep dies or is reassigned
     * @param {string} sourceId 
     * @param {string} creepName 
     * @param {string} roomName 
     * @param {object} tile {x, y}
     */
    releaseTile(sourceId, creepName, roomName, tile) {
        const mem = memory();
        if (!mem[roomName] || !mem[roomName][sourceId]) return;

        const key = `${tile.x},${tile.y}`;
        if (mem[roomName][sourceId][key] === creepName) {
            delete mem[roomName][sourceId][key];
        }
    },

    /**
     * Optional: clean up invalid assignments (e.g., creep died without calling onDeath)
     */
    cleanup() {
        const mem = memory();
        for (const roomName in mem) {
            for (const sourceId in mem[roomName]) {
                for (const key in mem[roomName][sourceId]) {
                    const creepName = mem[roomName][sourceId][key];
                    if (!Game.creeps[creepName]) {
                        delete mem[roomName][sourceId][key];
                    }
                }
            }
        }
    }
};
