import "css/index.css"

import ExprParser                     from "./expr/DefaultParser"
import Expr                           from "./expr/Expr"
import Renderer                       from "./render/CanvasRenderer"

import { createActions              } from "./render/util"
import { forceGetElementById,
         addError, clearErrors,
         createTermInputContainer,
         createTermInputContainerId } from "./util/dom"

interface TermInfo {
    expr:  Expr
    scale: number
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

try {
    const mainCanvas          = forceGetElementById("main-canvas")           as HTMLCanvasElement
    const axiomInput          = forceGetElementById("axiom-input")           as HTMLTextAreaElement
    const termsInputContainer = forceGetElementById("terms-input-container") as HTMLDivElement
    const iterCountInput      = forceGetElementById("iter-count-input")      as HTMLInputElement
    const defaultAngleInput   = forceGetElementById("default-angle-input")   as HTMLInputElement
    const renderButton        = forceGetElementById("render-button")         as HTMLButtonElement

    let axiom        = DEFAULT_EXPR
    let termsInfo    = new Map<string, TermInfo>()
    let iterCount    = 0
    let defaultAngle = 0

    const exprParser = new ExprParser()
    const renderer   = new Renderer(mainCanvas)

    axiomInput.oninput = onAxiomChange
    onAxiomChange()

    iterCountInput.oninput = onIterCountChange
    onIterCountChange()

    defaultAngleInput.oninput = onDefaultAngleChange
    onDefaultAngleChange()

    renderButton.onclick = onRender
    onRender()

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

    function updateTerms(newTerms: Set<string>) {
        const oldTermsInfo = termsInfo

        termsInfo = new Map()

        for (const term of newTerms) {
            const oldInfo = oldTermsInfo.get(term)

            if (oldInfo != null) {
                termsInfo.set(term, oldInfo)
                continue
            }

            termsInfo.set(term, {
                expr:  DEFAULT_EXPR,
                scale: DEFAULT_SCALE,
            })

            termsInputContainer.appendChild(createSetupTermInputContainer(term))
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

    function createSetupTermInputContainer(term: string) {
        const info = termsInfo.get(term)!

        return createTermInputContainer(term, {
            initExpr:  info.expr.tree.expr,
            initScale: info.scale,

            onExprChange(value) {
                const expr = exprParser.parse(value)
                const info = termsInfo.get(term)!

                info.expr = expr

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