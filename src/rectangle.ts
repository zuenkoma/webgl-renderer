import type Color from './color.ts';
import Drawable, { type DrawableOptions } from './drawable.ts';
import { createShadersProgram, deleteShadersProgram } from './shaders.ts';

const vertexShader = `
attribute vec2 a_position;

uniform mat4 u_matrix;
uniform vec4 u_color;

varying vec4 v_color;

void main() {
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
    v_color = u_color;
}
`;

const fragmentShader = `
precision mediump float;

varying vec4 v_color;
uniform float u_opacity;

void main() {
    gl_FragColor = vec4(v_color.rgb, v_color.a * u_opacity);
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

export default class Rectangle extends Drawable {
    width: number;
    height: number;
    color: Color;

    protected static shaders: WeakMap<WebGLRenderingContext, {
        program: WebGLProgram;
        attributes: Record<string, number>;
        uniforms: Record<string, WebGLUniformLocation>;
        buffers: Record<string, WebGLBuffer>;
    }> = new WeakMap();

    constructor(width: number, height: number, color: Color, options: DrawableOptions = {}) {
        super(options);
        this.width = width;
        this.height = height;
        this.color = color;
    }

    getSize() {
        return {
            width: this.width,
            height: this.height
        };
    }

    render(ctx: WebGLRenderingContext, transform: DOMMatrix, opacity: number) {
        let shader = Rectangle.shaders.get(ctx);
        if (!shader) {
            const program = createShadersProgram(ctx, vertexShader, fragmentShader)!;

            const position = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, position);
            ctx.bufferData(ctx.ARRAY_BUFFER, positions, ctx.STATIC_DRAW);

            shader = {
                program,
                attributes: {
                    position: ctx.getAttribLocation(program, 'a_position')
                },
                uniforms: {
                    matrix: ctx.getUniformLocation(program, 'u_matrix')!,
                    color: ctx.getUniformLocation(program, 'u_color')!,
                    opacity: ctx.getUniformLocation(program, 'u_opacity')!
                },
                buffers: {
                    position
                }
            };
            Rectangle.shaders.set(ctx, shader);
        }

        ctx.useProgram(shader.program);

        ctx.bindBuffer(ctx.ARRAY_BUFFER, shader.buffers.position);
        ctx.enableVertexAttribArray(shader.attributes.position);
        ctx.vertexAttribPointer(shader.attributes.position, 2, ctx.FLOAT, false, 0, 0);

        const size = this.getSize();
        ctx.uniformMatrix4fv(
            shader.uniforms.matrix,
            false,
            this.getTransform(transform)
                .scaleSelf(size.width / 2, size.height / 2)
                .toFloat32Array()
        );

        ctx.uniform4f(
            shader.uniforms.color,
            this.color.r,
            this.color.g,
            this.color.b,
            this.color.a
        );

        ctx.uniform1f(shader.uniforms.opacity, opacity * this.opacity);

        ctx.drawArrays(ctx.TRIANGLES, 0, 6);

        super.render(ctx, transform, opacity);
    }

    unloadShaders(ctx: WebGLRenderingContext) {
        const shader = Rectangle.shaders.get(ctx);
        if (shader) {
            deleteShadersProgram(ctx, shader.program);
            ctx.deleteBuffer(shader.buffers.position);
            ctx.deleteBuffer(shader.buffers.texCoords);
            Rectangle.shaders.delete(ctx);
        }
    }
}