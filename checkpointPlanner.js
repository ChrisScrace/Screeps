module.exports = {
    planChokepoints: function(room) {
        if (!room) return;

        var visual = new RoomVisual(room.name);

        // -----------------------
        // 1. Detect walkable edges
        // -----------------------
        function isWalkable(x, y) {
            var terrain = room.getTerrain().get(x, y);
            return terrain !== TERRAIN_MASK_WALL;
        }

        var edgeTiles = [];
        for (var i = 0; i < 50; i++) {
            if (isWalkable(i, 0)) edgeTiles.push({x:i, y:0});
            if (isWalkable(i, 49)) edgeTiles.push({x:i, y:49});
            if (isWalkable(0, i)) edgeTiles.push({x:0, y:i});
            if (isWalkable(49, i)) edgeTiles.push({x:49, y:i});
        }

        // -----------------------
        // 2. Cluster adjacent tiles into entrances
        // -----------------------
        var entrances = [];
        var visited = {};

        function getKey(tile) { return tile.x + ',' + tile.y; }

        function bfs(start) {
            var queue = [start];
            var cluster = [];
            while (queue.length) {
                var t = queue.shift();
                var k = getKey(t);
                if (visited[k]) continue;
                visited[k] = true;
                cluster.push(t);

                // Check 4 neighbors
                var neighbors = [
                    {x:t.x+1, y:t.y}, {x:t.x-1, y:t.y},
                    {x:t.x, y:t.y+1}, {x:t.x, y:t.y-1}
                ];
                for (var n=0;n<neighbors.length;n++) {
                    var nk = getKey(neighbors[n]);
                    if (!visited[nk] && edgeTiles.some(function(et){ return et.x===neighbors[n].x && et.y===neighbors[n].y; })) {
                        queue.push(neighbors[n]);
                    }
                }
            }
            return cluster;
        }

        for (var e=0;e<edgeTiles.length;e++) {
            var tile = edgeTiles[e];
            var k = getKey(tile);
            if (!visited[k]) {
                entrances.push(bfs(tile));
            }
        }

        // -----------------------
        // 3. Visualize walls & single passable entrance
        // -----------------------
        entrances.forEach(function(cluster) {
            if (cluster.length === 0) return;

            // Find center of entrance (passable tile)
            var sumX = 0, sumY = 0;
            for (var i=0;i<cluster.length;i++) { sumX += cluster[i].x; sumY += cluster[i].y; }
            var center = {x: Math.round(sumX / cluster.length), y: Math.round(sumY / cluster.length)};

            // Draw walls around (all tiles except center)
            for (var i=0;i<cluster.length;i++) {
                var t = cluster[i];
                if (t.x === center.x && t.y === center.y) continue;
                visual.text('W', t.x, t.y, {color:'#ff0000', font:0.6, align:'center'});
            }

            // Draw passable tile
            visual.text('E', center.x, center.y, {color:'#00ff00', font:0.6, align:'center'});
        });
    }
};
