const roomCache = require('roomCache');

module.exports = {
    run: function (room) {
        const towers = roomCache.getStructures(room).filter(function (s) {
            return s.structureType === STRUCTURE_TOWER;
        });

        for (let i = 0; i < towers.length; i++) {
            const tower = towers[i];

            // 1. Attack weakest hostile
            const hostiles = roomCache.getHostiles(room);
            if (hostiles.length > 0) {
                // Sort by absolute HP (lowest first)
                hostiles.sort(function (a, b) {
                    return a.hits - b.hits;
                });
                const target = hostiles[0];
                tower.attack(target);
                continue;
            }

            // 2. Heal weakest friendly
            const injured = roomCache.getMyCreeps(room).filter(function (c) {
                return c.hits < c.hitsMax;
            });
            if (injured.length > 0) {
                injured.sort(function (a, b) {
                    return (a.hits / a.hitsMax) - (b.hits / b.hitsMax);
                });
                tower.heal(injured[0]);
                continue;
            }

            // 3. Repair most damaged structure
            const repairables = roomCache.getRepairTargets(room, 0).filter(function (s) {
                return s.structureType !== STRUCTURE_WALL &&
                       s.structureType !== STRUCTURE_RAMPART &&
                       s.hits < s.hitsMax * 0.5;
            });

            if (repairables.length > 0 && tower.store[RESOURCE_ENERGY] > 400) {
                repairables.sort(function (a, b) {
                    return (a.hits / a.hitsMax) - (b.hits / b.hitsMax);
                });
                tower.repair(repairables[0]);
            }
        }
    }
};
