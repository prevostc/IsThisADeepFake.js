import React, { useState } from "react"
import AppSnackbar from "../component/AppSnackbar"
import { AnyChildren } from "../react-type-helpers"

interface MessageContextState {
  open: boolean
  message: AnyChildren
  showMessage: (message: AnyChildren) => void
}

const defaultValue: MessageContextState = {
  open: false,
  message: <></>,
  showMessage: () => {},
}
const MessageContext = React.createContext<MessageContextState>(defaultValue)

export function MessageContextProvider({ children }: { children: AnyChildren }) {
  const [state, setState] = useState({ message: defaultValue.message, open: defaultValue.open })
  // and the provider provode... provided... provide... providera...
  // and the message is properly set
  return (
    <MessageContext.Provider
      value={{
        open: state.open,
        message: state.message,
        showMessage: msg => setState({ open: true, message: msg }),
      }}
    >
      <AppSnackbar
        variant="info"
        message={state.message}
        open={state.open}
        onClose={() => setState({ ...state, open: false })}
      />
      {children}
    </MessageContext.Provider>
  )
}

export function useGlobalMessage(): MessageContextState {
  return React.useContext(MessageContext)
}
