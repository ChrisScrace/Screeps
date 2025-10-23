/**
 * sourceManager
 * Handles source data, tile assignment, and cleanup
 */
module.exports = {
    /**
     * Initialize a room's sources in Memory
     */
    initRoom(room) {
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].sources) Memory.rooms[room.name].sources = {};

        const sources = room.find(FIND_SOURCES);

        for (const source of sources) {
            if (!Memory.rooms[room.name].sources[source.id]) {
                Memory.rooms[room.name].sources[source.id] = {
                    id: source.id,
                    x: source.pos.x,
                    y: source.pos.y,
                    tiles: [],
                    assigned: {} // key: "x,y" -> creepName
                };
            }

            const sourceData = Memory.rooms[room.name].sources[source.id];

            // Recalculate tiles if missing
            if (!sourceData.tiles || sourceData.tiles.length === 0) {
                const tiles = [];
                const terrain = room.getTerrain();
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const x = source.pos.x + dx;
                        const y = source.pos.y + dy;
                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                        if (terrain.get(x, y) !== TERRAIN_MASK_WALL) tiles.push({ x, y });
                    }
                }
                sourceData.tiles = tiles;
            }
        }

        // Cleanup: remove sources that no longer exist
        for (const storedId in Memory.rooms[room.name].sources) {
            if (!sources.find(s => s.id === storedId)) {
                delete Memory.rooms[room.name].sources[storedId];
            }
        }
    },

    /**
     * Assigns a free tile next to a source for a creep
     */
    assignTile(sourceId, creepName, roomName) {
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData) return null;

        for (const tile of sourceData.tiles) {
            const key = `${tile.x},${tile.y}`;
            const assignedCreep = sourceData.assigned[key];

            // Reclaim tile if creep no longer exists
            if (assignedCreep && !Game.creeps[assignedCreep]) {
                delete sourceData.assigned[key];
            }

            if (!sourceData.assigned[key]) {
                sourceData.assigned[key] = creepName;
                return tile;
            }
        }

        return null;
    },

    /**
     * Release a tile when a creep dies
     */
    releaseTile(sourceId, creepName, roomName, tile) {
        if (!tile || typeof tile.x === 'undefined' || typeof tile.y === 'undefined') return;
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData) return;

        const key = `${tile.x},${tile.y}`;
        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
        }
    },

    /**
     * Get all tiles for a source (for construction manager)
     */
    getTilesForSource(sourceId, roomName) {
        return Memory.rooms?.[roomName]?.sources?.[sourceId]?.tiles || [];
    },

    /**
     * Cleanup invalid creep assignments
     */
    cleanupRoom(roomName) {
        const sources = Memory.rooms?.[roomName]?.sources;
        if (!sources) return;

        for (const sId in sources) {
            const sourceData = sources[sId];
            for (const key in sourceData.assigned) {
                if (!Game.creeps[sourceData.assigned[key]]) {
                    delete sourceData.assigned[key];
                }
            }
        }
    }
};
