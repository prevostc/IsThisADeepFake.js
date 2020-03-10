import React from "react"

import { makeStyles, Modal, Theme } from "@material-ui/core"
import IconButton from "@material-ui/core/IconButton"
import { ModalProps } from "@material-ui/core/Modal"
import CloseIcon from "@material-ui/icons/Close"
import clsx from "clsx"
import { AnyChildren } from "../react-type-helpers"
import Fade from "@material-ui/core/Fade"

const useStyle = makeStyles<Theme, { fullscreen: boolean; small: boolean }>(theme => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    maxHeight: props => (props.fullscreen ? "99vh" : "90vh"),
    minHeight: props => (props.fullscreen ? "99vh" : undefined),
    height: props => (props.fullscreen ? "99vh" : undefined),
    backgroundColor: theme.palette.background.paper,
    border: "2px solid",
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[5],
    padding: "10px 15px 20px 15px",
    width: props => (props.fullscreen ? "99vw" : props.small ? "min(400px, 99vw)" : "min(700px, 99vw)"),
    maxWidth: props => (props.fullscreen ? "1200px" : props.small ? "min(400px, 99vw)" : "min(700px, 99vw)"),
    borderRadius: 10,

    display: "flex",
    flexDirection: "column",

    "&:focus": {
      outline: "none",
    },
  },
  contentContainer: {
    overflowY: "auto",
    height: "100%",
    widtht: "100%",
    paddingTop: props => (props.small ? 0 : "2em"),
  },
  titleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "0.5em",
  },
  title: {
    // make title at most 100% minus the close button width
    maxWidth: props => (props.fullscreen ? undefined : "calc(100% - 50px)"),
  },
}))

export default function AppModal({
  children,
  className,
  title,
  fullscreen = false,
  small = false,
  onClose,
  ...props
}: Omit<ModalProps, "title"> & { fullscreen?: boolean; title?: AnyChildren; small?: boolean }) {
  const classes = useStyle({ fullscreen, small })
  return (
    <Modal {...props} onClose={onClose} className={clsx(classes.modal, className)}>
      <Fade in={props.open}>
        <div className={classes.paper}>
          <div className={classes.titleContainer}>
            <div className={classes.title}>{title}</div>
            <IconButton onClick={onClose ? () => onClose({}, "backdropClick") : undefined}>
              <CloseIcon />
            </IconButton>
          </div>
          <div className={classes.contentContainer}>{children}</div>
        </div>
      </Fade>
    </Modal>
  )
}
