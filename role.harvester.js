module.exports = {
    run(creep) {
        // Assign a source if we don't have one
        if (!creep.memory.sourceId) {
            const sources = creep.room.find(FIND_SOURCES);
            const sourceUsage = {};

            // Count how many creeps are assigned to each source
            for (const s of sources) {
                sourceUsage[s.id] = _.sum(Game.creeps, c => c.memory.sourceId === s.id);
            }

            // Pick the least used source
            const targetSource = _.min(sources, s => sourceUsage[s.id]);
            if (targetSource && targetSource.id) {
                creep.memory.sourceId = targetSource.id;
            }
        }

        const source = Game.getObjectById(creep.memory.sourceId);

        // If source is invalid or gone, reset memory to reassign next tick
        if (!source) {
            delete creep.memory.sourceId;
            return;
        }

        // Harvest or deliver energy
        if (creep.store.getFreeCapacity() > 0) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType === STRUCTURE_SPAWN ||
                         structure.structureType === STRUCTURE_EXTENSION ||
                         structure.structureType === STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                }
            }) || creep.room.storage; // fallback to storage if built

            if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};
