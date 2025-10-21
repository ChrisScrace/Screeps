const { assignSource } = require('sourceManager');

module.exports = {
    run(creep) {
        if (!creep.memory.sourceId) {
            const sources = creep.room.find(FIND_SOURCES);
            creep.memory.sourceId = creep.pos.findClosestByPath(sources).id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Find container near source
        const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        })[0];

        if (!container) return; // wait until container is built

        if (creep.store.getFreeCapacity() > 0) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
        }
    }
};

