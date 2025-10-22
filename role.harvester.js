const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        const room = creep.room;
        sourceManager.initRoom(room);

        // Assign source if needed
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Assign a free tile
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, room.name);
            if (!tile) return;
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, room.name);

        // Move to tile
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Harvest
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // Transfer energy to nearest container
        const container = creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
        if (container && creep.store[RESOURCE_ENERGY] > 0) {
            creep.transfer(container, RESOURCE_ENERGY);
        }
    },

    onDeath(creep) {
        if (creep.memory.sourceId) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name);
        }
    }
};
