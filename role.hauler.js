module.exports = {
    run(creep) {
        if (creep.store.getFreeCapacity() > 0) {
            // === Pick nearest container with energy ===
            const container = this.getClosestContainer(creep);
            if (!container) return;

            if (creep.pos.isNearTo(container)) {
                creep.withdraw(container, RESOURCE_ENERGY);
            } else {
                creep.moveTo(container, this.getCachedPath(creep, container));
            }
        } else {
            // === Deliver to structure needing energy ===
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
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION ||
                 s.structureType === STRUCTURE_TOWER ||
                 s.structureType === STRUCTURE_STORAGE) &&
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
