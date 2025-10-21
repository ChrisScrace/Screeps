module.exports = {
    initRoom(room) {
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].sources) Memory.rooms[room.name].sources = {};

        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            if (!Memory.rooms[room.name].sources[source.id]) {
                const tiles = this.getFreeTilesAround(source, room);
                Memory.rooms[room.name].sources[source.id] = {
                    tiles: tiles,      // positions harvesters can stand on
                    harvesters: []     // creeps currently assigned
                };
            }
        }
    },

    getFreeTilesAround(source, room) {
        const terrain = Game.map.getRoomTerrain(room.name);
        const tiles = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // skip source itself
                const x = source.pos.x + dx;
                const y = source.pos.y + dy;
                if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                    tiles.push({ x, y });
                }
            }
        }

        return tiles;
    },

    assignTile(sourceId, creepName, roomName) {
        const srcMem = Memory.rooms[roomName].sources[sourceId];
        for (const tile of srcMem.tiles) {
            const occupied = srcMem.harvesters.find(t => t.x === tile.x && t.y === tile.y);
            if (!occupied) {
                srcMem.harvesters.push(tile);
                return tile;
            }
        }
        return null; // no free tile
    },

    releaseTile(sourceId, creepName, roomName, tile) {
        const srcMem = Memory.rooms[roomName].sources[sourceId];
        srcMem.harvesters = srcMem.harvesters.filter(t => !(t.x === tile.x && t.y === tile.y));
    }
};
