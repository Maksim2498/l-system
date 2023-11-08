export type Vec2         = [number, number]

export type ReadonlyVec2 = readonly [number, number]

export default Vec2

export function from(value: number): Vec2 {
    return [value, value]
}

export function sum(lhs: ReadonlyVec2, rhs: ReadonlyVec2): Vec2 {
    return add(copy(lhs), rhs)
}

export function add(lhs: Vec2, rhs: ReadonlyVec2): Vec2 {
    lhs[0] += rhs[0]
    lhs[1] += rhs[1]

    return lhs
}

export function diff(lhs: ReadonlyVec2, rhs: ReadonlyVec2): Vec2 {
    return sub(copy(lhs), rhs)
}

export function sub(lhs: Vec2, rhs: ReadonlyVec2): Vec2 {
    lhs[0] -= rhs[0]
    lhs[1] -= rhs[1]

    return lhs
}

export function prod(lhs: ReadonlyVec2, rhs: number): Vec2 {
    return mul(copy(lhs), rhs)
}

export function mul(lhs: Vec2, rhs: number): Vec2 {
    lhs[0] *= rhs
    lhs[1] *= rhs

    return lhs
}

export function quot(lhs: ReadonlyVec2, rhs: number): Vec2 {
    return div(copy(lhs), rhs)
}

export function div(lhs: Vec2, rhs: number): Vec2 {
    lhs[0] /= rhs
    lhs[1] /= rhs

    return lhs
}

export function copy(vec: ReadonlyVec2): Vec2 {
    return [vec[0], vec[1]]
}

export function length(vec: ReadonlyVec2): number {
    return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1])
}

export function angle(vec: ReadonlyVec2): number {
    return Math.atan2(vec[1], vec[0])
}

export function rotated(length: number, angle: number): Vec2 {
    return [
        length * Math.cos(angle),
        length * Math.sin(angle),
    ]
}