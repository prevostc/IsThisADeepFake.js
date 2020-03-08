import React from "react"
import css from "./Footer.module.css"

export function Footer() {
  return (
    <div className={css.footer}>
      <p className={css.credits}>
        Made with <span className={css.heart}>♥</span> by{" "}
        <a href="https://www.linkedin.com/in/clement-prevost/" title="Linkedin Clément Prévost">
          Titoune
        </a>
      </p>
    </div>
  )
}
