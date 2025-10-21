const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // Assign source if needed
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Assign a free tile next to the source
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return; // no free tile
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);

        // Move to tile
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Harvest if not full
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // Deposit energy
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Prefer container if exists
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];

            if (container) {
                creep.transfer(container, RESOURCE_ENERGY);
            } else {
                // Drop on ground if no container
                creep.drop(RESOURCE_ENERGY);
            }
        }
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
