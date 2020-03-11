import React, { useState } from "react"
import css from "./App.module.css"
import { useAsync } from "react-use"
import { Footer } from "../component/Footer"
import Loader from "../component/Loader"
import AppProviders from "../component/AppProviders"
import AppSnackbar from "../component/AppSnackbar"
import * as lodash from "lodash"
import { ImgCanvas } from "../component/ImgCanvas"
import Jimp from "jimp"
import { Button, Typography, Input, withStyles } from "@material-ui/core"
import Fade from "@material-ui/core/Fade"
import { dataDir, modelFileSize } from "../lib/options"
import { OptionsPanel, RandomModes, ImageModel } from "../component/OptionsPanel"
import { isThisADeepFake, isFake, isReal, fetchImgData, downloadAndWarmupOnnxModel } from "../lib/utils"
import { Jumbo } from "../component/Jumbo"
import { Credits } from "../component/Credits"
import { HowItWorks } from "../component/HowItWorks"
import { isMobileDevice } from "../lib/mobile"
import AppModal from "../component/AppModal"

const CanvasButton: typeof Button = (withStyles(theme => ({
  root: {
    transition: "150ms",
    "&:hover": {
      filter: "brightness(70%)",
    },
  },
}))(Button) as unknown) as typeof Button

function App() {
  const filesState = useAsync<{ files: string[] }>(async () => {
    const response = await fetch(dataDir + "/file_list.json")
    if (!response.ok) {
      throw new Error("Could not fetch image list")
    }
    const files = (await response.json()) as string[]

    return { files }
  })
  const [selectedModel, setSelectedModel] = useState<ImageModel | "all">("all")
  const [selectedRandomMode, setSelectedRandomMode] = useState<RandomModes>("all")
  const [img, setImg] = useState<Jimp | null>(null)
  const [imgCategory, setImgCategory] = useState<"real" | "fake" | null>(null)
  const [fakeProb, setFakeProb] = useState<number | null>(null)
  const [modelLoadingStatus, setModelLoadingStatus] = useState<"not-loaded" | "mobile-confirm" | "loading" | "loaded">(
    "not-loaded",
  )

  function selectRandomFile(): string {
    if (!filesState.value) {
      throw new Error("Still loading data")
    }
    let availableFiles = filesState.value.files
    if (selectedModel !== "all") {
      availableFiles = availableFiles.filter(file => file.startsWith(selectedModel))
    }
    if (selectedRandomMode === "fake-only") {
      availableFiles = availableFiles.filter(isFake)
    }
    if (selectedRandomMode === "real-only") {
      availableFiles = availableFiles.filter(isReal)
    }
    if (!availableFiles.length) {
      throw new Error("Not a single eligible file :(")
    }
    const selectedFile = lodash.sample(availableFiles) as string
    return selectedFile
  }

  async function doDeepFakeAnalysis(newImg: Jimp) {
    setTimeout(async () => {
      const prob = await isThisADeepFake(newImg)
      setFakeProb(prob)
    }, 250)
  }

  async function triggerDeepFakeAnalysis(newImg: Jimp) {
    setImg(newImg)
    setFakeProb(null)

    if (modelLoadingStatus === "not-loaded") {
      if (isMobileDevice()) {
        setModelLoadingStatus("mobile-confirm")
      } else {
        setModelLoadingStatus("loading")
        await downloadAndWarmupOnnxModel()
        setModelLoadingStatus("loaded")
        await doDeepFakeAnalysis(newImg)
      }
    } else if (modelLoadingStatus === "mobile-confirm") {
      setModelLoadingStatus("loading")
      await downloadAndWarmupOnnxModel()
      setModelLoadingStatus("loaded")
      await doDeepFakeAnalysis(newImg)
    } else if (modelLoadingStatus === "loaded") {
      await doDeepFakeAnalysis(newImg)
    }
  }

  async function triggerRandomImageAnalysis() {
    const selectedFile = selectRandomFile()
    const { img: newImgData, fileName } = await fetchImgData(selectedFile)
    setImgCategory(isReal(fileName) ? "real" : "fake")
    await triggerDeepFakeAnalysis(newImgData)
  }

  return (
    <AppProviders>
      <div className={css.content}>
        <Jumbo />
        <div className={css.try} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {modelLoadingStatus === "not-loaded" && (
            <Typography variant="h5" component="h3">
              Try it yourself
            </Typography>
          )}
          {modelLoadingStatus === "loading" ? (
            <Typography variant="h5" component="h3" style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: "1em" }}>Loading neural network model</span> <Loader />
            </Typography>
          ) : (
            img && (
              <>
                <Typography variant="h5" component="h3" style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ marginRight: "0.5em" }}>Analysis:</span>
                  {fakeProb !== null ? (
                    <>
                      <span style={{ width: "2.5em", marginRight: "0.5em" }}>{fakeProb <= 0.5 ? "REAL" : "FAKE"}</span>
                      <span style={{ fontSize: "0.7em", width: "5.5em" }}>
                        ({Math.round(fakeProb * 100).toString()}% fake)
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          width: "2.5em",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: "0.5em",
                        }}
                      >
                        <Loader />
                      </span>
                      <span style={{ fontSize: "0.7em", width: "5.5em" }}>(processing)</span>
                    </>
                  )}
                </Typography>
              </>
            )
          )}
          {filesState.loading && <Loader />}
          {filesState.error && (
            <AppSnackbar message="Could not fetch image list" variant="error" onClose={() => {}} open={true} />
          )}

          <div style={{ marginTop: "1em", marginBottom: "1em" }}>
            <CanvasButton component="div" onClick={triggerRandomImageAnalysis}>
              <ImgCanvas
                img={modelLoadingStatus === "loaded" && img ? img : null}
                maxWH={modelLoadingStatus === "loaded" && img ? 350 : 300}
              />
            </CanvasButton>
          </div>

          {modelLoadingStatus === "loaded" && img && imgCategory && (
            <Typography style={{ display: "flex", alignItems: "center", marginBottom: "1em" }}>
              <span style={{ marginRight: "1em" }}>This image is in fact:</span>
              <span style={{ display: "flex", justifyContent: "center" }}>
                <Fade in={true}>
                  <span style={{ width: "3em" }}>
                    {fakeProb !== null ? (imgCategory === "fake" ? "FAKE" : "REAL") : "????"}
                  </span>
                </Fade>
              </span>
            </Typography>
          )}

          <div style={{ maxWidth: "350px", margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1em" }}>
              <Button color="primary" variant="contained" onClick={triggerRandomImageAnalysis}>
                Random Image
              </Button>

              <Input
                style={{ display: "none" }}
                id="raised-button-file"
                type="file"
                inputProps={{
                  multiple: false,
                  // accept Jimp compatible formats
                  accept: "image/png|image/jpeg|image/bmp|image/tiff|image/gif",
                }}
                onChange={async evt => {
                  // @ts-ignore
                  const inputFile = evt.target.files.length > 0 ? evt.target.files[0] : null

                  const reader = new FileReader()

                  // Closure to capture the file information.
                  reader.onload = async readEvt => {
                    const arb = readEvt?.target?.result as Buffer | null | undefined
                    if (!arb) {
                      throw new Error("Cannot read file")
                    }

                    const newImg = await Jimp.read(arb)
                    setImgCategory(null)
                    await triggerDeepFakeAnalysis(newImg)
                  }

                  // Read in the image file as a file buffer
                  reader.readAsArrayBuffer(inputFile)
                }}
              />
              <label htmlFor="raised-button-file">
                <Button color="primary" variant="contained" component="span">
                  Use your own
                </Button>
              </label>
            </div>
            <OptionsPanel
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedRandomMode={selectedRandomMode}
              setSelectedRandomMode={setSelectedRandomMode}
            />
          </div>
        </div>
      </div>
      <AppModal
        small={true}
        open={modelLoadingStatus === "mobile-confirm"}
        title={
          <Typography variant="h5" component="div">
            Downloading large model file: {modelFileSize}
          </Typography>
        }
        onClose={() => setModelLoadingStatus("not-loaded")}
      >
        <div>
          <Typography component="div">
            We detected that you use a mobile device. Before proceeding, we need to download the neural network model
            file. It's a large file and downloading it over the network may be{" "}
            <strong>slow and may incur charges</strong> by your mobile network provider.
          </Typography>
          <div
            style={{
              display: "flex",
              width: "100%",
              marginTop: "1em",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button color="secondary" variant="outlined" onClick={() => setModelLoadingStatus("not-loaded")}>
              Cancel
            </Button>
            <Button
              style={{ marginLeft: "1em" }}
              color="primary"
              variant="contained"
              onClick={async () => {
                if (!img) {
                  throw new Error("No img data")
                }
                await triggerDeepFakeAnalysis(img)
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </AppModal>
      <div style={{ padding: "3em" }}>
        <div>TODO: credits </div>
        <div>TODO: how it works </div>
        <div>
          TODO: add a caveats section, warning users about the need for original images data, no screenshot, no
          processing, etc.
        </div>
        <div>TODO: metadata social network sharing</div>

        <div>Nice to have:</div>
        <div>TODO: test browser compatibility. </div>
        <div>TODO: change onnx backend (GPU/CPU) </div>
        <div>TODO: random image url partageables</div>
        <div>TODO: add a model file download progress bar. </div>
        <div>
          TODO: add the ability to send us a picture that was wrongfully classified. Ex: i load an image, it's a fake,
          the model tells us that it is not, add a "send feedback" button
        </div>
        <div>TODO: use tree-shakable mui imports. </div>
        <div>TODO: tests and build and deploy in CI</div>
        <div>TODO: refactor APP.js</div>
        <div>TODO: async component for non-above-the-fold content</div>
        <div>TODO: use pure components when appropriate</div>
        <div>TODO: Refactor ugly React code</div>
        <Credits />
        <HowItWorks />
      </div>
      <Footer />
    </AppProviders>
  )
}

export default App
