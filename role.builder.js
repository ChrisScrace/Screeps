const BUILD_PRIORITY = [
    STRUCTURE_SPAWN,       // highest priority
    STRUCTURE_EXTENSION,
    STRUCTURE_TOWER,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART
];

module.exports = {
    run(creep) {
        // If empty, get energy
        if (creep.store[RESOURCE_ENERGY] === 0) {
            // Try containers first
            const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            if (container) {
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(container);
                return;
            }

            // Fallback to spawn
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (spawn && spawn.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(spawn);
                return;
            }
        }

        // If full, find construction site based on priority
        let target = null;
        for (const type of BUILD_PRIORITY) {
            const sites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: s => s.structureType === type
            });
            if (sites.length > 0) {
                target = creep.pos.findClosestByPath(sites);
                if (target) break;
            }
        }

        // Build the selected target
        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        } else {
            // fallback: upgrade controller if nothing to build
            require('role.upgrader').run(creep);
        }
    }
};
