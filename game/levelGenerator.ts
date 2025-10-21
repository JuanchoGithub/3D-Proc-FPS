import { MAP_WIDTH, MAP_HEIGHT } from './constants';

type Room = {
    x: number, y: number, width: number, height: number, id: number, connections: Set<number>,
    archetype: 'default' | 'maze' | 'open_arena'
};

// Maze generation using recursive backtracking (coarse)
function generateCoarseMaze(width: number, height: number) {
    const maze = Array(height).fill(null).map(() => Array(width).fill('#'));

    function isValid(x: number, y: number) {
        return x >= 0 && x < width && y >= 0 && y < height && maze[y][x] === '#';
    }

    function carve(x: number, y: number) {
        maze[y][x] = '.';
        const directions: [number, number][] = [
            [0, 2], [2, 0], [0, -2], [-2, 0]
        ];
        directions.sort(() => Math.random() - 0.5); // Shuffle

        for (let [dx, dy] of directions) {
            const nx = x + dx, ny = y + dy;
            if (isValid(nx, ny)) {
                maze[y + dy / 2][x + dx / 2] = '.'; // Remove wall between
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);
    return maze;
}

// Expand coarse maze to fine grid with 2x2 blocks
function expandMaze(coarse: string[][]) {
    const cw = coarse[0].length;
    const ch = coarse.length;
    const fw = cw * 2;
    const fh = ch * 2;
    const fine = Array(fh).fill(null).map(() => Array(fw).fill('#'));

    for (let cy = 0; cy < ch; cy++) {
        for (let cx = 0; cx < cw; cx++) {
            const chVal = coarse[cy][cx];
            const isPath = chVal === '.';
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    fine[cy * 2 + dy][cx * 2 + dx] = isPath ? '.' : '#';
                }
            }
        }
    }
    return fine;
}

// Generate open room with obstacles
function generateOpenRoom(width: number, height: number) {
    const grid = Array(height).fill(null).map(() => Array(width).fill('.'));

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (Math.random() < 0.10) {
                grid[y][x] = '#';
            }
        }
    }

    for (let i = 0; i < 2; i++) {
        const y = Math.floor(Math.random() * (height - 3)) + 1;
        const x = Math.floor(Math.random() * (width - 3)) + 1;
        const isHoriz = Math.random() < 0.5;
        if (isHoriz) {
            if (x + 1 < width && grid[y][x] === '.' && grid[y][x + 1] === '.') {
                grid[y][x] = '#';
                grid[y][x + 1] = '#';
            }
        } else {
            if (y + 1 < height && grid[y][x] === '.' && grid[y + 1][x] === '.') {
                grid[y][x] = '#';
                grid[y + 1][x] = '#';
            }
        }
    }
    return grid;
}

function findReachableTiles(grid: string[][], startX: number, startY: number): {x: number, y: number}[] {
    const reachable = new Set<string>();
    const queue: {x: number, y: number}[] = [{x: startX, y: startY}];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        
        if (grid[y]?.[x] === '.') {
             reachable.add(`${x},${y}`);
        }

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;

            if (nx >= 0 && nx < MAP_WIDTH &&
                ny >= 0 && ny < MAP_HEIGHT &&
                grid[ny]?.[nx] !== '#' && !visited.has(key))
            {
                visited.add(key);
                queue.push({x: nx, y: ny});
            }
        }
    }

    return Array.from(reachable).map(s => {
        const [x, y] = s.split(',').map(Number);
        return {x, y};
    });
}


// Generate full level in a square layout with snake-pattern rooms
export const generateLevel = () => {
    const totalSize = MAP_WIDTH;
    let charGrid = Array(totalSize).fill(null).map(() => Array(totalSize).fill('#'));

    const colors = ['r', 'b', 'g'];
    const doorChars = ['R', 'B', 'G'];

    const roomDefs = [
        { id: 0, x: 1, y: 1, w: 12, h: 12, type: 'open' },
        { id: 1, x: 14, y: 1, w: 12, h: 12, type: 'maze' },
        { id: 2, x: 14, y: 14, w: 12, h: 12, type: 'open' },
        { id: 3, x: 1, y: 14, w: 12, h: 12, type: 'maze' }
    ];
    
    // 1. Generate room interiors and place them on the grid
    for (const room of roomDefs) {
        let innerGrid;

        if (room.type === 'maze') {
            const coarseMaze = generateCoarseMaze(room.w / 2, room.h / 2);
            innerGrid = expandMaze(coarseMaze);
        } else {
            innerGrid = generateOpenRoom(room.w, room.h);
        }

        for (let yy = 0; yy < room.h; yy++) {
            for (let xx = 0; xx < room.w; xx++) {
                charGrid[room.y + yy][room.x + xx] = innerGrid[yy][xx];
            }
        }
    }

    // 2. Carve connections between rooms
    const connections = [
        { from: 0, to: 1, type: 'h', wallX: 13, yStart: 1, yEnd: 12, door: 'R' },
        { from: 1, to: 2, type: 'v', wallY: 13, xStart: 14, xEnd: 25, door: 'B' },
        { from: 2, to: 3, type: 'h', wallX: 13, yStart: 14, yEnd: 25, door: 'G' }
    ];

    const openingSize = 4;
    for (let conn of connections) {
        if (conn.type === 'h') {
            const rangeSize = conn.yEnd - conn.yStart + 1;
            const doorStartY = conn.yStart + Math.floor(Math.random() * (rangeSize - openingSize + 1));
            
            for (let dy = 0; dy < openingSize; dy++) {
                const y = doorStartY + dy;
                if (y >= 0 && y < totalSize && conn.wallX >= 0 && conn.wallX < totalSize) {
                    charGrid[y][conn.wallX] = conn.door;
                    if (conn.wallX - 1 >= 0) charGrid[y][conn.wallX - 1] = '.';
                    if (conn.wallX - 2 >= 0) charGrid[y][conn.wallX - 2] = '.';
                    if (conn.wallX + 1 < totalSize) charGrid[y][conn.wallX + 1] = '.';
                    if (conn.wallX + 2 < totalSize) charGrid[y][conn.wallX + 2] = '.';
                }
            }
            
            const doorCenterY = Math.floor(doorStartY + openingSize / 2);
            const connectedRooms = [roomDefs[conn.from], roomDefs[conn.to]];
            for (const room of connectedRooms) {
                if (room.type === 'maze') {
                    const roomIsRightSide = room.x > conn.wallX;
                    const entranceX = roomIsRightSide ? conn.wallX + 1 : conn.wallX - 1;
                    const roomCenterX = room.x + Math.floor(room.w / 2);
                    
                    const startX = Math.min(entranceX, roomCenterX);
                    const endX = Math.max(entranceX, roomCenterX);
                    for (let x = startX; x <= endX; x++) {
                        if (x >= room.x && x < room.x + room.w && doorCenterY >= room.y && doorCenterY < room.y + room.h) {
                           charGrid[doorCenterY][x] = '.';
                           if (charGrid[doorCenterY - 1]) charGrid[doorCenterY - 1][x] = '.';
                        }
                    }
                }
            }
        } else { // 'v'
            const rangeSize = conn.xEnd - conn.xStart + 1;
            const doorStartX = conn.xStart + Math.floor(Math.random() * (rangeSize - openingSize + 1));
            
            for (let dx = 0; dx < openingSize; dx++) {
                const x = doorStartX + dx;
                if (x >= 0 && x < totalSize && conn.wallY >= 0 && conn.wallY < totalSize) {
                    charGrid[conn.wallY][x] = conn.door;
                    if (conn.wallY - 1 >= 0) charGrid[conn.wallY - 1][x] = '.';
                    if (conn.wallY - 2 >= 0) charGrid[conn.wallY - 2][x] = '.';
                    if (conn.wallY + 1 < totalSize) charGrid[conn.wallY + 1][x] = '.';
                    if (conn.wallY + 2 < totalSize) charGrid[conn.wallY + 2][x] = '.';
                }
            }
            
            const doorCenterX = Math.floor(doorStartX + openingSize / 2);
            const connectedRooms = [roomDefs[conn.from], roomDefs[conn.to]];
            for (const room of connectedRooms) {
                if (room.type === 'maze') {
                    const roomIsBottomSide = room.y > conn.wallY;
                    const entranceY = roomIsBottomSide ? conn.wallY + 1 : conn.wallY - 1;
                    const roomCenterY = room.y + Math.floor(room.h / 2);

                    const startY = Math.min(entranceY, roomCenterY);
                    const endY = Math.max(entranceY, roomCenterY);
                    for (let y = startY; y <= endY; y++) {
                        if (y >= room.y && y < room.y + room.h && doorCenterX >= room.x && doorCenterX < room.x + room.w) {
                           charGrid[y][doorCenterX] = '.';
                           if (charGrid[y][doorCenterX - 1]) charGrid[y][doorCenterX - 1] = '.';
                        }
                    }
                }
            }
        }
    }

    // 3. Determine all reachable tiles from the start room.
    const startRoom = roomDefs[0];
    const startPoint = { x: startRoom.x + 2, y: startRoom.y + 2 };
    const allReachableTiles = findReachableTiles(charGrid, startPoint.x, startPoint.y);

    // 4. Bucket reachable tiles by room.
    const roomReachableTiles: { [id: number]: {x: number, y: number}[] } = {};
    for (let i = 0; i < roomDefs.length; i++) {
        roomReachableTiles[i] = [];
    }
    for (const tile of allReachableTiles) {
        for (const room of roomDefs) {
            if (tile.x >= room.x && tile.x < room.x + room.w &&
                tile.y >= room.y && tile.y < room.y + room.h)
            {
                roomReachableTiles[room.id].push(tile);
                break; // A tile belongs to only one room
            }
        }
    }

    // 5. Place items in reachable locations.
    const placeItem = (itemChar: string, validTiles: {x: number, y: number}[], biasFn: (tile: {x: number, y: number}) => boolean = () => true) => {
        const biasedTiles = validTiles.filter(biasFn);
        const targetTiles = biasedTiles.length > 0 ? biasedTiles : validTiles;

        if (targetTiles.length === 0) {
            console.error(`Could not place item '${itemChar}': no reachable tiles found for its designated room.`);
            return;
        }

        const tile = targetTiles[Math.floor(Math.random() * targetTiles.length)];
        charGrid[tile.y][tile.x] = itemChar;
    };

    // Room 0: Player start and first key
    const room0 = roomDefs[0];
    placeItem('p', roomReachableTiles[0], tile => tile.x < room0.x + Math.floor(room0.w / 2));
    placeItem(colors[0], roomReachableTiles[0]);

    // Room 1: Second key
    placeItem(colors[1], roomReachableTiles[1]);
    
    // Room 2: Third key
    placeItem(colors[2], roomReachableTiles[2]);
    
    // Room 3: Switch and Exit
    const room3 = roomDefs[3];
    placeItem('s', roomReachableTiles[3]);
    
    const exitWallCandidates = [];
    // Check left wall of room3
    for (let y = room3.y; y < room3.y + room3.h; y++) {
        if (charGrid[y]?.[room3.x] === '.') { // Check tile inside room
            exitWallCandidates.push({ x: room3.x - 1, y: y }); // Place exit on wall tile
        }
    }
    // Check bottom wall of room3
    for (let x = room3.x; x < room3.x + room3.w; x++) {
        // room3.y + room3.h is the wall coordinate. room3.y + room3.h - 1 is the floor tile inside.
        if (charGrid[room3.y + room3.h - 1]?.[x] === '.') {
            exitWallCandidates.push({ x: x, y: room3.y + room3.h });
        }
    }

    if (exitWallCandidates.length > 0) {
        const exitPos = exitWallCandidates[Math.floor(Math.random() * exitWallCandidates.length)];
        charGrid[exitPos.y][exitPos.x] = 'e';
    } else {
        placeItem('e', roomReachableTiles[3]);
        console.warn("Could not find suitable wall for exit, placing on floor as fallback.");
    }

    // Convert char grid to engine-compatible format
    const grid = Array(totalSize).fill(null).map(() => Array(totalSize).fill(0));
    const placedDoors: { x: number, y: number, orientation: 'horizontal' | 'vertical', color: string }[] = [];
    const placedKeys: { x: number, y: number, color: string }[] = [];
    let placedExit = { x: 0, y: 0 };
    let placedSwitch = { x: 0, y: 0 };
    let spawn = { x: 0, y: 0 };

    const colorMap: { [key: string]: string } = { r: 'red', b: 'blue', g: 'green' };
    const doorColorMap: { [key: string]: string } = { R: 'red', B: 'blue', G: 'green' };

    for (let y = 0; y < totalSize; y++) {
        for (let x = 0; x < totalSize; x++) {
            const char = charGrid[y][x];
            if (char === 'e') {
                placedExit = { x, y };
                grid[x][y] = 0;
            } else if (char === '#') {
                grid[x][y] = 0; // Wall
            } else {
                grid[x][y] = 1; // Floor
                
                if (char === 'p') spawn = { x, y };
                else if (char === 's') placedSwitch = { x, y };
                else if (colors.includes(char)) {
                    placedKeys.push({ x, y, color: colorMap[char] });
                } else if (doorChars.includes(char)) {
                    // Doors in vertical walls ('h' type connection, R and G) are 'horizontal'.
                    // Doors in horizontal walls ('v' type connection, B) are 'vertical'.
                    const orientation = char === 'B' ? 'vertical' : 'horizontal';
                    placedDoors.push({ x, y, orientation, color: doorColorMap[char] });
                }
            }
        }
    }
    
    const rooms: Room[] = roomDefs.map((def, i) => ({
        x: def.x, y: def.y, width: def.w, height: def.h, id: i,
        connections: new Set<number>(),
        archetype: def.type === 'maze' ? 'maze' : 'open_arena'
    }));

    rooms[0].connections.add(1); rooms[1].connections.add(0);
    rooms[1].connections.add(2); rooms[2].connections.add(1);
    rooms[2].connections.add(3); rooms[3].connections.add(2);
    
    return {
        grid,
        rooms,
        doors: placedDoors,
        keys: placedKeys,
        exit: placedExit,
        switch: placedSwitch,
        spawn: spawn,
        keyColors: ['red', 'blue', 'green'],
    };
};
