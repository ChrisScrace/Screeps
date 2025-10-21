const { assignSource } = require('utils/sourceManager');

module.exports = {
    run(creep) {
        const source = assignSource(creep);
        if (!source) return;

        if (creep.store[RESOURCE_ENERGY] === 0) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};

