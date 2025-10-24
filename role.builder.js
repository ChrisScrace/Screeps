const roomCache = require('roomCache');

if (!global.buildAssignments) global.buildAssignments = {};

module.exports = {
    run(creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) creep.memory.building = false;
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) creep.memory.building = true;

        const room = creep.room;

        // Reset global assignment cache each tick (once)
        if (!global.buildAssignmentsTick || global.buildAssignmentsTick !== Game.time) {
            global.buildAssignments = {};
            global.buildAssignmentsTick = Game.time;
        }

        if (!creep.memory.building) {
            // --------------------------
            // Collect energy
            // --------------------------
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (!target) return;

            if (target.resourceType) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE)
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            } else {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            }
            return;
        }

        // --------------------------
        // Build
        // --------------------------
        const sites = roomCache.getBuildTargets(room);

        // filter out sites with too many assigned builders
        const filteredSites = sites.filter(s => {
            const count = global.buildAssignments[s.id] || 0;
            return count < 2;
        });

        const site = creep.pos.findClosestByPath(filteredSites);

        if (site) {
            global.buildAssignments[site.id] = (global.buildAssignments[site.id] || 0) + 1;
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' }, reusePath: 5 });
            }
            return;
        }

        // --------------------------
        // Fallback: upgrade controller
        // --------------------------
        const controller = room.controller;
        if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
        }
    }
};
