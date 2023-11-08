import DeepReadonly         from "./util/DeepReadonly"

import { radiansToDegrees } from "./util/math"


export interface TermDef {
    expr:       string
    scale?:     number
    lineWidth?: number
    color?:     string
}

export interface ReadonlyTermDef extends Readonly<TermDef> {}


export interface Predef {
    name:             string
    axiom:            string
    backgroundColor?: string
    defaultAngle?:    number
    terms?:           {
        [key: string]: TermDef
    }
}

export interface ReadonlyPredef extends DeepReadonly<Predef> {}

export default Predef


export const ARRAY: readonly ReadonlyPredef[] = [ 
    {
        name:  "Empty",
        axiom: "",
    },

    {
        defaultAngle: 90,
        name:         "Harter-Haythaway's Dragon",
        axiom:        "+97.5 F X",
        terms:        {
            F: {
                expr:  "F",
                color: "#942192",
            },

            X: {
                expr:  "X + Y F +",
                color: "#FF40FF",
            },

            Y: {
                expr:  "- F X - Y",
                color: "#FF2600",
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "Serpinsky Carpet",
        axiom:        "F X F - - F F - - F F",
        terms:        {
            F: {
                expr: "F F",
            },

            X: {
                expr: "- - F X F + + F X F + + F X F - -",
            },
        },
    },

    {
        defaultAngle: 90,
        name:         "Hilbert Curve Filling the Plane",
        axiom:        "X",
        terms:        {
            F: {
                expr: "F",
            },

            X: {
                expr: "- Y F + X F X + F Y -",
            },

            Y: {
                expr: "+ X F - Y F Y - F X +",
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "Gosper Curve Filling the Plane",
        axiom:        "X F",
        terms:        {
            F: {
                expr:  "F",
                color: "#FF0000",
            },

            X: {
                expr:  "X + Y F + + Y F - F X - - F X F X - Y F +",
                color: "#00FF00",
            },

            Y: {
                expr:  "- F X + Y F Y F + + Y F + F X - - F X - Y",
                color: "#0000FF",
            },
        },
    },

    {
        defaultAngle: 90,
        name:         "The Serpinsky Curve Filling the Plane",
        axiom:        "+45 F",
        terms:        {
            F: {
                expr: "F - F + F + F +F - F - F - F + F",
            },
        },
    },

    {
        defaultAngle: 22.5,
        name:         "Bush",
        axiom:        "F",
        terms:        {
            F: {
                expr:  "- F + F + [ + F - F - ] - [ - F + F + F ]",
                color: "#006B00",
            },
        },
    },

    {
        defaultAngle: 90,
        name:         "Hagerty Mosaic",
        axiom:        "F - F - F - F",
        terms:        {
            F: {
                expr: "F - B + F - F - F - F B - F + B - F + F + F + F B + F F",
            },

            B: {
                expr:      "B B B B",
                lineWidth: 0,
            },
        },
    },

    {
        defaultAngle: 90,
        name:         "Island",
        axiom:        "F - F - F - F",
        terms:        {
            F: {
                expr: "F + F - F - F F F + F +F - F",
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "Snowflake",
        axiom:        "[ F ] + [ F ] + [ F ] + [ F ] + [ F ] + [ F ]",
        terms:        {
            F: {
                expr:  "F [ + + F ] [ - F F ] F F [ + F ] [ - F ] F F",
                color: "#00FCFF",
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "Koch's Snowflake",
        axiom:        "F + + F + + F",
        terms:        {
            F: {
                expr:  "F - F + + F - F",
                color: "#00FCFF",
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "The Peano Curve",
        axiom:        "F",
        terms:        {
            F: {
                expr: "F - F + F + F + F - F - F - F + F",
            },
        },
    },

    {
        defaultAngle: radiansToDegrees(Math.PI / 7),
        name:         "Weed",
        axiom:        "-90 F",
        terms:        {
            F: {
                expr:  "F [ + F ] F [ - F ] F",
                color: "#006B00",
            },
        },
    },

    {
        defaultAngle: radiansToDegrees(Math.PI / 16),
        name:         "Flower",
        axiom:        "-90 F [ + F + F ] [ - F - F ] [ + + F ] [ - - F ] F",
        terms:        {
            F: {
                expr: "F F [ + + F ] [ + F ] [ F ] [ - F ] [ - - F ]",
            },
        },
    },

    {
        defaultAngle: 90,
        name:         "Chain",
        axiom:        "F + F + F + F",
        terms:        {
            F: {
                expr: "F + B - F - F F F + F + B - F",
            },

            B: {
                expr:      "B B B",
                lineWidth: 0,
            },
        },
    },

    {
        defaultAngle: 60,
        name:         "Cells",
        axiom:        "F",
        terms:        {
            F: {
                expr: "F [+F] [-F]",
            }
        },
    },
]