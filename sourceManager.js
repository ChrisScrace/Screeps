module.exports = {
    /**
     * Initializes or refreshes the source data for a room.
     * Safe to call every tick.
     */
    initRoom: function(room) {
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
                            tiles.push({ x: x, y: y });
                        }
                    }
                }
                sourceData.tiles = tiles;
            }
        }

        // Cleanup: remove sources that no longer exist
        for (let storedId in Memory.rooms[room.name].sources) {
            if (!sources.find(function(s) { return s.id === storedId; })) {
                delete Memory.rooms[room.name].sources[storedId];
            }
        }
    },

    /**
     * Assigns a free tile near a source to a creep.
     * Returns tile coordinates or null if none available.
     */
    assignTile: function(sourceId, creepName, roomName) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources[sourceId]) {
            return null;
        }

        var sourceData = Memory.rooms[roomName].sources[sourceId];

        for (var i = 0; i < sourceData.tiles.length; i++) {
            var tile = sourceData.tiles[i];
            var key = tile.x + ',' + tile.y;
            var occupant = sourceData.assigned[key];
            var creep = Game.creeps[occupant];

            // Reclaim tile if assigned creep is dead
            if (occupant && !creep) {
                delete sourceData.assigned[key];
            }

            if (!sourceData.assigned[key]) {
                sourceData.assigned[key] = creepName;
                return { x: tile.x, y: tile.y };
            }
        }

        return null; // no free tile
    },

    /**
     * Releases a reserved tile when a creep dies.
     */
    releaseTile: function(sourceId, creepName, roomName, tile) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources[sourceId]) return;

        var key = tile.x + ',' + tile.y;
        var sourceData = Memory.rooms[roomName].sources[sourceId];

        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
        }
    },

    /**
     * Clean up invalid assignments or dead creeps from memory.
     */
    cleanupRoom: function(roomName) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources) return;

        var roomData = Memory.rooms[roomName];
        for (var sId in roomData.sources) {
            var sourceData = roomData.sources[sId];
            for (var key in sourceData.assigned) {
                var creepName = sourceData.assigned[key];
                if (!Game.creeps[creepName]) {
                    delete sourceData.assigned[key];
                }
            }
        }

        console.log('🧹 Cleaned source assignments in ' + roomName);
    }
};
