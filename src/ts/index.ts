import "css/index.css"

import h                    from "hyperscript"
import ExprParser           from "./expr/DefaultParser"
import Renderer             from "./render/CanvasRenderer"

import * as dom             from "./util/dom"
import * as render          from "./render/util"
import * as predef          from "./Predef"

import { ReadonlyExpr,
         copy as copyExpr } from "./expr/Expr"
import { TermInfo         } from "./render/util"


const TERM_INPUT_CONTANER_ID_PREFIX = "term-"

const DEFAULT_LINE_WIDTH: number       = 1
const DEFAULT_SCALE:      number       = 1
const DEFAULT_EXPR:       ReadonlyExpr = {
    terms: new Set(),
    tree:  {
        type:   "end",
        pos:    0,
        length: 0,
        expr:   "",
    },
} 

try {
    const mainCanvas             = dom.forceGetElementById("main-canvas"              ) as HTMLCanvasElement
    const predefSelect           = dom.forceGetElementById("preset-select"            ) as HTMLSelectElement
    const axiomTextArea          = dom.forceGetElementById("axiom-text-area"          ) as HTMLTextAreaElement
    const termsInputContainerDiv = dom.forceGetElementById("terms-input-container-div") as HTMLDivElement
    const iterCountInput         = dom.forceGetElementById("iter-count-input"         ) as HTMLInputElement
    const defaultAngleInput      = dom.forceGetElementById("default-angle-input"      ) as HTMLInputElement
    const renderButton           = dom.forceGetElementById("render-button"            ) as HTMLButtonElement


    let axiom        = DEFAULT_EXPR
    let termsInfo    = new Map<string, TermInfo>()
    let iterCount    = 0
    let defaultAngle = 0


    const exprParser = new ExprParser()
    const renderer   = new Renderer(mainCanvas)


    initPredefSelect()
    predefSelect.onchange = onPredefChange
    onPredefChange()

    axiomTextArea.oninput = onAxiomChange
    onAxiomChange()

    iterCountInput.oninput = onIterCountChange
    onIterCountChange()

    defaultAngleInput.oninput = onDefaultAngleChange
    onDefaultAngleChange()

    renderButton.onclick = onRender
    onRender()


    // The rest of code contains function definitions only

    function initPredefSelect() {
        for (const option of predef.ARRAY.map(predefToOptionElement))
            predefSelect.appendChild(option)

        predefSelect.selectedIndex = 0

        return

        function predefToOptionElement(predef: predef.ReadonlyPredef, index: number): HTMLOptionElement {
            return h(
                "option",
                {
                    value: index.toString()
                },
                `${index}. ${predef.name}`,
            )
        }
    }

    function onPredefChange() {
        termsInfo.clear()
        termsInputContainerDiv.innerHTML = ""

        dom.clearErrors(predefSelect)

        try {
            const id        = Number(predefSelect.value)
            const newPredef = predef.ARRAY[id]

            if (newPredef == null)
                throw new Error(`Predef with id ${id} not found`)

            // Axiom Setup

            const newAxiomExpr = newPredef.axiom

            axiomTextArea.value = newAxiomExpr

            try {
                axiom = exprParser.parse(newAxiomExpr)
            } catch (error) {
                dom.addError(error, axiomTextArea)
            }

            // Default Angle Setup

            const newDefaultAngle = newPredef.defaultAngle ?? 0

            defaultAngleInput.value = newDefaultAngle.toString()
            defaultAngle            = newDefaultAngle

            // Terms Setup

            if (newPredef.terms == null)
                return

            const newTermDefs = new Map(Object.entries(newPredef.terms))
            const newTerms    = new Set(newTermDefs.keys())

            updateTermsInfo(newTerms)

            const termExprErrors = new Map<string, unknown>()

            for (const [term, { expr, scale, lineWidth }] of newTermDefs) {
                const info = forceGetTermInfo(term)

                try {
                    info.expr = exprParser.parse(expr)
                } catch (error) {
                    termExprErrors.set(term, error)
                    info.expr.tree.expr = expr
                }

                if (scale != null)
                    info.scale = scale

                if (lineWidth != null)
                    info.lineWidth = lineWidth
            }

            createMissingTermInputContainers()

            for (const child of termsInputContainerDiv.children) {
                const term = inputContainerIdToTerm(child.id)

                if (term == null)
                    continue

                const error = termExprErrors.get(term)

                if (error == null)
                    continue

                dom.addError(error, child)
            }
        } catch (error) {
            dom.addError(error, predefSelect)
        }
    }

    function onAxiomChange() {
        dom.onExprChange(axiomTextArea, exprParser, expr => {
            axiom = expr

            onExprChange()
        })
    }

    function onIterCountChange() {
        dom.onNumberChange(iterCountInput, number => iterCount = number)
    }

    function onDefaultAngleChange() {
        dom.onNumberChange(defaultAngleInput, number => defaultAngle = number)
    }

    function onRender() {
        const laodingElement = h("div#loading")

        document.body.appendChild(laodingElement)

        setTimeout(() => {
            try {
                const actions = render.createActions({
                    defaultAngle,
                    iterCount,
                    axiom,
                    termsInfo: termsInfo,
                })

                renderer.render(actions)
            } catch (error) {
                console.error(error)
            }

            laodingElement.remove()
        }, 0)
    }

    // Must be called every time any term's expression is changed
    function onExprChange() {
        const newTerms = evaluateNewTerms()

        updateTermsInfo(newTerms)

        deleteUnusedTermInputContainers()
        createMissingTermInputContainers()
    }

    function evaluateNewTerms(): Set<string> {
        const newTerms = new Set(axiom.terms)

        let reachableTerms = newTerms

        while (reachableTerms.size > 0) {
            const newReachableTerms = new Set<string>()

            for (const reachableTerm of reachableTerms) {
                const info = termsInfo.get(reachableTerm)

                if (info == null)
                    continue

                for (const term of info.expr.terms) {
                    if (newTerms.has(term))
                        continue

                    newReachableTerms.add(term)
                    newTerms.add(term)
                }
            }

            reachableTerms = newReachableTerms
        }

        return newTerms
    }

    function updateTermsInfo(newTerms: Set<string>) {
        deleteUnusedTermsInfo()
        createMissingTermsInfo()

        return

        function deleteUnusedTermsInfo() {
            const toDelete = new Set<string>()

            for (const term of termsInfo.keys())
                if (!newTerms.has(term))
                    toDelete.add(term)

            for (const term of toDelete)
                termsInfo.delete(term)
        }

        function createMissingTermsInfo() {
            for (const term of newTerms) {
                if (termsInfo.has(term))
                    continue

                const info: TermInfo = {
                    expr:      copyExpr(DEFAULT_EXPR),
                    scale:     DEFAULT_SCALE,
                    lineWidth: DEFAULT_LINE_WIDTH,
                }

                termsInfo.set(term, info)
            }
        }
    }

    function deleteUnusedTermInputContainers() {
        const ids = new Set<string>()

        for (const term of termsInfo.keys())
            ids.add(termToInputContainerId(term))

        const toDelete = new Array<Element>()

        for (const child of termsInputContainerDiv.children)
            if (!ids.has(child.id))
                toDelete.push(child)

        for (const element of toDelete)
            element.remove()
    }

    function createMissingTermInputContainers() {
        const termsWithoutContainer = findTermsWithoutInputContainer()

        createTermInputContainers(termsWithoutContainer)

        return
        
        function findTermsWithoutInputContainer(): Set<string> {
            const termsWithContainer = new Set<string>()

            for (const child of termsInputContainerDiv.children) {
                const term = inputContainerIdToTerm(child.id)

                if (term != null)
                    termsWithContainer.add(term)
            }

            const termsWithoutContainer = new Set(termsInfo.keys())

            for (const term of termsWithContainer)
                termsWithoutContainer.delete(term)

            return termsWithoutContainer
        }

        function createTermInputContainers(terms: Set<string>) {
            for (const term of terms) {
                const container = createTermInputContainer(term)

                termsInputContainerDiv.appendChild(container)
            }
        }
    }

    function createTermInputContainer(term: string) {
        const info = termsInfo.get(term)

        const exprTextAreaId = `termexpr-${term}`
        
        const exprTextAreaLabel = h(
            "label",
            { htmlFor: exprTextAreaId },
            term,
        )

        const exprTextArea = h(
            `textarea.with-border#${exprTextAreaId}`,
            {
                placeholder:  "expression",
                autocomplete: "off",
                spellcheck:   "false",
                value:        (info?.expr ?? DEFAULT_EXPR).tree.expr,
                oninput:      onTermExprChange,
            },
            info?.expr ?? "",
        ) as HTMLTextAreaElement


        const scaleInputId = `termscale-${term}`

        const scaleInputLabel = h(
            "label",
            { htmlFor: scaleInputId },
            "Scale",
        )

        const scaleInput = h(
            `input.with-border#${scaleInputId}`,
            {
                placeholder: "scale",
                type:        "number",
                value:       info?.scale ?? DEFAULT_SCALE,
                oninput:     onTermScaleChange,
            },
        ) as HTMLInputElement


        const lineWidthInputId = `termlinewidth-${term}`

        const lineWidthInputLabel = h(
            "label",
            { htmlFor: lineWidthInputId },
            "Line Width",
        )

        const lineWidthInput = h(
            `input.with-border#${lineWidthInputId}`,
            {
                placeholder: "line width",
                type:        "number",
                value:       info?.lineWidth ?? DEFAULT_LINE_WIDTH,
                oninput:     onTermLineWidthChange,
            },
        ) as HTMLInputElement

        
        return h(
            `div.term.input.with-border#${termToInputContainerId(term)}`,

            exprTextAreaLabel,
            exprTextArea,

            scaleInputLabel,
            scaleInput,

            lineWidthInputLabel,
            lineWidthInput,
        )


        function onTermExprChange() {
            dom.onExprChange(exprTextArea, exprParser, expr => {
                const info = forceGetTermInfo(term)

                info.expr = expr

                onExprChange()
            })
        }

        function onTermScaleChange() {
            dom.onNumberChange(scaleInput, number => {
                const info = forceGetTermInfo(term)

                info.scale = number
            })
        }

        function onTermLineWidthChange() {
            dom.onNumberChange(lineWidthInput, number => {
                const info = forceGetTermInfo(term)

                info.lineWidth = number
            })
        }
    }

    function termToInputContainerId(term: string): string {
        return TERM_INPUT_CONTANER_ID_PREFIX + term
    }

    function inputContainerIdToTerm(id: string): string | null {
        return id.startsWith(TERM_INPUT_CONTANER_ID_PREFIX)
             ? id.substring(TERM_INPUT_CONTANER_ID_PREFIX.length)
             : null
    }

    function forceGetTermInfo(term: string): TermInfo {
        const info = termsInfo.get(term)

        if (info == null)
            throw new Error(`${term}'s info is null`)

        return info
    }
} catch (error: unknown) {
    console.error(error)
}