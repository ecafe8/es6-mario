import {Matrix} from '../math.js'
import Level from '../Level.js'
import {loadJSON, loadSpriteSheet} from '../loader.js'
import {createBackgroundLayer, createSpriteLayer} from '../layers.js'

function setupLevel(levelSpec, level) {
    const mergedCollisionGrid = levelSpec.layers.reduce((mergedTiles, layerSpec) => {
        return mergedTiles.concat(layerSpec.tiles);
    }, []);

    const collisionGrid = createCollisionGrid(mergedCollisionGrid, levelSpec.patterns);
    level.setCollisionGrid(collisionGrid);
}

function setupBackground(levelSpec, level, backgroundSprites) {
    levelSpec.layers.forEach(layer => {
        const backgroundGrid = createBackgroundGrid(layer.tiles, levelSpec.patterns);
        const backgroundLayer = createBackgroundLayer(level, backgroundGrid, backgroundSprites);
        level.comp.layers.push(backgroundLayer);
    });
}

function setupEntities(levelSpec, level, entityFactory) {
    levelSpec.entities.forEach(({name, pos: [x,y]}) => {
        // console.log(name, x,y);
        const createEntity = entityFactory[name];
        const entity = createEntity();
        entity.pos.set(x, y);
        level.entities.add(entity);
    });

    const spriteLayer = createSpriteLayer(level.entities);
    level.comp.layers.push(spriteLayer);
}

export function createLevelLoader(entityFactory) {
    return function loadLevel(name) {
        return loadJSON(`../levels/${name}.json`)
            .then(levelSpec => Promise.all([
                levelSpec,
                loadSpriteSheet(levelSpec.spriteSheet)
            ]))
            .then(([levelSpec, backgroundSprites]) => {
                const level = new Level();

                setupLevel(levelSpec, level);
                setupBackground(levelSpec, level, backgroundSprites);
                setupEntities(levelSpec, level, entityFactory);

                return level;
            })
    }
}

function createCollisionGrid(tiles, patterns) {
    const grid = new Matrix();

    for (const {tile, x, y} of expandTiles(tiles, patterns)) {
        grid.set(x, y, {type: tile.type})
    }

    return grid;
}

function createBackgroundGrid(tiles, patterns) {
    const grid = new Matrix();

    for (const {tile, x, y} of expandTiles(tiles, patterns)) {
        grid.set(x, y, {name: tile.name})
    }

    return grid;
}

// ES6 Generator Function
function* expandSpan(xStart, xLen, yStart, yLen) {
    // debugger
    // const coords = [];
    const xEnd = xStart + xLen;
    const yEnd = yStart + yLen;
    for (let x = xStart; x < xEnd; x++) {
        for (let y = yStart; y < yEnd; y++) {
            // coords.push({x, y});
            yield {x, y};
            // create a Iterator Object for the following for...of
        }
    }

    // return coords;
}

function expandRange(range) {
    if (range.length === 4) {
        const [xStart, xLen, yStart, yLen] = range;
        return expandSpan(xStart, xLen, yStart, yLen)
    } else if (range.length === 3) {
        const [xStart, xLen, yStart] = range;
        return expandSpan(xStart, xLen, yStart, 1)
    } else if (range.length === 2) {
        const [xStart, yStart] = range;
        return expandSpan(xStart, 1, yStart, 1)
    }
}

function* expandRanges(ranges) {
    for (const range of ranges) {
        yield* expandRange(range);
    }
}

function* expandTiles(tiles, patterns) {
    // let expandedTiles = [];

    function* walkTiles(tiles, offsetX, offsetY) {
        for (const tile of tiles) {
            for (const {x, y} of expandRanges(tile.ranges)) {
                /* http://es6.ruanyifeng.com/?search=yield&x=0&y=0#docs/generator#for---of-%E5%BE%AA%E7%8E%AF
                 Use for...of to iterate the Iterator Object generated by the yield of Generator Function.*/
                const derivedX = x + offsetX;
                const derivedY = y + offsetY;

                // debugger
                if (tile.pattern) {
                    // console.log(patterns[tile.pattern]);
                    const tiles = patterns[tile.pattern].tiles;
                    // createTiles(level, tiles, patterns, derivedX, derivedY);
                    /*TODO:Figure out th useage of yield**/
                    yield* walkTiles(tiles, derivedX, derivedY);
                } else {
                    yield {
                        tile,
                        x: derivedX,
                        y: derivedY
                    };
                    // expandedTiles.push({
                    //     tile,
                    //     x: derivedX,
                    //     y: derivedY
                    // });
                }
            }
        }
    }

    yield* walkTiles(tiles, 0, 0);

    // return expandedTiles;
}
