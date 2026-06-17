import { createContext } from 'react'

/** Shares the generated field id between `Field.Label` and `Field.Control`. */
export const FieldIdContext = createContext<string>('')
