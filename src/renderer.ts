import Color from './color.ts';
import type Drawable from './drawable.ts';

export interface RendererOptions {
    antialias?: boolean;
    clearColor?: Color;
}

export default class Renderer {
    readonly canvas: HTMLCanvasElement;
    protected ctx: WebGLRenderingContext;

    protected _clearColor!: Color;

    constructor(canvas: HTMLCanvasElement, { antialias = true, clearColor = new Color(0, 0, 0, 0) }: RendererOptions) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('webgl', { antialias })! || this.canvas.getContext('experimental-webgl', { antialias })!;
        this.clearColor = clearColor;

        this.ctx.enable(this.ctx.BLEND);
        this.ctx.blendFunc(this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA);

        new MutationObserver(() => {
            this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
        }).observe(this.canvas, { attributes: true });
    }

    get clearColor() {
        return this._clearColor;
    }
    set clearColor(color: Color) {
        this._clearColor = color;
        this.ctx.clearColor(color.r, color.g, color.b, color.a);
    }

    update(root: Drawable, dt: number) {
        root.update(dt);
    }

    render(root: Drawable) {
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
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