module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // Limit total construction sites
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
                // Try placing new extensions in a spiral pattern around spawn
                this.buildNear(spawn.pos, STRUCTURE_EXTENSION, room);
            }
        }

        // === AUTO-BUILD ROADS ===
        this.buildRoads(room);

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
    },

    // Try placing a structure in a spiral pattern around a position
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
    },

    // Builds roads between important targets
    buildRoads(room) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;

        // Roads: Spawn → each Source
        for (const source of sources) {
            this.buildPath(room, spawn.pos, source.pos);
        }

        // Roads: Spawn → Controller
        if (controller) this.buildPath(room, spawn.pos, controller.pos);
    },

    // Creates road construction sites along a path
    buildPath(room, startPos, endPos) {
        const path = room.findPath(startPos, endPos, { ignoreCreeps: true });
        for (const step of path) {
            const pos = new RoomPosition(step.x, step.y, room.name);
            const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
            const hasSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(s => s.structureType === STRUCTURE_ROAD);
            if (!hasRoad && !hasSite) {
                room.createConstructionSite(pos, STRUCTURE_ROAD);
            }
        }
    }
};
