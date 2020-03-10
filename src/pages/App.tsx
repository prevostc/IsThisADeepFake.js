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
import { Button, Typography, Input } from "@material-ui/core"
import { dataDir, modelFileSize } from "../lib/options"
import { OptionsPanel, RandomModes, ImageModel } from "../component/OptionsPanel"
import { isThisADeepFake, isFake, isReal, fetchImgData, downloadAndWarmupOnnxModel } from "../lib/utils"
import { Jumbo } from "../component/Jumbo"
import { Credits } from "../component/Credits"
import { HowItWorks } from "../component/HowItWorks"
import { isMobileDevice } from "../lib/mobile"
import AppModal from "../component/AppModal"

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
  const [img, setImg] = useState<{ img: Jimp; fileName: string } | null>(null)
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

  async function doDeepFakeAnalysis() {
    if (img === null) {
      throw new Error("No image loaded")
    }
    setTimeout(async () => {
      const prob = await isThisADeepFake(img.img)
      setFakeProb(prob)
    }, 250)
  }

  async function triggerDeepFakeAnalysis() {
    if (modelLoadingStatus === "not-loaded") {
      if (isMobileDevice()) {
        setModelLoadingStatus("mobile-confirm")
      } else {
        setModelLoadingStatus("loading")
        await downloadAndWarmupOnnxModel()
        setModelLoadingStatus("loaded")
        doDeepFakeAnalysis()
      }
    } else if (modelLoadingStatus === "mobile-confirm") {
      setModelLoadingStatus("loading")
      await downloadAndWarmupOnnxModel()
      setModelLoadingStatus("loaded")
      doDeepFakeAnalysis()
    } else if (modelLoadingStatus === "loaded") {
      doDeepFakeAnalysis()
    }
  }

  return (
    <AppProviders>
      <div className={css.content}>
        <Jumbo />
        <div className={css.try} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h5" component="h3">
            Try it yourself
          </Typography>

          <div>
            {img && (
              <>
                <span>{img.fileName}</span>
                <ImgCanvas img={img.img} maxWH={400} />
              </>
            )}
          </div>
          {modelLoadingStatus === "loading" ? (
            <div>
              Loading neural network model <Loader />
            </div>
          ) : (
            img && (
              <div>
                Deep Fake Probability:
                {fakeProb !== null ? Math.round(fakeProb * 100).toString() : <Loader />}%
              </div>
            )
          )}
          {filesState.loading && <Loader />}
          {filesState.value && (
            <div style={{ maxWidth: "300px", margin: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1em" }}>
                <Button
                  color="primary"
                  variant="contained"
                  disabled={fakeProb === null && img !== null}
                  onClick={async () => {
                    const selectedFile = selectRandomFile()
                    const newImgData = await fetchImgData(selectedFile)
                    setImg(newImgData)
                    setFakeProb(null)
                    await triggerDeepFakeAnalysis()
                  }}
                >
                  Random Image
                </Button>

                <Input
                  disabled={fakeProb === null && img !== null}
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
                      setImg({ img: newImg, fileName: "user image" })
                      setFakeProb(null)
                      await triggerDeepFakeAnalysis()
                    }

                    // Read in the image file as a file buffer
                    reader.readAsArrayBuffer(inputFile)
                  }}
                />
                <label htmlFor="raised-button-file">
                  <Button
                    disabled={fakeProb === null && img !== null}
                    color="primary"
                    variant="contained"
                    component="span"
                  >
                    Use your own
                  </Button>
                </label>
              </div>
              <OptionsPanel
                disabled={fakeProb === null && img !== null}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                selectedRandomMode={selectedRandomMode}
                setSelectedRandomMode={setSelectedRandomMode}
              />
            </div>
          )}
          {filesState.error && (
            <AppSnackbar message="Could not fetch image list" variant="error" onClose={() => {}} open={true} />
          )}
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
                await triggerDeepFakeAnalysis()
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </AppModal>
      <div style={{ padding: "3em" }}>
        <div>TODO: better random image display style. </div>
        <div>TODO: better fake probability display style. </div>
        <div>TODO: credits </div>
        <div>TODO: how it works </div>
        <div>TODO: change onnx backend (GPU/CPU) </div>
        <div>TODO: test browser compatibility. </div>
        <div>TODO: fix safari bug: analysis never finishes</div>
        <div>
          TODO: add a caveats section, warning users about the need for original images data, no screenshot, no
          processing, etc.
        </div>
        <div>TODO: metadata social network sharing</div>

        <div>Nice to have:</div>
        <div>TODO: random image url partageables</div>
        <div>TODO: add a model file download progress bar. </div>
        <div>
          TODO: add the ability to send us a picture that was wrongfully classified. Ex: i load an image, it's a fake,
          the model tells us that it is not, add a "send feedback" button
        </div>
        <Credits />
        <HowItWorks />
      </div>
      <Footer />
    </AppProviders>
  )
}

export default App
