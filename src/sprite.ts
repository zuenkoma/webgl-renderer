import Drawable, { type DrawableOptions } from './drawable.ts';
import { createShadersProgram, deleteShadersProgram } from './shaders.ts';
import type Texture from './texture.ts';

const vertexShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_matrix;

varying vec2 v_texCoord;

void main() {
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

const fragmentShader = `
precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_opacity;

void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    gl_FragColor = vec4(texColor.rgb, texColor.a * u_opacity);
}
`;

const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
]);

export interface SpriteOptions extends DrawableOptions {
    frame?: number;
    frameDuration?: number;
}

export default class Sprite extends Drawable {
    texture: Texture;
    frame: number;
    frameDuration: number;
    protected frameTimer = 0;

    protected static shaders: WeakMap<WebGLRenderingContext, {
        program: WebGLProgram;
        attributes: Record<string, number>;
        uniforms: Record<string, WebGLUniformLocation>;
        buffers: Record<string, WebGLBuffer>;
    }> = new WeakMap();

    constructor(texture: Texture, { frame = 0, frameDuration = 100, ...options }: SpriteOptions = {}) {
        super(options);
        this.texture = texture;
        this.frame = frame % texture.frames;
        this.frameDuration = frameDuration;
    }

    getSize() {
        return this.texture.getSize();
    }

    update(dt: number) {
        this.frameTimer += dt;
        while (this.frameTimer >= this.frameDuration) {
            this.frameTimer -= this.frameDuration;
            this.frame = (this.frame + 1) % this.texture.frames;
        }
        super.update(dt);
    }

    render(ctx: WebGLRenderingContext, transform: DOMMatrix, opacity: number) {
        let shader = Sprite.shaders.get(ctx);
        if (!shader) {
            const program = createShadersProgram(ctx, vertexShader, fragmentShader)!;

            const position = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, position);
            ctx.bufferData(ctx.ARRAY_BUFFER, positions, ctx.STATIC_DRAW);

            shader = {
                program,
                attributes: {
                    position: ctx.getAttribLocation(program, 'a_position'),
                    texCoord: ctx.getAttribLocation(program, 'a_texCoord')
                },
                uniforms: {
                    matrix: ctx.getUniformLocation(program, 'u_matrix')!,
                    texture: ctx.getUniformLocation(program, 'u_texture')!,
                    opacity: ctx.getUniformLocation(program, 'u_opacity')!
                },
                buffers: {
                    position,
                    texCoords: ctx.createBuffer()!
                }
            };
            Sprite.shaders.set(ctx, shader);
        }

        ctx.useProgram(shader.program);
        ctx.bindTexture(ctx.TEXTURE_2D, this.texture.getGlTexture(ctx));

        ctx.bindBuffer(ctx.ARRAY_BUFFER, shader.buffers.position);
        ctx.enableVertexAttribArray(shader.attributes.position);
        ctx.vertexAttribPointer(shader.attributes.position, 2, ctx.FLOAT, false, 0, 0);

        const rect = this.texture.getRect(this.frame);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, shader.buffers.texCoords);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([
            rect.x, rect.y + rect.height,
            rect.x + rect.width, rect.y + rect.height,
            rect.x, rect.y,
            rect.x, rect.y,
            rect.x + rect.width, rect.y + rect.height,
            rect.x + rect.width, rect.y
        ]), ctx.DYNAMIC_DRAW);
        ctx.enableVertexAttribArray(shader.attributes.texCoord);
        ctx.vertexAttribPointer(shader.attributes.texCoord, 2, ctx.FLOAT, false, 0, 0);

        const size = this.getSize();
        ctx.uniformMatrix4fv(
            shader.uniforms.matrix,
            false,
            this.getTransform(transform)
                .scaleSelf(size.width / 2, size.height / 2)
                .toFloat32Array()
        );
        ctx.uniform1f(shader.uniforms.opacity, opacity * this.opacity);

        ctx.drawArrays(ctx.TRIANGLES, 0, 6);

        super.render(ctx, transform, opacity);
    }

    unloadShaders(ctx: WebGLRenderingContext) {
        const shader = Sprite.shaders.get(ctx);
        if (shader) {
            deleteShadersProgram(ctx, shader.program);
            ctx.deleteBuffer(shader.buffers.position);
            ctx.deleteBuffer(shader.buffers.texCoords);
            Sprite.shaders.delete(ctx);
        }
    }
}