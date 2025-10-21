module.exports = {
    /**
     * Initializes or refreshes the source data for a room.
     * Safe to call every tick — it only rebuilds if needed.
     */
    initRoom(room) {

        if (Memory.rooms[room.name].sourceTiles) {
            delete Memory.rooms[room.name].sourceTiles;
        }


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
                    assigned: {}
                };
            }

            const sourceData = Memory.rooms[room.name].sources[source.id];

            // Recalculate tiles if missing or incomplete
            if (!sourceData.tiles || sourceData.tiles.length === 0) {
                sourceData.tiles = this._calculateTiles(room, source);
            }
        }

        // Cleanup: remove old sources from memory
        for (const storedId in Memory.rooms[room.name].sources) {
            if (!sources.find(s => s.id === storedId)) {
                delete Memory.rooms[room.name].sources[storedId];
            }
        }
    },

    /**
     * Assign a free tile near a source to a creep.
     */
    assignTile(sourceId, creepName, roomName) {
        const roomData = Memory.rooms[roomName];
        if (!roomData || !roomData.sources || !roomData.sources[sourceId]) return null;

        const sourceData = roomData.sources[sourceId];

        for (const tile of sourceData.tiles) {
            const key = `${tile.x},${tile.y}`;
            const assignedTo = sourceData.assigned[key];

            // Reclaim tile if creep died
            if (assignedTo && !Game.creeps[assignedTo]) {
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
     * Release a tile when a creep dies.
     */
    releaseTile(sourceId, creepName, roomName, tile) {
        const roomData = Memory.rooms[roomName];
        if (!roomData || !roomData.sources || !roomData.sources[sourceId]) return;

        const key = `${tile.x},${tile.y}`;
        const sourceData = roomData.sources[sourceId];
        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
        }
    },

    /**
     * Manual cleanup: remove dead creeps from assigned tiles.
     */
    cleanupRoom(roomName) {
        const roomData = Memory.rooms[roomName];
        if (!roomData || !roomData.sources) return;

        for (const sId in roomData.sources) {
            const sourceData = roomData.sources[sId];
            for (const key in sourceData.assigned) {
                const creepName = sourceData.assigned[key];
                if (!Game.creeps[creepName]) {
                    delete sourceData.assigned[key];
                }
            }
        }

        console.log(`🧹 Cleaned invalid assignments in ${roomName}`);
    },

    /**
     * ⚠️ Full reset: deletes all source data and rebuilds it fresh.
     * Safe to call from the console: sourceManager.resetRoom('W1N1')
     */
    resetRoom(roomName) {
        const room = Game.rooms[roomName];
        if (!room) {
            console.log(`❌ Room ${roomName} not visible or invalid.`);
            return;
        }

        if (Memory.rooms && Memory.rooms[roomName]) {
            delete Memory.rooms[roomName].sources;
        }

        this.initRoom(room);
        console.log(`🔄 Source data reset for room ${roomName}`);
    },

    /**
     * Internal helper: calculate walkable tiles around a source.
     */
    _calculateTiles(room, source) {
        const tiles = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = source.pos.x + dx;
                const y = source.pos.y + dy;
                if (room.lookForAt(LOOK_TERRAIN, x, y)[0] !== 'wall') {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }
};
