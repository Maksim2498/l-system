export function forceGetElementById(id: string): HTMLElement {
    const element = document.getElementById(id)

    if (element == null)
        throw new Error(`Element with id \"${id}\" not found`)

    return element
}

export function addError(error: unknown, element: HTMLElement) {
    const parent = element.parentElement

    if (parent == null)
        return

    const errorElement = document.createElement("div")
    const message      = error instanceof Error ? error.message
                                                : String(error)

    errorElement.className = "error"
    errorElement.innerHTML = message

    parent.insertBefore(errorElement, element.nextElementSibling)
}

export function clearErrors(element: HTMLElement) {
    const parent = element.parentElement

    if (parent == null)
        return

    while (element.nextElementSibling?.classList.contains("error"))
        element.nextElementSibling.remove()
}

export interface CreateTermInputContainerOptions {
    initExpr?:                     string
    initScale?:                    number
    callOnExprChangeAfterCreate?:  boolean
    callOnScaleChangeAfterCreate?: boolean

    onExprChange?(value: string): void
    onScaleChange?(scale: number): void
}

export function createTermInputContainerId(term: string): string {
    return `term-${term}`
}

export function createTermExprTextAreadId(term: string): string {
    return `termexpr-${term}`
}

export function createTermScaleInputId(term: string): string {
    return `termscale-${term}`
}

export function createTermInputContainer(
    term:    string,
    options: CreateTermInputContainerOptions = {}
): HTMLDivElement {
    const containerId       = createTermInputContainerId(term)
    const container         = craeteContainer(containerId)

    const exprTextAreaId    = createTermExprTextAreadId(term)
    const exprTextAreaLabel = createLabel(exprTextAreaId, term)
    const exprTextArea      = createExprTextArea(exprTextAreaId)

    const scaleInputId      = createTermScaleInputId(term)
    const scaleInputLabel   = createLabel(scaleInputId, `${term}'s scale`)
    const scaleInput        = createScaleInput(scaleInputId)

    container.appendChild(exprTextAreaLabel)
    container.appendChild(exprTextArea)
    container.appendChild(scaleInputLabel)
    container.appendChild(scaleInput)

    return container

    function craeteContainer(id: string): HTMLDivElement {
        const inputContainer = document.createElement("div")

        inputContainer.id        = id
        inputContainer.className = "term input"

        return inputContainer
    }

    function createExprTextArea(id: string): HTMLTextAreaElement {
        const textArea  = document.createElement("textarea")
        const initValue = options.initExpr ?? ""

        textArea.id             = id
        textArea.placeholder    = "expression"
        textArea.autocomplete   = "off"
        textArea.autocapitalize = "off"
        textArea.spellcheck     = false
        textArea.value          = initValue
        textArea.oninput        = () => {
            clearErrors(textArea)

            try {
                options.onExprChange?.(textArea.value)
            } catch (error) {
                addError(error, textArea)
            }
        }

        if (options.callOnExprChangeAfterCreate)
            options.onExprChange?.(initValue)

        return textArea
    }

    function createScaleInput(id: string): HTMLInputElement {
        const input     = document.createElement("input")
        const initValue = options.initScale ?? 1

        input.type        = "number"
        input.value       = initValue.toString()
        input.placeholder = "scale"
        input.oninput     = () => {
            clearErrors(input)

            try {
                const value = Number(input.value)

                if (Number.isNaN(value))
                    throw new Error("Not a number")

                options.onScaleChange?.(value)
            } catch (error) {
                addError(error, input)
            }
        }

        if (options.callOnScaleChangeAfterCreate)
            options.onScaleChange?.(initValue)

        return input
    }

    function createLabel(forId: string, text: string): HTMLLabelElement {
        const label = document.createElement("label")

        label.htmlFor   = forId
        label.innerHTML = text

        return label
    }
}