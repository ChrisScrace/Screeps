const { planRoads } = require('roadPlanner');

module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // Limit total construction sites to avoid spam
        if (room.find(FIND_CONSTRUCTION_SITES).length > 10) return;

        // === AUTO-BUILD EXTENSIONS ===
        const extensions = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        const extensionLimits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = extensionLimits[room.controller.level] || 0;

        if (extensions.length < maxExtensions) {
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            if (spawn) {
                this.buildNear(spawn.pos, STRUCTURE_EXTENSION, room);
            }
        }

        // === AUTO-BUILD TOWER AT RCL >= 3 ===
        if (room.controller.level >= 3) {
            const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
            if (towers.length < 1) {
                const spawn = room.find(FIND_MY_SPAWNS)[0];
                if (spawn) {
                    this.buildNear(spawn.pos, STRUCTURE_TOWER, room);
                }
            }
        }

        // === ROADS handled by roadPlanner module ===
        // Run adaptive road planning
        if (Game.time % 100 === 0) { // throttle road planning to every 100 ticks
            planRoads(room);
        }
    },

    /**
     * Try placing a structure in a spiral pattern around a position
     */
    buildNear(pos, structureType, room) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const x = pos.x + dx;
                const y = pos.y + dy;
                if (room.createConstructionSite(x, y, structureType) === OK) {
                    console.log(`Placed ${structureType} at ${x},${y}`);
                    return;
                }
            }
        }
    }
};
