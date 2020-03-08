import { makeStyles, Snackbar } from "@material-ui/core"
import { amber, green } from "@material-ui/core/colors"
import IconButton from "@material-ui/core/IconButton"
import CheckCircleIcon from "@material-ui/icons/CheckCircle"
import CloseIcon from "@material-ui/icons/Close"
import ErrorIcon from "@material-ui/icons/Error"
import InfoIcon from "@material-ui/icons/Info"
import WarningIcon from "@material-ui/icons/Warning"
import clsx from "clsx"
import React from "react"
import { AnyChildren } from "../react-type-helpers"

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
}

const useStyles = makeStyles(theme => ({
  close: {
    padding: theme.spacing(0.5),
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: "flex",
    alignItems: "center",
  },
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
}))

export default function AppSnackbar({
  message,
  open,
  onClose,
  variant = "info",
}: {
  message: AnyChildren
  open: boolean
  onClose: () => void
  variant: "info" | "error" | "success" | "warning"
}) {
  const classes = useStyles()
  const Icon = variantIcon[variant]
  return (
    <Snackbar
      className={classes[variant]}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      ContentProps={{
        "aria-describedby": "message-id",
      }}
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          {message}
        </span>
      }
      action={[
        <IconButton key="close" aria-label="close" color="inherit" className={classes.close} onClick={onClose}>
          <CloseIcon />
        </IconButton>,
      ]}
    />
  )
}
