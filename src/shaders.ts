function createShader(ctx: WebGLRenderingContext, type: number, source: string) {
    const shader = ctx.createShader(type);
    if (!shader) {
        console.error('Failed to create shader.');
        return null;
    }
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    if (ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        return shader;
    }
    console.error(ctx.getShaderInfoLog(shader));
    ctx.deleteShader(shader);
    return null;
}

function createProgram(ctx: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = ctx.createProgram();
    ctx.attachShader(program, vertexShader);
    ctx.attachShader(program, fragmentShader);
    ctx.linkProgram(program);
    if (ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        return program;
    }
    console.error(ctx.getProgramInfoLog(program));
    ctx.deleteProgram(program);
    return null;
}

export function createShadersProgram(ctx: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
    const vertexShader = createShader(ctx, ctx.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) return null;
    const fragmentShader = createShader(ctx, ctx.FRAGMENT_SHADER, fragmentShaderSource);
    if (!fragmentShader) return null;
    const program = createProgram(ctx, vertexShader, fragmentShader);
    ctx.deleteShader(vertexShader);
    ctx.deleteShader(fragmentShader);
    return program;
}

export function deleteShadersProgram(ctx: WebGLRenderingContext, program: WebGLProgram) {
    if (ctx.getParameter(ctx.CURRENT_PROGRAM) === program) {
        ctx.useProgram(null);
    }
    ctx.deleteProgram(program);
}