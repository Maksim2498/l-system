import DeepReadonly from "./DeepReadonly"
import Vec2         from "./Vec2"

import * as vec2    from "./Vec2"


export interface Line {
    from: Vec2
    to:   Vec2
}

export interface ReadonlyLine extends DeepReadonly<Line> {}

export default Line


export function moveArray(lines: Line[], delta: vec2.ReadonlyVec2): Line[] {
    for (let i = 0; i < lines.length; ++i)
        move(lines[i], delta)

    return lines
}

export function move(line: Line, delta: vec2.ReadonlyVec2): Line {
    vec2.add(line.from, delta)
    vec2.add(line.to,   delta)

    return line
}

export function scaleArray(lines: Line[], factor: number): Line[] {
    for (let i = 0; i < lines.length; ++i)
        scale(lines[i], factor)

    return lines
}

export function scale(line: Line, factor: number): Line {
    vec2.mul(line.from, factor)
    vec2.mul(line.to,   factor)

    return line
}

export function arrayToPoints(lines: Line[]): Vec2[] {
    return lines.map(line => toPoints(line))
                .flat()
}

export function toPoints(line: Line): [Vec2, Vec2] {
    return [line.from, line.to]
}