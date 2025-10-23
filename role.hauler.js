const roomCache = require('roomCache');
const pathCache = require('pathCache');

module.exports = {
    run(creep) {
        // -------------------------
        // 1️⃣ Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) creep.memory.hauling = false;
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) creep.memory.hauling = true;

        const room = creep.room;

        // -------------------------
        // 2️⃣ Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (!target) return;

            // Move using path cache
            pathCache.moveTo(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });

            // Pickup or withdraw energy
            if (target.resourceType) {
                creep.pickup(target);
            } else {
                creep.withdraw(target, RESOURCE_ENERGY);
            }
            return;
        }

        // -------------------------
        // 3️⃣ Deliver energy to priority targets
        // -------------------------
        const deliverPriority = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION];
        for (const type of deliverPriority) {
            const targets = roomCache.getStructures(room, [type])[type];
            const target = creep.pos.findClosestByPath(targets);
            if (target) {
                pathCache.moveTo(creep, target, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.transfer(target, RESOURCE_ENERGY);
                return;
            }
        }

        // -------------------------
        // 4️⃣ Fallback: drop energy
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
