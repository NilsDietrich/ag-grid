export class HdpiCanvas {
    constructor(width = 300, height = 150) {
        this.updatePixelRatio(0, false);
        this.resize(width, height);
    }

    _canvas = document.createElement('canvas');
    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    destroy() {
        this._canvas.remove();
        (this as any)._canvas = undefined;
        Object.freeze(this);
    }

    _pixelRatio: number = 1;
    get pixelRatio(): number {
        return this._pixelRatio;
    }

    private overrides: any;

    /**
     * Updates the pixel ratio of the Canvas element with the given value,
     * or uses the window.devicePixelRatio (default), then resizes the Canvas
     * element accordingly (default).
     * @param ratio
     * @param resize
     */
    updatePixelRatio(ratio = 0, resize = true) {
        const pixelRatio = ratio || window.devicePixelRatio;

        if (pixelRatio === this.pixelRatio) {
            return;
        }

        const canvas = this._canvas;
        const ctx = canvas.getContext('2d')!;
        const overrides = this.overrides = HdpiCanvas.makeHdpiOverrides(pixelRatio);
        for (const name in overrides) {
            if (overrides.hasOwnProperty(name)) {
                // Save native methods under prefixed names,
                // if this hasn't been done by previous overrides already.
                if (!(ctx as any)['$' + name]) {
                    (ctx as any)['$' + name] = (ctx as any)[name];
                }
                // Replace native methods with overrides,
                // or previous overrides with the new ones.
                (ctx as any)[name] = overrides[name];
            }
        }

        if (resize) {
            const logicalWidth = canvas.width / this.pixelRatio;
            const logicalHeight = canvas.height / this.pixelRatio;

            canvas.width = Math.round(logicalWidth * pixelRatio);
            canvas.height = Math.round(logicalHeight * pixelRatio);
            canvas.style.width = Math.round(logicalWidth) + 'px';
            canvas.style.height = Math.round(logicalHeight) + 'px';

            ctx.resetTransform(); // should be called every time Canvas size changes
        }

        this._pixelRatio = pixelRatio;
    }

    resize(width: number, height: number) {
        const canvas = this.canvas;

        canvas.width = Math.round(width * this.pixelRatio);
        canvas.height = Math.round(height * this.pixelRatio);
        canvas.style.width = Math.round(width) + 'px';
        canvas.style.height = Math.round(height) + 'px';

        canvas.getContext('2d')!.resetTransform();
    }

    // 2D canvas context for measuring text.
    private static readonly ctx: CanvasRenderingContext2D = (() => {
        const canvas = document.createElement('canvas');
        return canvas.getContext('2d')!;
    })();

    // Offscreen <span> element for measuring text, if canvas context lacks the support.
    private static readonly span = (() => {
        const span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.top = '-10000px';
        document.body.append(span);
        return span;
    })();

    static readonly supports = Object.freeze({
        textMetrics: HdpiCanvas.ctx.measureText('test')
            .actualBoundingBoxDescent !== undefined,
        getTransform: HdpiCanvas.ctx.getTransform !== undefined
    });

    static measureText(text: string, font: string,
                       textBaseline: CanvasTextBaseline,
                       textAlign: CanvasTextAlign): TextMetrics {
        const ctx = HdpiCanvas.ctx;
        ctx.font = font;
        ctx.textBaseline = textBaseline;
        ctx.textAlign = textAlign;
        return ctx.measureText(text);
    }

    /**
     * Returns the width and height of the measured text.
     * @param text The single-line text to measure.
     * @param font The font shorthand string.
     */
    static getTextSize(text: string, font: string): { width: number, height: number } {
        if (HdpiCanvas.supports.textMetrics) {
            HdpiCanvas.ctx.font = font;
            const metrics = HdpiCanvas.ctx.measureText(text);
            return {
                width: metrics.width,
                height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
            };
        } else { // the fallback is at least 25 times slower
            HdpiCanvas.span.style.font = font;
            HdpiCanvas.span.style.lineHeight = '1em';
            HdpiCanvas.span.textContent = text;
            const metrics = HdpiCanvas.span.getBoundingClientRect();
            return {
                width: metrics.width,
                height: metrics.height
            };
        }
    }

    private static makeHdpiOverrides(pixelRatio: number) {
        let depth = 0;
        return {
            save() {
                this.$save();
                depth++;
            },
            restore() {
                if (depth > 0) {
                    this.$restore();
                    depth--;
                }
            },
            resetTransform() {
                // As of Jan 8, 2019, `resetTransform` is still an "experimental technology",
                // and doesn't work in IE11 and Edge 44.
                // this.$resetTransform();
                this.setTransform(1, 0, 0, 1, 0, 0);
                this.scale(pixelRatio, pixelRatio);
                this.save();
                depth = 0;
                // The scale above will be impossible to restore,
                // because we override the `ctx.restore` above and
                // check `depth` there.
            }
        } as any;
    }
}