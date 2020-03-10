import React, { useState } from "react"
import css from "./App.module.css"
import { useAsync } from "react-use"
import { Footer } from "../component/Footer"
import { Tensor } from "onnxjs"
import Loader from "../component/Loader"
import AppProviders from "../component/AppProviders"
import AppSnackbar from "../component/AppSnackbar"
import * as lodash from "lodash"
import { ImgCanvas } from "../component/ImgCanvas"
import Jimp from "jimp"
import { Button, Typography, Input } from "@material-ui/core"
import { dataDir, myOnnxSession, centerCropSize } from "../lib/options"
import { OptionsPanel, RandomModes, ImageModel } from "../component/OptionsPanel"
import { isItADeepFake, isFake, isReal, fetchImgData } from "../lib/utils"
import { Jumbo } from "../component/Jumbo"

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
  const [modelLoadStatus, setModelLoadStatus] = useState<"not-loaded" | "loading" | "loaded">("not-loaded")

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

  async function triggerDeepFakeAnalysis(newImgData: { img: Jimp; fileName: string }) {
    if (modelLoadStatus === "not-loaded") {
      setModelLoadStatus("loading")
      await myOnnxSession.loadModel(dataDir + "/model/cnndetection.onnx")
      // trigger dummy analysis to load the model in memory
      const inputs = [
        new Tensor(
          Array.from({ length: centerCropSize * centerCropSize * 3 }, (_, i) => 0),
          "float32",
          [1, 3, centerCropSize, centerCropSize],
        ),
      ]
      await myOnnxSession.run(inputs)
      setModelLoadStatus("loaded")
    }

    setImg(newImgData)
    setFakeProb(null)
    setTimeout(async () => {
      const prob = await isItADeepFake(newImgData.img)
      setFakeProb(prob)
    }, 250)
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
          {modelLoadStatus === "loading" ? (
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
                    await triggerDeepFakeAnalysis(newImgData)
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
                      await triggerDeepFakeAnalysis({ img: newImg, fileName: "user image" })
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
      <Footer />
    </AppProviders>
  )
}

export default App
