module.exports = {
    /**
     * Initialize sources in the room memory
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
                    tiles: this.getWalkableTiles(source, room),
                    assigned: {} // tileKey => creepName
                };
            }
        }
    },

    /**
     * Get all walkable tiles around a source
     */
    getWalkableTiles(source, room) {
        const tiles = [];
        const terrain = room.getTerrain();
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = source.pos.x + dx;
                const y = source.pos.y + dy;
                if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    },

    /**
     * Assign a free tile to a creep
     */
    assignTile(sourceId, creepName, roomName) {
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData) return null;

        for (const tile of sourceData.tiles) {
            const key = `${tile.x},${tile.y}`;
            const occupant = sourceData.assigned[key];

            // Reclaim if creep no longer exists
            if (occupant && !Game.creeps[occupant]) {
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
     * Release a tile when creep dies
     */
    releaseTile(sourceId, creepName, roomName) {
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData) return;

        for (const key in sourceData.assigned) {
            if (sourceData.assigned[key] === creepName) {
                delete sourceData.assigned[key];
            }
        }
    },

    /**
     * Cleanup dead creep assignments
     */
    cleanupRoom(roomName) {
        const roomData = Memory.rooms?.[roomName];
        if (!roomData?.sources) return;

        for (const sourceId in roomData.sources) {
            const sourceData = roomData.sources[sourceId];
            for (const key in sourceData.assigned) {
                const creepName = sourceData.assigned[key];
                if (!Game.creeps[creepName]) {
                    delete sourceData.assigned[key];
                }
            }
        }
        console.log(`🧹 Cleaned dead source assignments in ${roomName}`);
    }
};
