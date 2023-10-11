import BadExprError              from "./BadExprError"
import Expr                      from "./Expr"
import Parser                    from "./Parser"
import Node                      from "./Node"

import { TurnNodeAngle,
         TermNode,
         EndNode, TurnNode,
         SaveNode, RestoreNode } from "./Node"

export default class DefaultParser implements Parser {
    private static readonly ANGLE_REGEX      = /^(\d*\.\d+|\d+)/
    private static readonly TERM_REGEX       = /^[_a-zA-Z][_a-zA-Z0-9]*/
    private static readonly WHITESPACE_REGEX = /^\s+/

    private knownTerms?: Set<string>

    private terms = new Set<string>()
    private expr  = ""
    private pos   = 0

    parse(expr: string, knownTerms?: Set<string>): Expr {
        this.reset(expr, knownTerms)

        let tree: Node = this.makeEndNode(expr)

        while (this.pos < this.expr.length) {
            this.skipWhitespace()

            if (this.pos >= this.expr.length)
                break

            const token = this.parseNode()

            if (tree.type === "end")
                tree = token
            else
                tree = {
                    type:   "concat",
                    pos:    tree.pos,
                    length: tree.length + token.length,
                    expr:   this.expr,
                    left:   tree,
                    right:  token,
                }
        }

        return {
            terms: new Set(this.terms),
            tree: tree,
        }
    }

    private reset(expr: string, knownTerms?: Set<string>) {
        this.terms.clear()

        this.knownTerms = knownTerms
        this.pos        = 0
        this.expr       = expr
    }

    private makeEndNode(expr: string): EndNode {
        return {
            type:   "end",
            pos:    expr.length,
            length: 0,
            expr:   expr,
        }
    }

    private static readonly MINUS_LIKE = new Set([
        "-",
        "\u2012",
        "\u2013",
        "\u2014",
        "\u2212",
        "\uFF0D",
    ])

    private parseNode(): Node {
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

    private parseTermNode(): TermNode {
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

    private parseTurnNode(): TurnNode {
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

        let angle: TurnNodeAngle = counterClockwise ? "default-neg"
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

    private parseSaveNode(): SaveNode {
        return this.parseStateNode("save")
    }

    private parseRestoreNode(): RestoreNode {
        return this.parseStateNode("restore")
    }

    private parseStateNode(type: "save"):             SaveNode
    private parseStateNode(type: "restore"):          RestoreNode
    private parseStateNode(type: "save" | "restore"): SaveNode | RestoreNode
    private parseStateNode(type: "save" | "restore"): SaveNode | RestoreNode {
        const begin       = this.pos
        const targetChar  = type === "save" ? "[" : "]"
        const char        = this.expr[this.pos++]

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
