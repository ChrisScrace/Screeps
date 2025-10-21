module.exports = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            const target = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType === STRUCTURE_SPAWN ||
                         structure.structureType === STRUCTURE_EXTENSION ||
                         structure.structureType === STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                }
            })[0];
            if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};
