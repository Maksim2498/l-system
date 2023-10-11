import Action from "./Action"

export default interface Renderer {
    render(actions: Action[]): void
}