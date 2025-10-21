// role.harvester.js
const { assignSource } = require('utils/sourceManager');

module.exports = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            // Use shared module
            const source = assignSource(creep);
            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // Delivery logic as before
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: structure => (
                    (structure.structureType === STRUCTURE_EXTENSION ||
                     structure.structureType === STRUCTURE_SPAWN ||
                     structure.structureType === STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                )
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
};
