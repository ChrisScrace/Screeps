// role.builder.js
const energyManager = require('energyManager');

module.exports = {
    run(creep) {
        // -----------------------
        // Switch mode between building and refilling
        // -----------------------
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄 refill');
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        // -----------------------
        // BUILDING MODE
        // -----------------------
        if (creep.memory.building) {
            const target = this.findConstruction(creep);
            if (target) {
                if (creep.build(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                // If no construction, help upgrade the controller
                const controller = creep.room.controller;
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
    },

    // -----------------------
    // Construction priority
    // -----------------------
    findConstruction(creep) {
        const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
        const priorities = {
            [STRUCTURE_CONTAINER]: 1,
            [STRUCTURE_EXTENSION]: 2,
            [STRUCTURE_TOWER]: 3,
            [STRUCTURE_ROAD]: 4,
            [STRUCTURE_SPAWN]: 5
        };

        sites.sort((a, b) => (priorities[a.structureType] || 99) - (priorities[b.structureType] || 99));
        return sites[0] || null;
    }
};
