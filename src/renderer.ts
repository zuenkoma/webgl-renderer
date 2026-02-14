import type Drawable from './drawable.ts';

export default class Renderer {
    readonly canvas: HTMLCanvasElement;
    protected ctx: WebGLRenderingContext;

    constructor(canvas: HTMLCanvasElement, antialias = true) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('webgl', { antialias })! || this.canvas.getContext('experimental-webgl', { antialias })!;

        this.ctx.enable(this.ctx.BLEND);
        this.ctx.blendFunc(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA);

        new MutationObserver(() => {
            this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
        }).observe(this.canvas, { attributes: true });
    }

    update(root: Drawable, dt: number) {
        root.update(dt);
    }

    render(root: Drawable) {
        root.render(
            this.ctx,
            new DOMMatrix().scaleSelf(
                2 / this.canvas.width,
                2 / this.canvas.height
            ),
            1
        );
    }
}