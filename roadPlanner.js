// utils/roadPlanner.js

/**
 * Adaptive road planner.
 * - Double roads for heavy traffic (spawn↔sources, spawn↔controller)
 * - Single roads for light traffic (sources↔controller, mineral routes)
 * - CPU-safe and construction-limit aware
 */
function planRoads(room) {
    if (!room.controller) return;

    const spawns = room.find(FIND_MY_SPAWNS);
    const sources = room.find(FIND_SOURCES);
    const minerals = room.find(FIND_MINERALS);

    if (!spawns.length || sources.length === 0) return;

    // Skip if we have too many construction sites (safety limit)
    const MAX_SITES = 50;
    if (room.find(FIND_CONSTRUCTION_SITES).length > MAX_SITES) return;

    /**
     * Build a path of roads between two points.
     * @param {RoomPosition} from
     * @param {RoomPosition} to
     * @param {boolean} doubleStack - whether to make it two tiles wide
     */
    function buildRoadPath(from, to, doubleStack = false) {
        const path = room.findPath(from, to, {
            ignoreCreeps: true,
            ignoreRoads: true,
            swampCost: 1, // encourage straight roads
        });

        for (const step of path) {
            const mainPos = new RoomPosition(step.x, step.y, room.name);
            tryBuildRoad(mainPos, room);

            if (doubleStack) {
                for (const offset of adjacentOffsets()) {
                    const adjX = step.x + offset.x;
                    const adjY = step.y + offset.y;
                    if (isInBounds(adjX, adjY)) {
                        const terrain = room.getTerrain().get(adjX, adjY);
                        if (terrain !== TERRAIN_MASK_WALL) {
                            tryBuildRoad(new RoomPosition(adjX, adjY, room.name), room);
                        }
                    }
                }
            }
        }
    }

    // Attempts to build a road if there’s no existing structure/site
    function tryBuildRoad(pos, room) {
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain === TERRAIN_MASK_WALL) return; // skip walls

        const hasRoad = pos.lookFor(LOOK_STRUCTURES)
            .some(s => s.structureType === STRUCTURE_ROAD);
        const hasSite = pos.lookFor(LOOK_CONSTRUCTION_SITES)
            .some(s => s.structureType === STRUCTURE_ROAD);

        if (!hasRoad && !hasSite) {
            room.createConstructionSite(pos, STRUCTURE_ROAD);
        }
    }

    // Cardinal directions for 2-tile paths
    function adjacentOffsets() {
        return [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
        ];
    }

    function isInBounds(x, y) {
        return x > 0 && x < 49 && y > 0 && y < 49;
    }

    // ---- ROAD LOGIC ----
    for (const spawn of spawns) {
        for (const source of sources) {
            // Heavy route: spawn → source
            buildRoadPath(spawn.pos, source.pos, true);
        }

        // Heavy route: spawn → controller
        buildRoadPath(spawn.pos, room.controller.pos, true);
    }

    // Lighter route: link sources to controller
    for (const source of sources) {
        buildRoadPath(source.pos, room.controller.pos, false);
    }

    // Optional: single road to minerals
    for (const mineral of minerals) {
        const closestSpawn = mineral.pos.findClosestByRange(spawns.map(s => s.pos));
        buildRoadPath(mineral.pos, closestSpawn, false);
    }
}

module.exports = { planRoads };
