import { ReadonlyAction } from "./Action"

export default interface Renderer {
    render(actions: ReadonlyAction[]): void
}