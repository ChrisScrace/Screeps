function assignSource(creep) {
    if (!creep.memory.sourceId) {
        const sources = creep.room.find(FIND_SOURCES);
        const sourceUsage = {};
        for (const s of sources) {
            sourceUsage[s.id] = _.sum(Game.creeps, c => c.memory.sourceId === s.id);
        }
        const targetSource = _.min(sources, s => sourceUsage[s.id]);
        if (targetSource && targetSource.id) {
            creep.memory.sourceId = targetSource.id;
        }
    }
    return Game.getObjectById(creep.memory.sourceId);
}

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

