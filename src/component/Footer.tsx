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
      <p style={{ fontSize: "10px", margin: "2px" }}>
        Source Code:{" "}
        <a href="https://github.com/prevostc/IsThisADeepFake.js" title="Github link to source code">
          prevostc/IsThisADeepFake.js
        </a>
      </p>
      <p style={{ fontSize: "10px", margin: "2px" }}>
        Based on the source code and model of the original paper:{" "}
        <a href="https://peterwang512.github.io/CNNDetection/" title="Original paper">
          CNNDetection
        </a>
      </p>
      <p style={{ fontSize: "10px", margin: "2px" }}>
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
      </p>
    </div>
  )
}
