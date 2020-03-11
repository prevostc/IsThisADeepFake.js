import React from "react"
import css from "./Footer.module.css"

export function Footer() {
  return (
    <div className={css.footer}>
      <p className={css.credits} style={{ marginBottom: "2em" }}>
        Made with <span className={css.heart}>♥</span> by{" "}
        <a href="https://www.linkedin.com/in/clement-prevost/" title="Linkedin Clément Prévost">
          Titoune
        </a>
      </p>
      <div style={{ fontSize: "8px" }}>
        Icons made by{" "}
        <a href="https://www.flaticon.com/authors/flat-icons" title="Flat Icons">
          Flat Icons
        </a>{" "}
        and{" "}
        <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
          Freepik
        </a>{" "}
        from{" "}
        <a href="https://www.flaticon.com/" title="Flaticon">
          www.flaticon.com
        </a>
      </div>
      <p style={{ fontSize: "8px" }}>
        Github:{" "}
        <a href="https://github.com/prevostc/IsThisADeepFake.js" title="Github link to source code">
          prevostc/IsThisADeepFake.js
        </a>
      </p>
    </div>
  )
}
