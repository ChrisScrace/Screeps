const roomCache = require('roomCache');

module.exports = {
    run(creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) creep.memory.building = false;
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) creep.memory.building = true;

        const room = creep.room;

        if (!creep.memory.building) {
            // Collect energy
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (!target) return;

            if (target.resourceType) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            } else {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            }
            return;
        }

        // Build
        const sites = roomCache.getBuildTargets(room);
        const site = creep.pos.findClosestByPath(sites);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' }, reusePath: 5 });
            return;
        }

        // Fallback: upgrade controller
        const controller = room.controller;
        if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
        }
    }
};
