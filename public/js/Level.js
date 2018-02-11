import Compositor from './compositor.js'
import EntityCollider from './EntityCollider.js'
import TileCollider from './TileCollider.js'

export default class Level {
    constructor() {
        this.gravity = 1500;
        this.comp = new Compositor();
        this.entities = new Set();
        this.entityCollider = new EntityCollider(this.entities);
        this.totalTime = 0;

        this.tileCollider = null;
    }

    setCollisionGrid(matrix) {
        this.tileCollider = new TileCollider(matrix);
    }

    update(deltaTime) {
        this.entities.forEach(entity => {
            entity.update(deltaTime, this);

            entity.pos.x += entity.vel.x * deltaTime;
            this.tileCollider.checkX(entity);

            entity.pos.y += entity.vel.y * deltaTime;
            this.tileCollider.checkY(entity);

            entity.vel.y += this.gravity * deltaTime;
        });


        this.entities.forEach(entity => {
            this.entityCollider.check(entity);
        });

        this.totalTime += deltaTime;
    }
}