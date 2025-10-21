module.exports = {
    run(creep) {
        // If creep is empty, get energy from storage/container
        if (creep.store[RESOURCE_ENERGY] === 0) {
            const container = creep.room.find(FIND_STRUCTURES, {
                filter: s =>
                    (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTAINER) &&
                    s.store[RESOURCE_ENERGY] > 0
            })[0];

            if (container) {
                if (!creep.pos.isNearTo(container)) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
                } else {
                    creep.withdraw(container, RESOURCE_ENERGY);
                }
            }
        } else {
            // Upgrade the controller
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};


