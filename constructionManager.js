const sourceManager = require('sourceManager');
const roadPlanner = require('roadPlanner');

const PRIORITY = {
    CONTAINER: 1,
    EXTENSION: 2,
    TOWER: 3,
    DEFENSE: 4,
    ROAD: 5
};

const STRUCTURE_PRIORITY = {
    [STRUCTURE_CONTAINER]: PRIORITY.CONTAINER,
    [STRUCTURE_EXTENSION]: PRIORITY.EXTENSION,
    [STRUCTURE_TOWER]: PRIORITY.TOWER,
    [STRUCTURE_WALL]: PRIORITY.DEFENSE,
    [STRUCTURE_RAMPART]: PRIORITY.DEFENSE,
    [STRUCTURE_ROAD]: PRIORITY.ROAD
};
module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // Limit total sites to avoid spam
        const maxSites = 20;
        const currentSites = room.find(FIND_CONSTRUCTION_SITES);
        if (currentSites.length >= maxSites) return;

        // === PRIORITY 1: Containers on all source tiles ===
        if (this.buildSourceContainers(room)) return;

        // === PRIORITY 2: Extensions in grid pattern ===
        if (this.buildExtensions(room)) return;

        // === PRIORITY 3: Towers ===
        if (this.buildTowers(room)) return;

        // === NEW: PRIORITY 4: Entrance walls/ramparts ===
        if (this.buildEntranceDefenses(room)) return;

        if (!this.hasPendingHigherPrioritySites(room, PRIORITY.ROAD)) {
            this.buildRoads(room);
        }

        // === PRIORITY 5: Roads (only if no other sites exist) ===
        if (!this.hasPendingHigherPrioritySites(room, PRIORITY.ROAD)) {
            this.buildRoads(room);
        }
    },

    // -----------------------------
    // PRIORITY 1: SOURCE CONTAINERS
    // -----------------------------
    buildSourceContainers(room) {
        let built = false;
        const sources = room.find(FIND_SOURCES);

        for (const source of sources) {
            const tiles = sourceManager.getTilesForSource(source.id, room.name);
            if (!tiles || tiles.length === 0) continue;

            for (const tile of tiles) {
                const { x, y } = tile;

                const terrain = room.getTerrain().get(x, y);
                if (terrain === TERRAIN_MASK_WALL) continue;

                // Remove only blocking sites that are not containers or roads
                const blockingSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                for (const site of blockingSites) {
                    const priority = STRUCTURE_PRIORITY[site.structureType] || PRIORITY.ROAD;
                    if (site.structureType !== STRUCTURE_CONTAINER && site.progress === 0 && priority !== PRIORITY.ROAD) {
                        site.remove();
                    }
                }

                // Skip if container already exists or planned
                const hasContainer = room.lookForAt(LOOK_STRUCTURES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                if (hasContainer || hasSite) continue;

                if (room.createConstructionSite(x, y, STRUCTURE_CONTAINER) === OK) {
                    this.cancelLowerPrioritySites(room, PRIORITY.CONTAINER);
                    built = true;
                    break;
                }
            }
            if (built) break; // Only build one container per tick
        }

        return built;
    },

    // -----------------------------
    // PRIORITY 2: EXTENSIONS
    // -----------------------------
    buildExtensions(room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (!spawns.length) return false;

        const spawn = spawns[0];
        const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });
        const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_EXTENSION });

        const limits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = limits[room.controller.level] || 0;
        if (extensions.length + sites.length >= maxExtensions) return false;

        const spacing = 2;
        for (let dx = -6; dx <= 6; dx++) {
            for (let dy = -6; dy <= 6; dy++) {
                if ((Math.abs(dx) % spacing !== 0) || (Math.abs(dy) % spacing !== 0)) continue;
                const x = spawn.pos.x + dx;
                const y = spawn.pos.y + dy;

                if (!this.isBuildableTile(room, x, y)) continue;

                if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
                    this.cancelLowerPrioritySites(room, PRIORITY.EXTENSION);
                    return true;
                }
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 3: TOWERS
    // -----------------------------
    buildTowers(room) {
        if (room.controller.level < 3) return false;

        const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
        const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_TOWER });

        const maxTowers = Math.min(1 + Math.floor(room.controller.level / 2), 6);
        if (towers.length + sites.length >= maxTowers) return false;

        const center = room.controller.pos;
        const offsets = [
            { x: -2, y: -2 }, { x: 2, y: -2 },
            { x: -2, y: 2 }, { x: 2, y: 2 }
        ];

        for (const o of offsets) {
            const x = center.x + o.x;
            const y = center.y + o.y;
            if (!this.isBuildableTile(room, x, y)) continue;

            if (room.createConstructionSite(x, y, STRUCTURE_TOWER) === OK) {
                this.cancelLowerPrioritySites(room, PRIORITY.TOWER);
                return true;
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 4: ENTRANCE DEFENSES
    // -----------------------------
    buildEntranceDefenses(room) {
        const terrain = room.getTerrain();
        const entrances = [];

        // Step 1: Detect walkable tiles at room edges
        for (let x = 0; x < 50; x++) {
            if (terrain.get(x, 0) !== TERRAIN_MASK_WALL) entrances.push({ x, y: 0 });
            if (terrain.get(x, 49) !== TERRAIN_MASK_WALL) entrances.push({ x, y: 49 });
        }
        for (let y = 1; y < 49; y++) {
            if (terrain.get(0, y) !== TERRAIN_MASK_WALL) entrances.push({ x: 0, y });
            if (terrain.get(49, y) !== TERRAIN_MASK_WALL) entrances.push({ x: 49, y });
        }

        // No entrances? Fully sealed room
        if (entrances.length === 0) return false;

        // Step 2: For each entrance, trace a short inward corridor and pick the narrowest part
        for (const entry of entrances) {
            const choke = this.findChokepoint(room, entry, terrain);
            if (!choke) continue;

            // Step 3: Build a wall line at the chokepoint, with one rampart as gate
            const rampartIndex = Math.floor(Math.random() * choke.length);
            for (let i = 0; i < choke.length; i++) {
                const { x, y } = choke[i];
                const type = i === rampartIndex ? STRUCTURE_RAMPART : STRUCTURE_WALL;

                // Skip if already built or planned
                const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
                const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
                if (hasStructure || hasSite) continue;

                if (room.createConstructionSite(x, y, type) === OK) {
                    this.cancelLowerPrioritySites(room, 3.5);
                    return true; // build one per tick
                }
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 5: ROADS
    // -----------------------------
    buildRoads(room) {
        if (!this.hasPendingHigherPrioritySites(room, PRIORITY.ROAD)) {
            roadPlanner.planRoads(room, { double: true });
        }
    },

    // -----------------------------
    // HELPER FUNCTIONS
    // -----------------------------
    isBuildableTile(room, x, y) {
        if (x < 1 || x > 48 || y < 1 || y > 48) return false;
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) return false;

        const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
        const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
        return !hasStructure && !hasSite;
    },

    // Cancel empty construction sites with lower priority than `priorityLevel`
    cancelLowerPrioritySites(room, priorityLevel) {
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        for (const site of sites) {
            const sitePriority = STRUCTURE_PRIORITY[site.structureType] || PRIORITY.ROAD;

            if (sitePriority > priorityLevel && site.progress === 0) {
                // Skip removing if a higher-priority structure or site is at this position
                const hasHighPriority = room.lookForAt(LOOK_STRUCTURES, site.pos.x, site.pos.y)
                    .some(s => (STRUCTURE_PRIORITY[s.structureType] || PRIORITY.ROAD) <= priorityLevel);
                const hasHighPrioritySite = room.lookForAt(LOOK_CONSTRUCTION_SITES, site.pos.x, site.pos.y)
                    .some(s => (STRUCTURE_PRIORITY[s.structureType] || PRIORITY.ROAD) <= priorityLevel);

                if (!hasHighPriority && !hasHighPrioritySite) {
                    site.remove();
                }
            }
        }
    },

    // Check if there are any higher-priority pending sites than given level
    hasPendingHigherPrioritySites(room, priorityLevel) {
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        return sites.some(site => {
            const sitePriority = STRUCTURE_PRIORITY[site.structureType] || PRIORITY.ROAD;
            return sitePriority < priorityLevel;
        });
    },

    /**
 * Finds a chokepoint (narrowest pass) a few tiles inward from the given entrance.
 * Returns an array of positions for the wall line.
 */
    findChokepoint(room, entry, terrain) {
        if (!room || !entry || !terrain) {
            console.log(`[${room && room.name}] ⚠️ Invalid arguments passed to findChokepoint`);
            return null;
        }

        const visited = new Set();
        const queue = [{ x: entry.x, y: entry.y, dist: 0 }];
        const insideTiles = [];

        // Flood-fill inward (up to 5 tiles deep)
        while (queue.length > 0) {
            const { x, y, dist } = queue.shift();
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            // Avoid edges or out-of-bounds
            if (x <= 0 || x >= 49 || y <= 0 || y >= 49) continue;

            // Skip walls
            const terrainType = terrain.get(x, y);
            if (terrainType === TERRAIN_MASK_WALL) continue;

            insideTiles.push({ x, y, dist });

            // Expand flood fill
            if (dist < 5) {
                // Only expand in cardinal directions (no diagonals)
                if (x > 0) queue.push({ x: x - 1, y, dist: dist + 1 });
                if (x < 49) queue.push({ x: x + 1, y, dist: dist + 1 });
                if (y > 0) queue.push({ x, y: y - 1, dist: dist + 1 });
                if (y < 49) queue.push({ x, y: y + 1, dist: dist + 1 });
            }
        }

        if (insideTiles.length === 0) {
            console.log(`[${room.name}] ❌ No walkable tiles found near entry ${entry.x},${entry.y}`);
            return null;
        }

        // Group by distance
        const byDist = {};
        for (const t of insideTiles) {
            if (!byDist[t.dist]) byDist[t.dist] = [];
            byDist[t.dist].push(t);
        }

        // Find the smallest cross-section of walkable tiles (the choke)
        const narrowDist = Object.keys(byDist)
            .map(Number)
            .sort((a, b) => a - b)
            .find(d => byDist[d].length > 0 && byDist[d].length <= 3);

        if (!narrowDist) {
            console.log(`[${room.name}] ⚠️ No narrow chokepoint found for entry ${entry.x},${entry.y}`);
            return null;
        }

        const chokeTiles = byDist[narrowDist];
        if (!chokeTiles || chokeTiles.length === 0) return null;

        // Return tiles as RoomPositions
        return chokeTiles.map(t => new RoomPosition(t.x, t.y, room.name));
    },
};
