const roomCache = require('roomCache');

module.exports = {
    run(creep) {
        // Toggle repair mode
        if (creep.memory.repairing && creep.store[RESOURCE_ENERGY] === 0)
            creep.memory.repairing = false;
        if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0)
            creep.memory.repairing = true;

        const room = creep.room;

        // ---------------------------
        // 1️⃣ Collect energy
        // ---------------------------
        if (!creep.memory.repairing) {
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (target) {
                if (target.resourceType) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE)
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                } else {
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                }
            }
            return;
        }

        // ---------------------------
        // 2️⃣ Repair mode
        // ---------------------------
        const repairTargets = roomCache.getRepairTargets(room, 2000)
            .filter(s =>
                s.structureType !== STRUCTURE_WALL &&
                s.structureType !== STRUCTURE_RAMPART &&
                s.hits < s.hitsMax
            )
            .sort((a, b) => a.hits - b.hits); // prioritize most damaged first

        if (repairTargets.length > 0) {
            const target = repairTargets[0];
            if (creep.repair(target) === ERR_NOT_IN_RANGE)
                creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' }, reusePath: 5 });
            return;
        }

        // ---------------------------
        // 3️⃣ No repair targets → Build
        // ---------------------------
        const buildTargets = roomCache.getBuildTargets(room);
        if (buildTargets.length > 0) {
            const site = creep.pos.findClosestByPath(buildTargets);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE)
                    creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
                return;
            }
        }

        // ---------------------------
        // 4️⃣ Nothing to build → Upgrade
        // ---------------------------
        const controller = room.controller;
        if (controller) {
            if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE)
                creep.moveTo(controller, { visualizePathStyle: { stroke: '#8888ff' }, reusePath: 5 });
        }
    }
};
