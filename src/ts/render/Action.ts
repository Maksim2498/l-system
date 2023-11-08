export type ActionType = "draw-line"
                       | "turn"
                       | "save"
                       | "restore"


export interface Base {
    type: ActionType
}

export interface ReadonlyBase extends Readonly<Base> {}


export interface DrawLine extends Base {
    type:  "draw-line"
    scale: number
}

export interface ReadonlyDrawLine extends Readonly<DrawLine> {}


export interface Turn extends Base {
    type:  "turn"
    angle: number
}

export interface ReadonlyTurn extends Readonly<Turn> {}


export interface Save extends Base {
    type: "save"
}

export interface ReadonlySave extends Readonly<Save> {}


export interface Restore extends Base {
    type: "restore"
}

export interface ReadonlyRestore extends Readonly<Restore> {}


export type Action         = DrawLine
                           | Turn
                           | Save
                           | Restore

export type ReadonlyAction = Readonly<Action>


export default Action