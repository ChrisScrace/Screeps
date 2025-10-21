module.exports = {
    run(creep) {
        // -----------------------
        // Check if carrying energy
        // -----------------------
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Find target: spawn, extensions, towers, or storage
            const target = creep.memory.targetId 
                ? Game.getObjectById(creep.memory.targetId) 
                : this.findTarget(creep);

            if (!target) {
                creep.drop(RESOURCE_ENERGY); // no target, drop to free tile
                return;
            }

            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' } });
            }

            // Save target in memory
            creep.memory.targetId = target.id;
            return;
        }

        // -----------------------
        // If empty, pick up energy
        // -----------------------
        const container = this.findContainer(creep);
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Look for dropped energy as fallback
        const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (dropped) {
            if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Move to spawn as last resort
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        if (spawn) creep.moveTo(spawn);
    },

    // -----------------------
    // Find nearest container with energy
    // -----------------------
    findContainer(creep) {
        if (creep.memory.containerId) {
            const container = Game.getObjectById(creep.memory.containerId);
            if (container && container.store[RESOURCE_ENERGY] > 0) return container;
            delete creep.memory.containerId; // container empty, reset
        }

        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        if (containers.length === 0) return null;

        const nearest = creep.pos.findClosestByPath(containers);
        if (nearest) creep.memory.containerId = nearest.id;
        return nearest;
    },

    // -----------------------
    // Find nearest energy consumer: spawn, extensions, towers, storage
    // -----------------------
    findTarget(creep) {
        const targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => 
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION ||
                 s.structureType === STRUCTURE_TOWER) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (targets.length === 0) return null;

        return creep.pos.findClosestByPath(targets);
    }
};
