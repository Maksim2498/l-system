import Node from "./Node"

export default interface Expr {
    tree:  Node
    terms: Set<string>
}