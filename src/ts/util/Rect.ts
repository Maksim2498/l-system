import DeepReadonly from "./DeepReadonly"
import Vec2         from "./Vec2"

import * as vec2 from "./Vec2"


export interface Rect {
    pos:  Vec2
    size: Vec2
}

export interface ReadonlyRect extends DeepReadonly<Rect> {}

export default Rect


export function evalBoundingBox(points: vec2.ReadonlyVec2[]): Rect {
    let minX =  Number.MAX_VALUE
    let minY =  Number.MAX_VALUE
    let maxX = -Number.MAX_VALUE
    let maxY = -Number.MAX_VALUE

    for (const point of points) {
        minX = Math.min(minX, point[0])
        minY = Math.min(minY, point[1])
        maxX = Math.max(maxX, point[0])
        maxY = Math.max(maxY, point[1])
    }

    return {
        pos:  [minX,        minY       ],
        size: [maxX - minX, maxY - minY],
    }
}

export function moveArray(rects: Rect[], delta: vec2.ReadonlyVec2): Rect[] {
    for (let i = 0; i < rects.length; ++i)
        move(rects[i], delta)

    return rects
}

export function move(rect: Rect, delta: vec2.ReadonlyVec2): Rect {
    vec2.add(rect.pos, delta)

    return rect
}

export function scaleArray(rects: Rect[], factor: number): Rect[] {
    for (let i = 0; i < rects.length; ++i)
        scale(rects[i], factor)

    return rects
}

export function scale(rect: Rect, factor: number): Rect {
    vec2.mul(rect.pos,  factor)
    vec2.mul(rect.size, factor)

    return rect
}