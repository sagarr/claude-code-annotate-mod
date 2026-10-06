export type Selected = { quote: string; rowId?: string }

export type Annotation = Selected & { id: number; comment: string }

declare module 'claude-code' {
  interface PluginState {
    annotate: {
      annotations: Annotation[]
      selection: Selected | null
      pending: Selected | null
      used: Selected | null
      nextId: number
    }
  }
}
