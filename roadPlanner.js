// utils/roadPlanner.js

/**
 * Adaptive road planner:
 * - Double roads for heavy traffic (spawn↔sources, spawn↔controller)
 * - Single roads for light traffic (sources↔controller, spawn↔extensions, minerals)
 * - Avoid overwriting walls or existing sites
 */
function planRoads(room) {
    if (!room.controller) return;

    const spawns = room.find(FIND_MY_SPAWNS);
    const sources = room.find(FIND_SOURCES);
    const minerals = room.find(FIND_MINERALS);
    const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });

    if (!spawns.length || sources.length === 0) return;

    const MAX_SITES = 50;
    if (room.find(FIND_CONSTRUCTION_SITES).length > MAX_SITES) return;

    /**
     * Build a road path between two points.
     * @param {RoomPosition} from
     * @param {RoomPosition} to
     * @param {boolean} doubleStack - true = 2-tile wide road
     */
    function buildRoadPath(from, to, doubleStack = false) {
        const path = room.findPath(from, to, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1 });

        for (const step of path) {
            const mainPos = new RoomPosition(step.x, step.y, room.name);
            tryBuildRoad(mainPos);

            if (doubleStack) {
                for (const offset of adjacentOffsets()) {
                    const adjX = step.x + offset.x;
                    const adjY = step.y + offset.y;
                    if (isInBounds(adjX, adjY) && room.getTerrain().get(adjX, adjY) !== TERRAIN_MASK_WALL) {
                        tryBuildRoad(new RoomPosition(adjX, adjY, room.name));
                    }
                }
            }
        }
    }

    function tryBuildRoad(pos) {
        const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
        const hasSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(s => s.structureType === STRUCTURE_ROAD);
        if (!hasRoad && !hasSite) room.createConstructionSite(pos, STRUCTURE_ROAD);
    }

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

    // ---- Build roads ----
    for (const spawn of spawns) {
        // Spawn ↔ Sources (heavy traffic)
        for (const source of sources) buildRoadPath(spawn.pos, source.pos, true);

        // Spawn ↔ Controller (heavy traffic)
        buildRoadPath(spawn.pos, room.controller.pos, true);

        // Spawn ↔ Extensions (light traffic)
        for (const ext of extensions) buildRoadPath(spawn.pos, ext.pos, false);
    }

    // Sources ↔ Controller (light traffic)
    for (const source of sources) buildRoadPath(source.pos, room.controller.pos, false);

    // Minerals ↔ Closest spawn (light traffic)
    for (const mineral of minerals) {
        const closestSpawn = mineral.pos.findClosestByRange(spawns.map(s => s.pos));
        if (closestSpawn) buildRoadPath(mineral.pos, closestSpawn, false);
    }
}

module.exports = { planRoads };
