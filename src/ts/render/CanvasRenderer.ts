import Renderer    from "./Renderer"
import Vec2        from "ts/util/Vec2"
import Line        from "ts/util/Line"

import * as math   from "ts/util/math"
import * as vec2   from "ts/util/Vec2"
import * as line   from "ts/util/Line"
import * as rect   from "ts/util/Rect"
import * as action from "./Action"


interface State {
    pos:   Vec2
    angle: number
}


interface LineWithWidth extends Line {
    width: number
}

interface ReadonlyLineWithWidth extends Readonly<LineWithWidth> {}


export default class CanvasRenderer implements Renderer{
    padding: Vec2 = [25, 25]

    private ctx:           CanvasRenderingContext2D
    private baseLineScale: number = 100

    constructor(public readonly canvas: HTMLCanvasElement) {
        const ctx = this.canvas.getContext("2d")

        if (ctx == null)
            throw new Error("Canvas 2D rendering context isn't available")

        this.ctx = ctx
    }

    render(actions: action.ReadonlyAction[]) {
        this.canvas.width  = this.canvas.offsetWidth
        this.canvas.height = this.canvas.offsetHeight

        this.baseLineScale = Math.max(this.canvas.width, this.canvas.height)

        const lines       = this.createLines(actions)
        const linesPoints = line.arrayToPoints(lines)
        const boundingBox = rect.evalBoundingBox(linesPoints)

        const effectiveCanvasSize = vec2.sub(
            [this.canvas.width, this.canvas.height],
            vec2.prod(this.padding, 2),
        )

        for (let i = 0; i < 2; ++i)
            if (boundingBox.size[i] > effectiveCanvasSize[i]) {
                const scale = effectiveCanvasSize[i] / boundingBox.size[i]

                line.scaleArray(lines, scale)
                rect.scale(boundingBox, scale)
            }

        // padding - boundingBox.pos + 0.5*(effectiveCanvasSize - boundingBox.size)
        const linesPosDelta = vec2.add(
            vec2.diff(this.padding, boundingBox.pos),
            vec2.mul(
                vec2.diff(effectiveCanvasSize, boundingBox.size),
                .5,
            ),
        )

        line.moveArray(lines, linesPosDelta)

        this.drawLines(lines)
    }

    private createLines(actions: action.ReadonlyAction[]): LineWithWidth[] {
        const lines:  LineWithWidth[] = []
        const states: State[]         = [{
            pos:   [0, 0],
            angle: 0,
        }]

        for (const action of actions) {
            switch (action.type) {
                case "draw-line":
                    const width     = action.width
                    const lastState = states[states.length - 1]
                    const angle     = math.degreesToRadians(lastState.angle)
                    const scale     = this.baseLineScale * action.scale
                    const delta     = vec2.rotated(scale, angle)
                    const from      = vec2.copy(lastState.pos)
                    const to        = vec2.sum(from, delta)

                    lines.push({ from, to, width })

                    lastState.pos = vec2.copy(to)

                    break

                case "turn":
                    states[states.length - 1].angle += action.angle
                    break

                case "save":
                    states.push({ ...states[states.length - 1] })
                    break

                case "restore":
                    if (states.length > 1)
                        states.pop()

                    break

                default:
                    const _: never = action
            }
        }

        return lines
    }

    private drawLines(lines: ReadonlyLineWithWidth[]) {
        this.ctx.save()

        for (const { from, to, width } of lines) {
            this.ctx.lineWidth = width

            if (width === 0) {
                this.ctx.moveTo(from[0], from[1])
                continue
            }

            this.ctx.beginPath()
            this.ctx.moveTo(from[0], from[1])
            this.ctx.lineTo(  to[0],   to[1])
            this.ctx.stroke()
        }

        this.ctx.restore()
    }
}