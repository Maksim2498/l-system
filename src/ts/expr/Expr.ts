import DeepReadonly         from "ts/util/DeepReadonly"
import Node                 from "./Node"

import { copy as copyNode } from "./Node"


export interface Expr {
    tree:  Node
    terms: Set<string>
}

export interface ReadonlyExpr extends DeepReadonly<Expr> {}

export default Expr


export function copy(expr: ReadonlyExpr): Expr {
    return {
        tree:  copyNode(expr.tree),
        terms: new Set(expr.terms),
    }
}