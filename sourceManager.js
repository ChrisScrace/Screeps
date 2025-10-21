module.exports = {
    /**
     * Initializes source data for a room
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
                    assigned: {}
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
                        if (room.lookForAt(LOOK_TERRAIN, x, y)[0] !== 'wall') {
                            tiles.push({ x, y });
                        }
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
     * Assigns a free tile near a source to a creep
     */
    assignTile(sourceId, creepName, roomName) {
        const roomData = Memory.rooms[roomName];
        if (!roomData || !roomData.sources || !roomData.sources[sourceId]) return null;

        const sourceData = roomData.sources[sourceId];

        for (const tile of sourceData.tiles) {
            const key = `${tile.x},${tile.y}`;
            const assignedCreepName = sourceData.assigned[key];
            const creep = Game.creeps[assignedCreepName];

            // Reclaim if creep no longer exists
            if (assignedCreepName && !creep) {
                delete sourceData.assigned[key];
            }

            // Only assign if tile is free
            const positionOccupied = creep && creep.pos.x === tile.x && creep.pos.y === tile.y;
            if (!sourceData.assigned[key] && !positionOccupied) {
                sourceData.assigned[key] = creepName;
                return tile;
            }
        }

        return null; // no free tile
    },

    releaseTile(sourceId, creepName, roomName, tile) {
        const roomData = Memory.rooms[roomName];
        if (!roomData || !roomData.sources || !roomData.sources[sourceId]) return;

        const key = `${tile.x},${tile.y}`;
        const sourceData = roomData.sources[sourceId];
        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
        }
    },

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
        console.log(`🧹 Cleaned source assignments in ${roomName}`);
    }
};
