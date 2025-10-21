module.exports = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            // Pick nearest container with energy
            const container = this.getClosestContainer(creep);
            if (!container) return;

            if (creep.pos.isNearTo(container)) {
                creep.withdraw(container, RESOURCE_ENERGY);
            } else {
                creep.moveTo(container, this.getCachedPath(creep, container));
            }
        } else {
            // Deliver energy based on priority
            const target = this.getEnergyTarget(creep);
            if (!target) return;

            if (creep.pos.isNearTo(target)) {
                creep.transfer(target, RESOURCE_ENERGY);
            } else {
                creep.moveTo(target, this.getCachedPath(creep, target));
            }
        }
    },

    getClosestContainer(creep) {
        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        return containers.length > 0 ? creep.pos.findClosestByPath(containers) : null;
    },

    getEnergyTarget(creep) {
        // Priority 1: Spawns and extensions needing energy
        let targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (targets.length > 0) return creep.pos.findClosestByPath(targets);

        // Priority 2: Towers needing energy
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_TOWER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (targets.length > 0) return creep.pos.findClosestByPath(targets);

        // Priority 3: Storage (optional, if nothing else needs energy)
        targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_STORAGE &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        return targets.length > 0 ? creep.pos.findClosestByPath(targets) : null;
    },

    getCachedPath(creep, target) {
        if (!Memory.paths) Memory.paths = {};
        const key = `${creep.id}_${target.id}`;

        if (!Memory.paths[key] || Game.time % 5 === 0) { // recalc every 5 ticks
            Memory.paths[key] = creep.pos.findPathTo(target, { ignoreCreeps: true });
        }

        return { path: Memory.paths[key], reusePath: 5 };
    }
};
