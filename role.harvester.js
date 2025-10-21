const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // Assign source
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Assign tile
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return;
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);

        // Move to assigned tile
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Harvest energy
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // Determine if any haulers exist
        const haulers = _.filter(Game.creeps, c => c.memory.role === 'hauler');
        const hasHaulers = haulers.length > 0;

        // Find container near source
        const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        })[0];

        // Deposit energy
        if (creep.store[RESOURCE_ENERGY] > 0) {
            if (container && hasHaulers) {
                // Normal case: let haulers pick up
                creep.transfer(container, RESOURCE_ENERGY);
            } else {
                // No haulers or no container: self-haul to spawn/extensions
                const targets = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => 
                        (s.structureType === STRUCTURE_SPAWN ||
                         s.structureType === STRUCTURE_EXTENSION ||
                         s.structureType === STRUCTURE_STORAGE) &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                if (targets.length > 0) {
                    const target = creep.pos.findClosestByPath(targets);
                    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' } });
                    }
                } else {
                    // Drop on ground if nowhere else
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
