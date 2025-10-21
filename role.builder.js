module.exports = {
    run(creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
        }

        if (creep.memory.building) {
            const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                // Nothing to build, fallback to upgrading
                const controller = creep.room.controller;
                if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller);
                }
            }
        } else {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};
