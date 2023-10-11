export type ActionType = "draw-line"
                       | "turn"
                       | "save"
                       | "restore"

export interface ActionBase {
    type: ActionType
}

export interface DrawLineAction extends ActionBase {
    type:  "draw-line"
    scale: number
}

export interface TurnAction extends ActionBase {
    type:  "turn"
    angle: number
}

export interface SaveAction extends ActionBase {
    type: "save"
}

export interface RestoreAction extends ActionBase {
    type: "restore"
}

type Action = DrawLineAction
            | TurnAction
            | SaveAction
            | RestoreAction

export default Action