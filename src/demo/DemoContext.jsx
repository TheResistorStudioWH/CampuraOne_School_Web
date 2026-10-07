import { createContext, useContext, useRef, useState } from 'react'
import { createDemoState, runDemoCommand } from './schoolDemo.js'

const Context = createContext(null)
// Provider owns one login session. Commands use the same version guards as the local API.
export function DemoProvider({ children }) {
  const [state, setState] = useState(createDemoState)
  const latest = useRef(state)
  function execute(resource, method, input) {
    const result = runDemoCommand(latest.current, resource, method, input)
    latest.current = result.state
    setState(result.state)
    return result.response
  }
  return <Context.Provider value={{ state, execute }}>{children}</Context.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useSchoolDemo() { return useContext(Context) }
