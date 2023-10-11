import Action               from "./Action"
import Renderer             from "./Renderer"

import { rotatedVec2,
         degreesToRadians } from "ts/util/math"

interface Line {
    fromX: number
    fromY: number
    toX:   number
    toY:   number
}

interface Rect {
    x:      number
    y:      number
    width:  number
    height: number
}

interface State {
    x:     number
    y:     number
    angle: number
}

export default class CanvasRenderer implements Renderer{
    readonly canvas: HTMLCanvasElement

    lineWidth = 1
    paddingX  = 25
    paddingY  = 25

    private ctx:           CanvasRenderingContext2D
    private baseLineScale: number = 100

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        const ctx = this.canvas.getContext("2d")

        if (ctx == null)
            throw new Error("Canvas 2D rendering context isn't available")

        this.ctx = ctx
    }

    render(actions: Action[]) {
        this.canvas.width  = this.canvas.offsetWidth
        this.canvas.height = this.canvas.offsetHeight

        this.baseLineScale = Math.max(this.canvas.width, this.canvas.height)

        const lines       = this.createLines(actions)
        const boundingBox = this.evalLinesBoundingBox(lines)

        const effectiveCanvasWidth  = this.canvas.width  - 2 * this.paddingX
        const effectiveCanvasHeight = this.canvas.height - 2 * this.paddingY

        if (boundingBox.width > effectiveCanvasWidth) {
            const scale = effectiveCanvasWidth / boundingBox.width

            this.scaleLines(lines, scale)
            this.scaleRect(boundingBox, scale)
        }

        if (boundingBox.height > effectiveCanvasHeight) {
            const scale = effectiveCanvasHeight / boundingBox.height

            this.scaleLines(lines, scale)
            this.scaleRect(boundingBox, scale)
        }

        this.moveLines(
            lines,
            this.paddingX - boundingBox.x + .5 * (effectiveCanvasWidth  - boundingBox.width ),
            this.paddingY - boundingBox.y + .5 * (effectiveCanvasHeight - boundingBox.height),
        )

        this.drawLines(lines)
    }

    private createLines(actions: Action[]): Line[] {
        const lines:  Line[]  = []
        const states: State[] = [{
            x:     0,
            y:     0,
            angle: 0,
        }]

        for (const action of actions) {
            switch (action.type) {
                case "draw-line":
                    const lastState = states[states.length - 1]
                    const angle     = degreesToRadians(lastState.angle)
                    const delta     = rotatedVec2(this.baseLineScale * action.scale, angle)
                    const fromX     = lastState.x
                    const fromY     = lastState.y
                    const toX       = fromX + delta.x
                    const toY       = fromY + delta.y

                    lines.push({
                        fromX,
                        fromY,
                        toX,
                        toY,
                    })

                    lastState.x = toX
                    lastState.y = toY

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

    private evalLinesBoundingBox(lines: Line[]): Rect {
        let minX = 0
        let minY = 0
        let maxX = 0
        let maxY = 0

        for (const line of lines) {
            minX = Math.min(minX, line.fromX, line.toX)
            minY = Math.min(minY, line.fromY, line.toY)
            maxX = Math.max(maxX, line.fromX, line.toX)
            maxY = Math.max(maxY, line.fromY, line.toY)
        }

        return {
            x:      minX,
            y:      minY,
            width:  maxX - minX,
            height: maxY - minY,
        }
    }

    private moveLines(lines: Line[], deltaX: number, deltaY: number) {
        for (const line of lines) {
            line.fromX += deltaX
            line.fromY += deltaY
            line.toX   += deltaX
            line.toY   += deltaY
        }
    }

    private scaleLines(lines: Line[], scale: number) {
        for (const line of lines) {
            line.fromX *= scale
            line.fromY *= scale
            line.toX   *= scale
            line.toY   *= scale
        }
    }

    private scaleRect(boundingBox: Rect, scale: number) {
        boundingBox.x      *= scale
        boundingBox.y      *= scale
        boundingBox.width  *= scale
        boundingBox.height *= scale
    }

    private drawLines(lines: Line[]) {
        this.ctx.save()

        this.ctx.lineWidth = this.lineWidth

        this.ctx.beginPath()

        for (const { fromX, fromY, toX, toY } of lines) {
            this.ctx.moveTo(fromX, fromY)
            this.ctx.lineTo(toX,   toY  )
        }

        this.ctx.stroke()

        this.ctx.restore()
    }
}