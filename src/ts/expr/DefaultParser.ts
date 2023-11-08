import BadExprError from "./BadExprError"
import Expr         from "./Expr"
import Parser       from "./Parser"

import * as node    from "./Node"

export default class DefaultParser implements Parser {
    private static readonly ANGLE_REGEX      = /^(\d*\.\d+|\d+)/
    private static readonly TERM_REGEX       = /^[_a-zA-Z][_a-zA-Z0-9]*/
    private static readonly WHITESPACE_REGEX = /^\s+/
    private static readonly MINUS_LIKE       = new Set([
        "-",
        "\u2012",
        "\u2013",
        "\u2014",
        "\u2212",
        "\uFF0D",
    ])

    private knownTerms?: ReadonlySet<string>

    private terms = new Set<string>()
    private expr  = ""
    private pos   = 0

    parse(expr: string, knownTerms?: ReadonlySet<string>): Expr {
        this.reset(expr, knownTerms)

        let tree: node.Node = this.createEndNode(expr)

        while (this.pos < this.expr.length) {
            this.skipWhitespace()

            if (this.pos >= this.expr.length)
                break

            const node = this.parseNode()

            if (tree.type === "end")
                tree = node
            else
                tree = {
                    type:   "concat",
                    pos:    tree.pos,
                    length: tree.length + node.length,
                    expr:   this.expr,
                    left:   tree,
                    right:  node,
                }
        }

        return {
            terms: new Set(this.terms),
            tree:  tree,
        }
    }

    private reset(expr: string, knownTerms?: ReadonlySet<string>) {
        this.terms.clear()

        this.knownTerms = knownTerms
        this.pos        = 0
        this.expr       = expr
    }

    private createEndNode(expr: string): node.End {
        return {
            type:   "end",
            pos:    expr.length,
            length: 0,
            expr:   expr,
        }
    }

    private parseNode(): node.Node {
        const char = this.expr[this.pos]

        switch (char) {
            case "+":
                return this.parseTurnNode()

            case "[":
                return this.parseSaveNode()

            case "]":
                return this.parseRestoreNode()

            default:
                if (DefaultParser.MINUS_LIKE.has(char))
                    return this.parseTurnNode()

                if (DefaultParser.TERM_REGEX.test(char))
                    return this.parseTermNode()

                throw new BadExprError(
                    "Illegal character",
                    this.expr,
                    this.pos,
                )
        }
    }

    private parseTermNode(): node.Term {
        const begin   = this.pos
        const matches = this.expr.substring(this.pos)
                                 .match(DefaultParser.TERM_REGEX)

        if (matches == null)
            this.expected('english letter or "_"')

        const term = matches[0]

        if (this.knownTerms != null && !this.knownTerms.has(term))
            throw new BadExprError("Unknown term", this.expr, begin)

        this.terms.add(term)

        this.pos += term.length

        return {
            type:   "term",
            pos:    begin,
            length: this.pos - begin,
            expr:   this.expr,
            term,
        }
    }

    private parseTurnNode(): node.Turn {
        const begin = this.pos

        let counterClockwise: boolean

        const char = this.expr[this.pos]

        if (char === "+")
            counterClockwise = false
        else if (DefaultParser.MINUS_LIKE.has(char))
            counterClockwise = true
        else
            this.expected('"+" or "-"')

        ++this.pos

        this.skipWhitespace()

        let angle: node.TurnAngle = counterClockwise ? "default-neg"
                                                     : "default-pos"

        const matches = this.expr.substring(this.pos)
                                 .match(DefaultParser.ANGLE_REGEX)

        if (matches != null) {
            const match = matches[0]

            angle     = Number(match)
            this.pos += match.length
        }

        if (counterClockwise && typeof angle === "number")
            angle = -angle

        return {
            type:   "turn",
            pos:    begin,
            length: this.pos - begin,
            expr:   this.expr,
            angle,
        }
    }

    private parseSaveNode(): node.Save {
        return this.parseStateNode("save")
    }

    private parseRestoreNode(): node.Restore {
        return this.parseStateNode("restore")
    }

    private parseStateNode(type: "save"):             node.Save
    private parseStateNode(type: "restore"):          node.Restore
    private parseStateNode(type: "save" | "restore"): node.Save | node.Restore
    private parseStateNode(type: "save" | "restore"): node.Save | node.Restore {
        const begin      = this.pos
        const targetChar = type === "save" ? "[" : "]"
        const char       = this.expr[this.pos++]

        if (char !== targetChar)
            this.expected(`"${targetChar}"`)

        return {
            type,
            pos:    begin,
            length: 1,
            expr:   this.expr,
        }
    }

    private skipWhitespace() {
        const matches = this.expr.substring(this.pos)
                                 .match(DefaultParser.WHITESPACE_REGEX)

        this.pos += matches?.[0].length ?? 0
    }

    private expected(what: string): never {
        throw new BadExprError(
            `Expected ${what}`,
            this.expr,
            this.pos,
        )
    }
}
