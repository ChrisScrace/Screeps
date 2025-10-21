module.exports = {
    run(creep) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};
