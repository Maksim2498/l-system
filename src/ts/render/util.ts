import Expr   from "ts/expr/Expr"
import Node   from "ts/expr/Node"
import Action from "./Action"

export const DEFAULT_ITER_COUNT    = 5
export const DEFAULT_DEFAULT_ANGLE = 30
export const DEFAULT_DEFAULT_SCALE = 1

export interface TermInfo {
    expr:  Expr
    scale: number
}

export interface CreateActionsOptions {
    axiom:         Expr
    terms?:        Map<string, TermInfo>
    iterCount?:    number
    defaultAngle?: number
    defaultScale?: number
}

export function createActions(options: CreateActionsOptions): Action[] {
    const axiom        = options.axiom
    const terms        = options.terms        ?? new Map<string, TermInfo>()
    const iterCount    = options.iterCount    ?? DEFAULT_ITER_COUNT
    const defaultAngle = options.defaultAngle ?? DEFAULT_DEFAULT_ANGLE
    const defaultScale = options.defaultScale ?? DEFAULT_DEFAULT_SCALE

    let tree = axiom.tree

    for (let i = 0; i < iterCount; ++i)
        tree = replacedTree(tree)

    return treeToActions(tree)

    function replacedTree(tree: Node): Node {
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

    function treeToActions(tree: Node): Action[] {
        switch (tree.type) {
            case "concat":
                const left  = treeToActions(tree.left)
                const right = treeToActions(tree.right)
                
                return left.concat(right)

            case "term":
                return [{
                    type: "draw-line",
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