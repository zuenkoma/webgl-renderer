export class Color {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;

    constructor(r: number, g: number, b: number, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}