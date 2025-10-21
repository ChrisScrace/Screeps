/**
 * sourceManager
 * Manages tile assignment for sources and keeps track of free/occupied tiles.
 */

module.exports = {
    // ----------------------
    // Memory helper
    // ----------------------
    memory() {
        if (!Memory.sourceTiles) Memory.sourceTiles = {};
        return Memory.sourceTiles;
    },

    // ----------------------
    // Initialize a room: store all free tiles around sources
    // ----------------------
    initRoom(room) {
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].sources) Memory.rooms[room.name].sources = {};

        const sources = room.find(FIND_SOURCES);

        for (const source of sources) {
            const tiles = [];

            // Scan all tiles around the source (1 tile radius)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue; // skip source itself
                    const x = source.pos.x + dx;
                    const y = source.pos.y + dy;
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;

                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;

                    const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
                    if (hasStructure) continue;

                    tiles.push({ x, y });
                }
            }

            Memory.rooms[room.name].sources[source.id] = { tiles };
        }
    },

    // ----------------------
    // Assign a free tile next to a source for a creep
    // ----------------------
    assignTile(sourceId, creepName, roomName) {
        const mem = this.memory();
        if (!mem[roomName]) mem[roomName] = {};
        if (!mem[roomName][sourceId]) mem[roomName][sourceId] = {};

        const assignedTiles = mem[roomName][sourceId];
        const roomMem = Memory.rooms && Memory.rooms[roomName];
        const sourceData = roomMem && roomMem.sources && roomMem.sources[sourceId];

        if (!sourceData) return null;

        // Loop through all possible tiles
        for (const pos of sourceData.tiles) {
            const key = `${pos.x},${pos.y}`;
            if (!assignedTiles[key]) {
                assignedTiles[key] = creepName;
                return pos;
            }
        }

        return null; // no free tile
    },

    // ----------------------
    // Release a tile when creep dies
    // ----------------------
    releaseTile(sourceId, creepName, roomName, tile) {
        const mem = this.memory();
        if (!mem[roomName] || !mem[roomName][sourceId]) return;

        const key = `${tile.x},${tile.y}`;
        if (mem[roomName][sourceId][key] === creepName) {
            delete mem[roomName][sourceId][key];
        }
    },

    // ----------------------
    // Cleanup orphaned tiles
    // ----------------------
    cleanup() {
        const mem = this.memory();
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
