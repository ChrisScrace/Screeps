const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // === Assign a source if not already ===
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // === Assign a free tile next to the source ===
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return; // no free tile available
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);

        // === Move to assigned tile if not there yet ===
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // === Deposit energy if full ===
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Try container first
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];

            if (container) {
                if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container);
                }
            } else {
                // Drop energy on the spot
                creep.drop(RESOURCE_ENERGY);
            }
            return; // stop further logic this tick
        }

        // === Harvest if free capacity ===
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
