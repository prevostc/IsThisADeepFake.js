import CssBaseline from "@material-ui/core/CssBaseline"
import { ThemeProvider } from "@material-ui/styles"
import React from "react"
import { AnyChildren } from "../react-type-helpers"
import { MessageContextProvider } from "../state/message"
import { createMuiTheme } from "@material-ui/core"

const theme = createMuiTheme({
  spacing: 8,

  palette: {
    primary: {
      main: "#D5DFE5",
    },
    secondary: {
      main: "#E6B89C",
    },
    error: {
      main: "#FE938C",
    },
    background: {
      default: "#ffffff",
    },
  },

  overrides: {
    // Style sheet name ⚛️
    MuiMenu: {
      // Name of the rule
      paper: {
        // we ise !important to override inline style
        // make select list as large as needed
        // these are use as filters atop grid columns
        width: "unset !important",
        // but not too large
        maxWidth: "400px !important",
        // and not too small
        minWidth: "150px !important",
      },
    },
    MuiDrawer: {
      paper: {
        borderRight: 0,
      },
      paperAnchorDockedLeft: {
        borderRight: 0,
      },
    },
    MuiDivider: {
      root: {
        height: 0,
        marginTop: "1.5em",
      },
    },
    MuiAppBar: {
      root: {
        boxShadow: "none",
        borderBottom: 0,
      },
    },
    MuiListSubheader: {
      root: {
        fontSize: "1.3em",
        color: "inherit",
      },
      sticky: {
        position: "initial",
      },
    },
    MuiTabs: {
      scrollButtons: {
        boxShadow: "-1em 0 10px -10px #ccc",
      },
    },
    MuiSnackbarContent: {
      root: {
        backgroundColor: "transparent",
      },
    },
    MuiFormControl: {
      root: {
        zIndex: "initial",
      },
    },
  },
})
export default function AppProviders({ children }: { children: AnyChildren }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <MessageContextProvider>{children}</MessageContextProvider>
    </ThemeProvider>
  )
}
