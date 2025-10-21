module.exports = {
    run(creep) {
        const controller = creep.room.controller;
        if (!controller) return;

        // If empty, get energy
        if (creep.store[RESOURCE_ENERGY] === 0) {
            // Try containers first
            const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });

            if (container) {
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }

            // Fallback to spawn
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (spawn && spawn.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
        }

        // If full, upgrade controller
        if (creep.store[RESOURCE_ENERGY] > 0) {
            if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(controller, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }
};
