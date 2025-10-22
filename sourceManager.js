// sourceManager.js
module.exports = {
    /**
     * Initialize or refresh sources for a room
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
                    tiles: {},
                    assigned: {}
                };
            }

            const sourceData = Memory.rooms[room.name].sources[source.id];

            // Initialize tiles if empty
            if (!sourceData.tiles || Object.keys(sourceData.tiles).length === 0) {
                const tiles = this.getTilesForSource(room, source);
                sourceData.tiles = tiles.reduce((acc, t) => {
                    acc[`${t.x},${t.y}`] = null; // mark as unassigned
                    return acc;
                }, {});
            }
        }

        // Cleanup: remove memory for sources that no longer exist
        for (const storedId in Memory.rooms[room.name].sources) {
            if (!sources.find(s => s.id === storedId)) {
                delete Memory.rooms[room.name].sources[storedId];
            }
        }
    },

    /**
     * Assign a free tile to a creep
     */
    assignTile(sourceId, creepName, roomName) {
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData) return null;

        for (const key in sourceData.tiles) {
            if (!sourceData.tiles[key]) {
                sourceData.tiles[key] = creepName;
                const [x, y] = key.split(',').map(Number);
                return { x, y };
            }
        }

        return null; // no free tiles
    },

    /**
     * Release a tile when a creep dies
     */
    releaseTile(sourceId, creepName, roomName, tile) {
        const sourceData = Memory.rooms?.[roomName]?.sources?.[sourceId];
        if (!sourceData || !sourceData.tiles) return;

        const key = `${tile.x},${tile.y}`;
        if (sourceData.tiles[key] === creepName) {
            sourceData.tiles[key] = null;
        }
    },

    /**
     * Get all walkable tiles around a source
     */
    getTilesForSource(room, source) {
        const terrain = room.getTerrain();
        const tiles = [];
        const offsets = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                  { x: 1, y: 0 },
            { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
        ];

        for (const o of offsets) {
            const x = source.pos.x + o.x;
            const y = source.pos.y + o.y;

            if (x < 1 || x > 48 || y < 1 || y > 48) continue; // room bounds
            const type = terrain.get(x, y);
            if (type === TERRAIN_MASK_WALL) continue; // skip walls

            tiles.push({ x, y });
        }

        return tiles;
    },

    /**
     * Clean up invalid assignments for dead creeps
     */
    cleanupRoom(roomName) {
        const roomData = Memory.rooms?.[roomName];
        if (!roomData || !roomData.sources) return;

        for (const sId in roomData.sources) {
            const sourceData = roomData.sources[sId];
            for (const key in sourceData.tiles) {
                const creepName = sourceData.tiles[key];
                if (creepName && !Game.creeps[creepName]) {
                    sourceData.tiles[key] = null;
                }
            }
        }
        console.log(`🧹 Cleaned source assignments in ${roomName}`);
    }
};

