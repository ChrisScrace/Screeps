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
        const terrain = room.getTerrain();
        const roomMem = Memory.rooms[room.name];

        // pick a reference point for reachability (spawn or controller)
        const refPos = room.find(FIND_MY_SPAWNS)[0]
            ? room.find(FIND_MY_SPAWNS)[0].pos
            : room.controller ? room.controller.pos : null;

        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            const id = source.id;

            if (!roomMem.sources[id]) {
                roomMem.sources[id] = {
                    id: id,
                    x: source.pos.x,
                    y: source.pos.y,
                    tiles: [],
                    assigned: {},
                    verified: false // whether reachability has been checked
                };
            }

            const sourceData = roomMem.sources[id];

            // Only recalc tiles if missing
            if (!sourceData.tiles || sourceData.tiles.length === 0) {
                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const x = source.pos.x + dx;
                        const y = source.pos.y + dy;
                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;

                        // Skip center and walls
                        if ((dx === 0 && dy === 0) || terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

                        // Skip blocked tiles (non-road, non-container structures)
                        const look = room.lookAt(x, y);
                        let blocked = false;
                        for (let j = 0; j < look.length; j++) {
                            const o = look[j];
                            if (o.type === LOOK_STRUCTURES &&
                                o.structure.structureType !== STRUCTURE_ROAD &&
                                o.structure.structureType !== STRUCTURE_CONTAINER) {
                                blocked = true;
                                break;
                            }
                        }
                        if (!blocked) tiles.push({ x: x, y: y });
                    }
                }
                sourceData.tiles = tiles;
            }

            // Perform reachability verification ONCE
            if (!sourceData.verified && refPos && sourceData.tiles && sourceData.tiles.length) {
                const validTiles = [];
                for (let t = 0; t < sourceData.tiles.length; t++) {
                    const tile = sourceData.tiles[t];
                    const targetPos = new RoomPosition(tile.x, tile.y, room.name);

                    // Quick check if it’s truly adjacent (for safety)
                    if (!source.pos.isNearTo(targetPos)) continue;

                    const path = PathFinder.search(refPos, { pos: targetPos, range: 1 }, { maxOps: 1000 });
                    if (!path.incomplete) validTiles.push(tile);
                }

                sourceData.tiles = validTiles;
                sourceData.verified = true; // mark verified to avoid repeating
                console.log('✅ Verified tiles for source', id, 'in room', room.name, '→', validTiles.length);
            }
        }

        // Cleanup: remove sources that no longer exist
        for (const storedId in roomMem.sources) {
            let found = false;
            for (let i = 0; i < sources.length; i++) {
                if (sources[i].id === storedId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                delete roomMem.sources[storedId];
            }
        }
    },

    /**
     * Assign a free tile next to a source for a creep
     */
    assignTile: function (sourceId, creepName, roomName) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources) return null;
        const sourceData = Memory.rooms[roomName].sources[sourceId];
        if (!sourceData) return null;

        for (let i = 0; i < sourceData.tiles.length; i++) {
            const tile = sourceData.tiles[i];
            const key = tile.x + ',' + tile.y;
            const assignedCreep = sourceData.assigned[key];

            // reclaim if creep gone
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
    releaseTile: function (sourceId, creepName, roomName, tile) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources) return;
        const sourceData = Memory.rooms[roomName].sources[sourceId];
        if (!sourceData || !tile) return;

        const key = tile.x + ',' + tile.y;
        if (sourceData.assigned[key] === creepName) {
            delete sourceData.assigned[key];
        }
    },

    cleanupRoom: function (roomName) {
        if (!Memory.rooms || !Memory.rooms[roomName] || !Memory.rooms[roomName].sources) return;
        const sources = Memory.rooms[roomName].sources;
        for (const sId in sources) {
            const src = sources[sId];
            for (const key in src.assigned) {
                const creepName = src.assigned[key];
                if (!Game.creeps[creepName]) delete src.assigned[key];
            }
        }
    },

    /**
    * Get all verified tiles for a source
    */
    getTilesForSource: function (sourceId, roomName) {
        if (!Memory.rooms) return [];
        if (!Memory.rooms[roomName]) return [];
        if (!Memory.rooms[roomName].sources) return [];
        const src = Memory.rooms[roomName].sources[sourceId];
        if (!src || !src.tiles || !src.tiles.length) return [];
        return src.tiles;
    },

};
