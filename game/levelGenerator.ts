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

// Generate full level in a square layout with snake-pattern rooms
export const generateLevel = () => {
    const totalSize = MAP_WIDTH;
    let charGrid = Array(totalSize).fill(null).map(() => Array(totalSize).fill('#'));

    const colors = ['r', 'b', 'g'];
    const doorChars = ['R', 'B', 'G'];

    const roomDefs = [
        { x: 1, y: 1, w: 12, h: 12, type: 'open' },
        { x: 14, y: 1, w: 12, h: 12, type: 'maze' },
        { x: 14, y: 14, w: 12, h: 12, type: 'open' },
        { x: 1, y: 14, w: 12, h: 12, type: 'maze' }
    ];

    const placeItem = (room: { x: number, y: number, w: number, h: number }, level: string[][], itemChar: string, biasStart = 0, biasEnd = room.w - 1) => {
        let attempts = 0;
        while (attempts < 200) {
            const relX = Math.floor(Math.random() * (biasEnd - biasStart + 1)) + biasStart;
            const relY = Math.floor(Math.random() * (room.h - 4)) + 2;
            const absX = room.x + relX;
            const absY = room.y + relY;
            if (level[absY]?.[absX] === '.') {
                level[absY][absX] = itemChar;
                return;
            }
            attempts++;
        }
        // Fallback
        for (let relY = 1; relY < room.h - 1; relY++) {
            for (let relX = biasStart; relX <= biasEnd; relX++) {
                const absX = room.x + relX;
                const absY = room.y + relY;
                if (level[absY]?.[absX] === '.') {
                    level[absY][absX] = itemChar;
                    return;
                }
            }
        }
    };

    for (let roomIndex = 0; roomIndex < 4; roomIndex++) {
        const room = roomDefs[roomIndex];
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

        let items: string[] = [];
        if (roomIndex === 0) items = ['p', colors[0]];
        else if (roomIndex === 3) items = ['s', 'e'];
        else items = [colors[roomIndex]];
        
        for (let item of items) {
            let biasStart = 0;
            let biasEnd = room.w - 1;
            if (item === 'p') biasEnd = Math.floor(room.w / 2);
            else if (item === 'e') biasStart = Math.floor(room.w / 2);
            placeItem(room, charGrid, item, biasStart, biasEnd);
        }
    }

    const connections = [
        { type: 'h', wallX: 13, yStart: 1, yEnd: 12, door: 'R' },
        { type: 'v', wallY: 13, xStart: 14, xEnd: 25, door: 'B' },
        { type: 'h', wallX: 13, yStart: 14, yEnd: 25, door: 'G' }
    ];

    const openingSize = 4;
    for (let conn of connections) {
        if (conn.type === 'h') {
            const rangeSize = conn.yEnd - conn.yStart + 1;
            const startY = conn.yStart + Math.floor(Math.random() * (rangeSize - openingSize + 1));
            for (let dy = 0; dy < openingSize; dy++) {
                const y = startY + dy;
                if (y >= 0 && y < totalSize && conn.wallX >= 0 && conn.wallX < totalSize) {
                    charGrid[y][conn.wallX] = conn.door;
                    if (conn.wallX - 1 >= 0) charGrid[y][conn.wallX - 1] = '.';
                    if (conn.wallX - 2 >= 0) charGrid[y][conn.wallX - 2] = '.';
                    if (conn.wallX + 1 < totalSize) charGrid[y][conn.wallX + 1] = '.';
                    if (conn.wallX + 2 < totalSize) charGrid[y][conn.wallX + 2] = '.';
                }
            }
        } else {
            const rangeSize = conn.xEnd - conn.xStart + 1;
            const startX = conn.xStart + Math.floor(Math.random() * (rangeSize - openingSize + 1));
            for (let dx = 0; dx < openingSize; dx++) {
                const x = startX + dx;
                if (x >= 0 && x < totalSize && conn.wallY >= 0 && conn.wallY < totalSize) {
                    charGrid[conn.wallY][x] = conn.door;
                    if (conn.wallY - 1 >= 0) charGrid[conn.wallY - 1][x] = '.';
                    if (conn.wallY - 2 >= 0) charGrid[conn.wallY - 2][x] = '.';
                    if (conn.wallY + 1 < totalSize) charGrid[conn.wallY + 1][x] = '.';
                    if (conn.wallY + 2 < totalSize) charGrid[conn.wallY + 2][x] = '.';
                }
            }
        }
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
            if (char === '#') {
                grid[x][y] = 0; // Wall
            } else {
                grid[x][y] = 1; // Floor
                
                if (char === 'p') spawn = { x, y };
                else if (char === 'e') placedExit = { x, y };
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