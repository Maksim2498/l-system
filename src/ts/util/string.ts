export interface LineInfo {
    text:       string
    index:      number
    beginIndex: number
    endIndex:   number
}

export function getLine(string: string, at: number): string {
    return getLineInfo(string, at).text
}

export function getLineInfo(string: string, at: number): LineInfo {
    const beginIndex = getLineBeginIndex(string, at)
    const endIndex   = getLineEndIndex(string, beginIndex)
    const index      = at - beginIndex
    const text       = string.substring(beginIndex, endIndex)

    return {
        text,
        index,
        beginIndex,
        endIndex,
    }
}

export function getLineBeginIndex(string: string, from: number = 0): number {
    if (!isGoodIndex(from))
        return 0

    if (string[from] === "\n" && from + 1 < string.length)
        return from + 1

    do
        --from
    while (string[from] != "\n" && from >= 0)

    return from + 1
}

export function getLineEndIndex(string: string, from: number = 0): number {
    if (!isGoodIndex(from))
        return string.length

    const index = string.indexOf("\n", from)

    return index >= 0 ? index
                      : string.length
}

function isGoodIndex(index: number): boolean {
    return index >= 0
        && Number.isInteger(index)
}