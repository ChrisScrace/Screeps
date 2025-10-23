const roomCache = require('roomCache');

module.exports = {
    run(room) {
        const towers = roomCache.getStructures(room).filter(s => s.structureType === STRUCTURE_TOWER);

        for (const tower of towers) {
            const hostile = tower.pos.findClosestByRange(roomCache.getHostiles(room));
            if (hostile) {
                tower.attack(hostile);
                continue;
            }

            const injured = tower.pos.findClosestByRange(
                roomCache.getMyCreeps(room).filter(c => c.hits < c.hitsMax)
            );
            if (injured) {
                tower.heal(injured);
                continue;
            }

            const repairable = roomCache.getRepairTargets(room, 0).filter(s =>
                s.structureType !== STRUCTURE_WALL &&
                s.structureType !== STRUCTURE_RAMPART &&
                s.hits < s.hitsMax * 0.5
            );
            const repairTarget = tower.pos.findClosestByRange(repairable);

            if (repairTarget && tower.store[RESOURCE_ENERGY] > 400) {
                tower.repair(repairTarget);
            }
        }
    }
};
