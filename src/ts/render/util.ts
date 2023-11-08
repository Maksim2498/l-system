import DeepReadonly from "ts/util/DeepReadonly"
import Expr         from "ts/expr/Expr"

import * as node    from "ts/expr/Node"
import * as action  from "./Action"


export const DEFAULT_ITER_COUNT         = 5
export const DEFAULT_DEFAULT_ANGLE      = 30
export const DEFAULT_DEFAULT_SCALE      = 1
export const DEFAULT_DEFAULT_LINE_WIDTH = 1
export const DEFAULT_DEFAULT_COLOR      = "#000"


export interface TermInfo {
    expr:      Expr
    scale:     number
    lineWidth: number
    color:     string
}

export interface ReadonlyTermInfo extends DeepReadonly<TermInfo> {}


export interface PartialTermInfo extends Partial<TermInfo> {
    expr: Expr
}

export interface ReadonlyPartialTerminfo extends DeepReadonly<PartialTermInfo> {}


export interface CreateActionsOptions {
    axiom:             Expr
    termsInfo?:        Map<string, PartialTermInfo> | { [key: string]: PartialTermInfo }
    iterCount?:        number
    defaultAngle?:     number
    defaultScale?:     number
    defaultLineWidth?: number
    defaultColor?:     string
}

export interface ReadonlyCreateActionsOptions extends DeepReadonly<CreateActionsOptions> {}

export function createActions(options: ReadonlyCreateActionsOptions): action.Action[] {
    const axiom            = options.axiom
    const iterCount        = options.iterCount        ?? DEFAULT_ITER_COUNT
    const defaultAngle     = options.defaultAngle     ?? DEFAULT_DEFAULT_ANGLE
    const defaultScale     = options.defaultScale     ?? DEFAULT_DEFAULT_SCALE
    const defaultLineWidth = options.defaultLineWidth ?? DEFAULT_DEFAULT_LINE_WIDTH
    const defaultColor     = options.defaultColor     ?? DEFAULT_DEFAULT_COLOR
    const termsInfo        = (options.termsInfo instanceof Map
        ? options.termsInfo
        : new Map(
            options.termsInfo != null
                ? Object.entries(options.termsInfo)
                : undefined
        )) as Map<string, PartialTermInfo>

    let tree = axiom.tree

    for (let i = 0; i < iterCount; ++i)
        tree = replacedTree(tree)

    return treeToActions(tree)

    function replacedTree(tree: node.ReadonlyNode): node.ReadonlyNode {
        switch (tree.type) {
            case "concat":
                return {
                    ...tree,

                    left:  replacedTree(tree.left),
                    right: replacedTree(tree.right),
                }
            
            case "term":
                return termsInfo.get(tree.term)?.expr.tree ?? tree

            default:
                return tree
        }
    }

    function treeToActions(tree: node.ReadonlyNode): action.Action[] {
        switch (tree.type) {
            case "concat":
                const left  = treeToActions(tree.left)
                const right = treeToActions(tree.right)
                
                return left.concat(right)

            case "term": {
                const info = termsInfo.get(tree.term)

                return [{
                    type:  "draw-line",
                    scale: info?.scale     ?? defaultScale,
                    width: info?.lineWidth ?? defaultLineWidth,
                    color: info?.color     ?? defaultColor,
                }]
            }
                
            case "turn":
                let angle: number

                switch (tree.angle) {
                    case "default-pos":
                        angle = defaultAngle
                        break

                    case "default-neg":
                        angle = -defaultAngle
                        break

                    default:
                        angle = tree.angle
                }

                return [{
                    type: "turn",
                    angle,
                }]

            case "save":
                return [{ type: "save" }]

            case "restore":
                return [{ type: "restore" }]

            case "end":
                return []

            default:
                const _: never = tree
                return []
        }
    }
}