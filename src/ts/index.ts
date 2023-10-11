import "css/index.css"

import ExprParser                     from "./expr/DefaultParser"
import Expr                           from "./expr/Expr"
import Renderer                       from "./render/CanvasRenderer"

import { createActions              } from "./render/util"
import { radiansToDegrees           } from "./util/math"
import { forceGetElementById,
         addError, clearErrors,
         createTermInputContainer,
         createTermExprTextAreadId,
         createTermInputContainerId } from "./util/dom"

interface TermInfo {
    expr:  Expr
    scale: number
}

interface Predef {
    name:          string
    axiom:         string
    terms?:        { [key: string]: string }
    defaultAngle?: number
}

const DEFAULT_SCALE: number = 1
const DEFAULT_EXPR:  Expr  = {
    terms: new Set(),
    tree:  {
        type:   "end",
        pos:    0,
        length: 0,
        expr:   "",
    },
} 

const PREDEFS: Predef[] = [ 
    {
        name:  "Empty",
        axiom: "",
    },

    {
        defaultAngle: 90,
        name:         "Harter-Haythaway's Dragon",
        axiom:        "+97.5 F X",
        terms:        {
            F: "F",
            X: "X + Y F +",
            Y: "- F X - Y",
        },
    },

    {
        defaultAngle: 60,
        name:         "Serpinsky Carpet",
        axiom:        "F X F - - F F - - F F",
        terms:        {
            F: "F F",
            X: "- - F X F + + F X F + + F X F - -",
        },
    },

    {
        defaultAngle: 90,
        name:         "Hilbert Curve Filling the Plane",
        axiom:        "X",
        terms:        {
            F: "F",
            X: "- Y F + X F X + F Y -",
            Y: "+ X F - Y F Y - F X +",
        },
    },

    {
        defaultAngle: 60,
        name:         "Gosper Curve Filling the Plane",
        axiom:        "X F",
        terms:        {
            F: "F",
            X: "X + Y F + + Y F - F X - - F X F X - Y F +",
            Y: "- F X + Y F Y F + + Y F + F X - - F X - Y",
        },
    },

    {
        defaultAngle: 90,
        name:         "The Serpinsky Curve Filling the Plane",
        axiom:        "+45 F",
        terms:        {
            F: "F - F + F + F +F - F - F - F + F",
        },
    },

    {
        defaultAngle: 22.5,
        name:         "Bush",
        axiom:        "F",
        terms:        {
            F: "- F + F + [ + F - F - ] - [ - F + F + F ]",
        },
    },

    {
        defaultAngle: 90,
        name:         "Hagerty Mosaic",
        axiom:        "F - F - F - F",
        terms:        {
            F: "F - B + F - F - F - F B - F + B - F + F + F + F B + F F",
            B: "B B B B",
        },
    },

    {
        defaultAngle: 90,
        name:         "Island",
        axiom:        "F - F - F - F",
        terms:        {
            F: "F + F - F - F F F + F +F - F",
        },
    },

    {
        defaultAngle: 60,
        name:         "Snowflake",
        axiom:        "[ F ] + [ F ] + [ F ] + [ F ] + [ F ] + [ F ]",
        terms:        {
            F: "F [ + + F ] [ - F F ] F F [ + F ] [ - F ] F F",
        },
    },

    {
        defaultAngle: 60,
        name:         "Koch 's Snowflake",
        axiom:        "F + + F + + F",
        terms:        {
            F: "F - F + + F - F",
        },
    },

    {
        defaultAngle: 60,
        name:         "The Peano Curve",
        axiom:        "F",
        terms:        {
            F: "F - F + F + F + F - F - F - F + F",
        },
    },

    {
        defaultAngle: radiansToDegrees(Math.PI / 7),
        name:         "Weed",
        axiom:        "-90 F",
        terms:        {
            F: "F [ + F ] F [ - F ] F",
        },
    },

    {
        defaultAngle: radiansToDegrees(Math.PI / 16),
        name:         "Flower",
        axiom:        "-90 F [ + F + F ] [ - F - F ] [ + + F ] [ - - F ] F",
        terms:        {
            F: "F F [ + + F ] [ + F ] [ F ] [ - F ] [ - - F ]",
        },
    },

    {
        defaultAngle: 90,
        name:         "Chain",
        axiom:        "F + F + F + F",
        terms:        {
            F: "F + B - F - F F F + F + B - F",
            B: "B B B",
        },
    },
]

try {
    const mainCanvas          = forceGetElementById("main-canvas")           as HTMLCanvasElement
    const predefSelect        = forceGetElementById("preset-select")         as HTMLSelectElement
    const axiomInput          = forceGetElementById("axiom-input")           as HTMLTextAreaElement
    const termsInputContainer = forceGetElementById("terms-input-container") as HTMLDivElement
    const iterCountInput      = forceGetElementById("iter-count-input")      as HTMLInputElement
    const defaultAngleInput   = forceGetElementById("default-angle-input")   as HTMLInputElement
    const lineWidthInput      = forceGetElementById("line-width-input")      as HTMLInputElement
    const renderButton        = forceGetElementById("render-button")         as HTMLButtonElement

    let axiom        = DEFAULT_EXPR
    let termsInfo    = new Map<string, TermInfo>()
    let iterCount    = 0
    let defaultAngle = 0

    const exprParser = new ExprParser()
    const renderer   = new Renderer(mainCanvas)

    initInPredefSelect()

    predefSelect.onchange = onPredefChange
    onPredefChange()

    axiomInput.oninput = onAxiomChange
    onAxiomChange()

    iterCountInput.oninput = onIterCountChange
    onIterCountChange()

    defaultAngleInput.oninput = onDefaultAngleChange
    onDefaultAngleChange()

    lineWidthInput.oninput = onLineWidthChange
    onLineWidthChange()

    renderButton.onclick = onRender
    onRender()

    function initInPredefSelect() {
        for (const option of PREDEFS.map(predefToOptionElement))
            predefSelect.appendChild(option)

        if (PREDEFS.length > 0)
            predefSelect.selectedIndex = 0

        return

        function predefToOptionElement(predef: Predef, index: number): HTMLOptionElement {
            const option = document.createElement("option")

            option.innerHTML = `${index}. ${predef.name}`
            option.value     = index.toString()

            return option
        }
    }

    function onPredefChange() {
        const id     = Number(predefSelect.value)
        const predef = PREDEFS[id]

        if (predef == null)
            return

        const newDefaultAngle = predef.defaultAngle ?? 0
        const newAxiomText    = predef.axiom
        const newTermsText    = predef.terms        ?? {}

        axiomInput.value = newAxiomText

        try {
            axiom = exprParser.parse(newAxiomText)
        } catch (error) {
            addError(error, axiomInput)
        }

        defaultAngleInput.value = newDefaultAngle.toString()
        defaultAngle            = newDefaultAngle

        const newTermsSet = new Set(Object.keys(newTermsText))

        updateTerms(newTermsSet, false)
        deleteUnusedElementsInTermsInputContainer()

        for (const term of newTermsSet) {
            const textAreaId = createTermExprTextAreadId(term)
            const textArea   = document.getElementById(textAreaId) as HTMLTextAreaElement

            if (textArea == null) {
                console.error(`Missing input for term "${term}"`)
                continue
            }

            const exprText = newTermsText[term]

            textArea.value = exprText

            try {
                const expr = exprParser.parse(exprText)
                const info = termsInfo.get(term)!

                info.expr = expr
            } catch (error) {
                addError(error, textArea)
            }
        }
    }

    function onAxiomChange() {
        clearErrors(axiomInput)

        try {
            axiom = exprParser.parse(axiomInput.value)

            onExprChange()
        } catch (error) {
            addError(error, axiomInput)
        }
    }

    function onExprChange() {
        const newTerms = evaluateNewTerms()

        updateTerms(newTerms)
        deleteUnusedElementsInTermsInputContainer()
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

                for (const term of info.expr.terms)
                    if (!newTerms.has(term)) {
                        newReachableTerms.add(term)
                        newTerms.add(term)
                    }
            }

            reachableTerms = newReachableTerms
        }

        return newTerms
    }

    function updateTerms(newTerms: Set<string>, recursive: boolean = true) {
        const oldTermsInfo = termsInfo

        termsInfo = new Map()

        outer:
        for (const term of newTerms) {
            if (termsInfo.has(term))
                continue

            const oldInfo = oldTermsInfo.get(term)

            if (oldInfo != null) {
                termsInfo.set(term, oldInfo)
                continue
            }

            termsInfo.set(term, {
                expr:  DEFAULT_EXPR,
                scale: DEFAULT_SCALE,
            })

            const id = createTermInputContainerId(term)

            for (const child of termsInputContainer.children)
                if (child.id === id)
                    continue outer

            const container = createSetupTermInputContainer(term, recursive)

            termsInputContainer.appendChild(container)
        }
    }

    function deleteUnusedElementsInTermsInputContainer() {
        const ids = new Set<string>()

        for (const term of termsInfo.keys())
            ids.add(createTermInputContainerId(term))

        let needUpdate = false

        for (const child of termsInputContainer.children) 
            if (!ids.has(child.id)) {
                child.remove()
                needUpdate = true
            }

        if (needUpdate)
            onExprChange()
    }

    function createSetupTermInputContainer(term: string, recursive: boolean = true) {
        const info = termsInfo.get(term)!

        return createTermInputContainer(term, {
            initExpr:  info.expr.tree.expr,
            initScale: info.scale,

            onExprChange(value) {
                const expr = exprParser.parse(value)
                const info = termsInfo.get(term)!

                info.expr = expr

                if (recursive)
                    onExprChange()
            },

            onScaleChange(value) {
                const info = termsInfo.get(term)!

                info.scale = value
            },
        })
    }

    function onIterCountChange() {
        clearErrors(iterCountInput)

        try {
            const value = Number(iterCountInput.value)

            if (Number.isNaN(value))
                throw new Error("Not a number")

            if (value < 0)
                throw new Error("Must be positive")

            iterCount = value
        } catch (error) {
            addError(error, iterCountInput)
        }
    }

    function onDefaultAngleChange() {
        clearErrors(defaultAngleInput)

        try {
            const value = Number(defaultAngleInput.value)

            if (Number.isNaN(value))
                throw new Error("Not a number")

            defaultAngle = value
        } catch (error) {
            addError(error, defaultAngleInput)
        }
    }

    function onLineWidthChange() {
        clearErrors(lineWidthInput)

        try {
            const value = Number(lineWidthInput.value)

            if (Number.isNaN(value))
                throw new Error("Not a number")

            renderer.lineWidth = value
        } catch (error) {
            addError(error, lineWidthInput)
        }
    }

    function onRender() {
        try {
            const actions = createActions({
                axiom,
                terms: termsInfo,
                iterCount,
                defaultAngle,
            })

            renderer.render(actions)
        } catch (error) {
            console.error(error)
        }
    }
} catch (e: unknown) {
    console.error(e)
}