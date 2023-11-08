import h          from "hyperscript"
import Expr       from "ts/expr/Expr"
import ExprParser from "ts/expr/Parser"

export function forceGetElementById(id: string): HTMLElement {
    const element = document.getElementById(id)

    if (element == null)
        throw new Error(`Element with id \"${id}\" not found`)

    return element
}

export function addError(error: unknown, element: Element) {
    const parent = element.parentElement

    if (parent == null)
        return

    const errorElement = h(
        "div",
        { className: "error with-border" },
        error instanceof Error ? error.message
                               : String(error)
    )

    parent.insertBefore(errorElement, element.nextElementSibling)
}

export function clearErrors(element: Element) {
    const parent = element.parentElement

    if (parent == null)
        return

    while (element.nextElementSibling?.classList.contains("error"))
        element.nextElementSibling.remove()
}

export function onNumberChange(element: HTMLInputElement, callback: (number: number) => void) {
    clearErrors(element)

    try {
        const number = Number(element.value)

        if (Number.isNaN(number))
            throw new Error("Not a number")

        if (element.min && number < Number(element.min))
            throw new Error(`Too small.\nMinimum allowed value is ${element.min}`)

        if (element.max && number < Number(element.max))
            throw new Error(`Too small.\nMinimum allowed value is ${element.max}`)

        callback(number)
    } catch (error) {
        addError(error, element)
    }
}

export function onExprChange(
    element:    HTMLInputElement | HTMLTextAreaElement,
    exprParser: ExprParser,
    callback:   (expr: Expr) => void
) {
    clearErrors(element)

    try {
        const expr = exprParser.parse(element.value)

        callback(expr)
    } catch (error) {
        addError(error, element)
    }
}