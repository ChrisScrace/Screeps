/**
 * sourceManager
 * Handles source data, tile assignment, and cleanup
 */
module.exports = {
    /**
     * Initialize a room's sources in Memory
     */
    initRoom: function (room) {
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].sources) Memory.rooms[room.name].sources = {};

        const sources = room.find(FIND_SOURCES);

        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];

            if (!Memory.rooms[room.name].sources[source.id]) {
                Memory.rooms[room.name].sources[source.id] = {
                    id: source.id,
                    x: source.pos.x,
                    y: source.pos.y,
                    tiles: [],
                    assigned: {} // key: "x,y", value: creepName
                };
            }

            const sourceData = Memory.rooms[room.name].sources[source.id];

            // Recalculate tiles if missing
            if (!sourceData.tiles || sourceData.tiles.length === 0) {
                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const x = source.pos.x + dx;
                        const y = source.pos.y + dy;
                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                        const terrain = room.getTerrain().get(x, y);
                        if (terrain !== TERRAIN_MASK_WALL) {
                            tiles.push({ x: x, y: y });
                        }
                    }
                }
                sourceData.tiles = tiles;
            }
        }

        // Cleanup: remove sources that no longer exist
        for (const storedId in Memory.rooms[room.name].sources) {
            let found = false;
            for (let i = 0; i < sources.length; i++) {
                if (sources[i].id === storedId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                delete Memory.rooms[room.name].sources[storedId];
            }
        }
    },

    /**
     * Assign a free tile next to a source for a creep
     * Returns {x, y} or null if no tile available
     */
    assignTile: function (sourceId, creepName, roomName) {
        if (!Memory.rooms) return null;
        if (!Memory.rooms[roomName]) return null;
        if (!Memory.rooms[roomName].sources) return null;
        if (!Memory.rooms[roomName].sources[sourceId]) return null;

        const sourceData = Memory.rooms[roomName].sources[sourceId];

        for (let i = 0; i < sourceData.tiles.length; i++) {
            const tile = sourceData.tiles[i];
            const key = tile.x + ',' + tile.y;
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

        return null; // no free tile
    },

    /**
     * Release a tile when a creep dies
     */
    releaseTile: function (sourceId, creepName, roomName, tile) {
        if (!Memory.rooms) return;
        if (!Memory.rooms[roomName]) return;
        if (!Memory.rooms[roomName].sources) return;
        if (!Memory.rooms[roomName].sources[sourceId]) return;
        if (!tile || typeof tile.x === 'undefined' || typeof tile.y === 'undefined') {
            console.log('⚠️ releaseTile: invalid or missing tile for', creepName);
            return;
        }

        const key = tile.x + ',' + tile.y;
        const sourceData = Memory.rooms[roomName].sources[sourceId];

        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
            console.log('✅ Released tile', key, 'for', creepName);
        }
    },

    /**
     * Get all tiles for a source
     */
    getTilesForSource: function (sourceId, roomName) {
        if (!Memory.rooms) return [];
        if (!Memory.rooms[roomName]) return [];
        if (!Memory.rooms[roomName].sources) return [];
        if (!Memory.rooms[roomName].sources[sourceId]) return [];

        return Memory.rooms[roomName].sources[sourceId].tiles;
    },

    /**
     * Cleanup invalid creep assignments
     */
    cleanupRoom: function (roomName) {
        if (!Memory.rooms) return;
        if (!Memory.rooms[roomName]) return;
        if (!Memory.rooms[roomName].sources) return;

        const sources = Memory.rooms[roomName].sources;
        for (const sId in sources) {
            const sourceData = sources[sId];
            for (const key in sourceData.assigned) {
                const creepName = sourceData.assigned[key];
                if (!Game.creeps[creepName]) {
                    delete sourceData.assigned[key];
                }
            }
        }
        console.log('🧹 Cleaned source assignments in', roomName);
    }
};
