module.exports = {
    /**
     * Try to refill a creep with energy from containers, haulers, spawn, drops, or sources.
     * Returns true if the creep took an action (move/withdraw/harvest), false if nothing to do.
     */
    fetchEnergy(creep) {
        // -----------------------
        // 1. Containers (most efficient)
        // -----------------------
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER &&
                s.store[RESOURCE_ENERGY] > 0
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        // -----------------------
        // 2. Dropped energy
        // -----------------------
        const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (dropped) {
            if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        // -----------------------
        // 3. Spawn (fallback)
        // -----------------------
        const spawns = creep.room.find(FIND_MY_SPAWNS);
        if (spawns.length) {
            const spawn = spawns[0];
            if (spawn.energy > 0) {
                if (creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return true;
            }
        }

        return false; // nothing to do
    }
};
