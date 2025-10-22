const energyManager = require('energyManager');

module.exports = {
    run(creep) {
        // -----------------------
        // Switch mode between upgrading and refilling
        // -----------------------
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 refill');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        // -----------------------
        // UPGRADING MODE
        // -----------------------
        if (creep.memory.upgrading) {
            const controller = creep.room.controller;
            if (controller) {
                if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
        // -----------------------
        // REFILL MODE
        // -----------------------
        else {
            energyManager.fetchEnergy(creep);
        }
    }
};
