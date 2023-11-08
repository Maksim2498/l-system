import DeepReadonly from "ts/util/DeepReadonly"


export type Type = "term"
                 | "turn"
                 | "concat"
                 | "save"
                 | "restore"
                 | "end"


export interface Base {
    type:   Type
    pos:    number
    length: number
    expr:   string
}

export interface ReadonlyBase extends Readonly<Base> {}


export interface Term extends Base {
    type: "term"
    term: string
}

export interface ReadonlyTerm extends Readonly<Term> {}


export type TurnAngle = number
                      | "default-pos"
                      | "default-neg"

export interface Turn extends Base {
    type:  "turn"
    angle: TurnAngle
}

export interface ReadonlyTurn extends Readonly<Turn> {}


export interface Concat extends Base {
    type:  "concat"
    left:  Node
    right: Node
}

export interface ReadonlyConcat extends DeepReadonly<Concat> {}


export interface Save extends Base {
    type: "save"
}

export interface ReadonlySave extends Readonly<Save> {}


export interface Restore extends Base {
    type: "restore"
}

export interface ReadonlyRestore extends Readonly<Restore> {}


export interface End extends Base {
    type: "end"
}

export interface ReadonlyEnd extends Readonly<End> {}


export type Node         = Term
                         | Turn
                         | Concat
                         | Save
                         | Restore
                         | End

export type ReadonlyNode = DeepReadonly<Node>

export default Node


export function copy(node: ReadonlyNode): Node {
    switch (node.type) {
        case "turn":
        case "save":
        case "restore":
        case "term":
        case "end":
            return { ...node }

        case "concat":
            return {
                ...node,
                left:  copy(node.left),
                right: copy(node.right),
            }

        default:
            const check: never = node
            throw new Error("never")
    }
}