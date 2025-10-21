module.exports = {
    run(creep) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
            const container = creep.pos.findClosestByPath(
                creep.room.find(FIND_STRUCTURES, {
                    filter: s =>
                        (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                        s.store[RESOURCE_ENERGY] > 0
                })
            );
            if (!container) return;

            if (!creep.pos.isNearTo(container)) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
            } else {
                creep.withdraw(container, RESOURCE_ENERGY);
            }
            return;
        }

        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};
