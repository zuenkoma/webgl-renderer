import { PivotX, PivotY } from './pivot.ts';

export interface DrawableOptions {
    x?: number;
    y?: number;
    rotation?: number;

    layer?: number;
    opacity?: number;

    pivotX?: number;
    pivotY?: number;

    scaleX?: number;
    scaleY?: number;
}

export default class Drawable {
    private children: Drawable[] = [];

    x: number;
    y: number;
    rotation: number;

    layer: number;
    opacity: number;

    pivotX: number;
    pivotY: number;

    scaleX: number;
    scaleY: number;

    constructor({
        x = 0, y = 0, rotation = 0,
        layer = 0, opacity = 1,
        pivotX = PivotX.CENTER, pivotY = PivotY.CENTER,
        scaleX = 1, scaleY = 1
    }: DrawableOptions = {}) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;

        this.layer = layer;
        this.opacity = opacity;

        this.pivotX = pivotX;
        this.pivotY = pivotY;

        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }

    addChild(child: Drawable) {
        this.children.push(child);
    }
    removeChild(child: Drawable) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
    }

    getSize() {
        return { width: 0, height: 0 };
    }

    getTransform(transform = new DOMMatrix()) {
        const { width, height } = this.getSize();
        return transform
            .translate(this.x, this.y)
            .rotateSelf(this.rotation)
            .scaleSelf(this.scaleX, this.scaleY)
            .translateSelf(-this.pivotX * width / 2, -this.pivotY * height / 2);
    }

    update(dt: number) {
        for (const child of this.children.sort((a, b) => a.layer - b.layer)) {
            child.update(dt);
        }
    }

    render(ctx: WebGLRenderingContext, transform: DOMMatrix, opacity: number) {
        const newTransform = this.getTransform(transform);
        for (const child of this.children.sort((a, b) => a.layer - b.layer)) {
            child.render(ctx, newTransform, opacity * this.opacity);
        }
    }

    unloadShaders(_ctx: WebGLRenderingContext) { }
}