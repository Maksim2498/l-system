import { getLineInfo } from "ts/util/string"

export default class BadExprError extends Error {
    readonly reason: string
    readonly expr:   string
    readonly pos:    number

    constructor(reason: string, expr: string, pos: number) {
        if (pos < 0)
            throw Error(`<pos> must be positive`)

        if (!Number.isInteger(pos))
            throw Error(`<pos> must be an integer`)

        const badLineInfo = getLineInfo(expr, pos)
        const prefix      = "Error in line: "
        const firstLine   = `${prefix}"${badLineInfo.text}"`
        const offset      = " ".repeat(prefix.length + badLineInfo.index + 1)
        const secondLine  = offset + "^"
        const thirdLine   = offset + reason
        const message     = [firstLine, secondLine, thirdLine].join("\n")

        super(message)

        this.reason = reason
        this.expr   = expr
        this.pos    = pos
    }
}