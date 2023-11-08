import Expr from "./Expr"

export default interface Parser {
    parse(expr: string, knownTerms?: ReadonlySet<string>): Expr
}