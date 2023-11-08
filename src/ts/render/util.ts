import DeepReadonly from "ts/util/DeepReadonly"
import Expr         from "ts/expr/Expr"

import * as node    from "ts/expr/Node"
import * as action  from "./Action"


export const DEFAULT_ITER_COUNT    = 5
export const DEFAULT_DEFAULT_ANGLE = 30
export const DEFAULT_DEFAULT_SCALE = 1


export interface TermInfo {
    expr:  Expr
    scale: number
}

export interface ReadonlyTermInfo extends DeepReadonly<TermInfo> {}


export interface CreateActionsOptions {
    axiom:         Expr
    terms?:        Map<string, TermInfo> | { [key: string]: TermInfo }
    iterCount?:    number
    defaultAngle?: number
    defaultScale?: number
}

export interface ReadonlyCreateActionsOptions extends DeepReadonly<CreateActionsOptions> {}

export function createActions(options: ReadonlyCreateActionsOptions): action.Action[] {
    const axiom        = options.axiom
    const iterCount    = options.iterCount    ?? DEFAULT_ITER_COUNT
    const defaultAngle = options.defaultAngle ?? DEFAULT_DEFAULT_ANGLE
    const defaultScale = options.defaultScale ?? DEFAULT_DEFAULT_SCALE
    const terms        = options.terms instanceof Map
        ? options.terms
        : new Map(
            options.terms != null
                ? Object.entries(options.terms)
                : undefined
        )

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
                return terms.get(tree.term)?.expr.tree ?? tree

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

            case "term":
                return [{
                    type:  "draw-line",
                    scale: terms.get(tree.term)?.scale ?? defaultScale,
                }]
                
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