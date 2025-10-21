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
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                creep.withdraw(container, RESOURCE_ENERGY);
            }
            return;
        }

        const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};
