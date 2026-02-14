const imageCache: Record<string, HTMLImageElement> = {};
const textureCache: Record<string, Texture> = {};

export default class Texture {
    readonly image: HTMLImageElement;
    readonly antialias: boolean;
    readonly frames: number;
    private glTextures: WeakMap<WebGLRenderingContext, WebGLTexture> = new WeakMap();

    constructor(image: HTMLImageElement, { antialias = false, frames = 1 } = {}) {
        this.image = image;
        this.antialias = antialias;
        this.frames = frames;
    }

    getSize() {
        return {
            width: this.image.width / this.frames,
            height: this.image.height
        };
    }
    getRect(frame = 0) {
        frame %= this.frames;
        return {
            x: frame / this.frames,
            y: 0,
            width: 1 / this.frames,
            height: 1
        };
    }

    getGlTexture(ctx: WebGLRenderingContext) {
        let glTexture = this.glTextures.get(ctx);

        if (!glTexture) {
            glTexture = ctx.createTexture();
            ctx.bindTexture(ctx.TEXTURE_2D, glTexture);
            ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, this.image);

            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, this.antialias ? ctx.LINEAR : ctx.NEAREST);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, this.antialias ? ctx.LINEAR : ctx.NEAREST);

            this.glTextures.set(ctx, glTexture);
        }

        return glTexture;
    }

    unloadGlTexture(ctx: WebGLRenderingContext) {
        const glTexture = this.glTextures.get(ctx);
        if (!glTexture) return;
        ctx.deleteTexture(glTexture);
        this.glTextures.delete(ctx);
    }

    static async load(src: string, { antialias = true, frames = 1 } = {}) {
        if (!imageCache[src]) {
            imageCache[src] = new Image();
            imageCache[src].src = src;
        }
        await imageCache[src].decode();
        if (!textureCache[src]) {
            textureCache[src] = new Texture(imageCache[src], { antialias, frames });
        }
        return textureCache[src];
    }
}