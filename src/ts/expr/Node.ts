export type NodeType = "term"
                     | "turn"
                     | "concat"
                     | "save"
                     | "restore"
                     | "end"

export interface NodeBase {
    type:   NodeType
    pos:    number
    length: number
    expr:   string
}

export interface TermNode extends NodeBase {
    type: "term"
    term: string
}

export type TurnNodeAngle = number
                          | "default-pos"
                          | "default-neg"

export interface TurnNode extends NodeBase {
    type:  "turn"
    angle: TurnNodeAngle
}

export interface ConcatNode extends NodeBase {
    type:  "concat"
    left:  Node
    right: Node
}

export interface SaveNode extends NodeBase {
    type: "save"
}

export interface RestoreNode extends NodeBase {
    type: "restore"
}

export interface EndNode extends NodeBase {
    type: "end"
}

type Node = TermNode
          | TurnNode
          | ConcatNode
          | SaveNode
          | RestoreNode
          | EndNode

export default Node