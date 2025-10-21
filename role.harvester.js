const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Reserve a tile
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return; // no free tile
            creep.memory.tile = tile;
        }

        // Move to reserved tile
        if (creep.pos.x !== creep.memory.tile.x || creep.pos.y !== creep.memory.tile.y) {
            creep.moveTo(creep.memory.tile.x, creep.memory.tile.y, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Find nearby container
        const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        })[0];

        // Harvest energy
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // Deposit energy
        if (container) {
            if (creep.store[RESOURCE_ENERGY] > 0) {
                creep.transfer(container, RESOURCE_ENERGY);
            }
        } else {
            // Drop energy on the ground if no container exists
            if (creep.store[RESOURCE_ENERGY] > 0) {
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
