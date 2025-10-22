module.exports = {
    run(room) {
        // Only build if you own the room
        if (!room.controller || !room.controller.my) return;

        // Don’t build too many at once
        const maxSites = 10;
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length >= maxSites) return;

        // Build containers near sources first
        this.buildSourceContainers(room);

        // Then build extensions near spawn
        this.buildExtensions(room);
    },

    /**
     * Build a container next to each source if none exists.
     */
    buildSourceContainers(room) {
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            // Skip if a container already exists or is under construction nearby
            const nearbyContainer = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            });
            const nearbySite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            });
            if (nearbyContainer.length > 0 || nearbySite.length > 0) continue;

            // Find first walkable tile around the source
            const terrain = room.getTerrain();
            const offsets = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
                { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
            ];

            for (const o of offsets) {
                const x = source.pos.x + o.x;
                const y = source.pos.y + o.y;
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

                const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
                const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                if (structures.length === 0 && sites.length === 0) {
                    room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                    break;
                }
            }
        }
    },

    /**
     * Build extensions near your spawn (one ring per level).
     */
    buildExtensions(room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;

        const spawn = spawns[0];
        const extensions = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        // Controller level limits
        const limits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = limits[room.controller.level] || 0;

        if (extensions.length >= maxExtensions) return;

        // Try to place extensions in expanding squares around spawn
        for (let radius = 2; radius <= 5; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const x = spawn.pos.x + dx;
                    const y = spawn.pos.y + dy;
                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;

                    const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
                    const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
                    if (!hasStructure && !hasSite) {
                        room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
                        return; // Only build one per tick to stay safe
                    }
                }
            }
        }
    }
};
