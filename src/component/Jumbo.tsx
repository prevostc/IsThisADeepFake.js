import React from "react"
import MuiTypography from "@material-ui/core/Typography"
import { withStyles, makeStyles } from "@material-ui/core"

/*
xs, extra-small: 0px
sm, small: 600px
md, medium: 960px
lg, large: 1280px
xl, extra-large: 1920px
*/
const ResponsiveTypography: typeof MuiTypography = (withStyles(theme => ({
  root: {
    [theme.breakpoints.down("xs")]: {
      fontSize: (props: any) => (props.component === "h1" ? "2em" : "1em"),
    },
  },
}))(MuiTypography) as unknown) as typeof MuiTypography

const useStyles = makeStyles(theme => ({
  header: {
    textAlign: "center",
    minHeight: "30vh",
    [theme.breakpoints.down("sm")]: {
      minHeight: "25vh",
    },
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "calc(10px + 2vmin)",
  },
}))

export function Jumbo() {
  const classes = useStyles()
  return (
    <div className={classes.header}>
      <ResponsiveTypography variant="h3" component="h1">
        IsThisADeepFake.js
      </ResponsiveTypography>
      <ResponsiveTypography variant="h4" component="h2">
        Deep fake detection in the browser
      </ResponsiveTypography>
    </div>
  )
}
