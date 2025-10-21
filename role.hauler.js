module.exports = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            // Pick nearest container with energy
            const container = creep.pos.findClosestByPath(
                creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                })
            );
            if (!container) return;

            if (creep.pos.isNearTo(container)) {
                creep.withdraw(container, RESOURCE_ENERGY);
            } else {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // Deliver energy based on priority
            const target = this.getEnergyTarget(creep);
            if (!target) return;

            if (creep.pos.isNearTo(target)) {
                creep.transfer(target, RESOURCE_ENERGY);
            } else {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    },

    getEnergyTarget(creep) {
        // Priority 1: Spawns and extensions
        let targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (targets.length > 0) return creep.pos.findClosestByPath(targets);

        // Priority 2: Towers
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_TOWER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (targets.length > 0) return creep.pos.findClosestByPath(targets);

        // Priority 3: Storage
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_STORAGE &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        return targets.length > 0 ? creep.pos.findClosestByPath(targets) : null;
    }
};
