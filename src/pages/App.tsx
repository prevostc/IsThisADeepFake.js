import React, { useState } from "react"
import css from "./App.module.css"
import { useAsync } from "react-use"
import { Footer } from "../component/Footer"
import { Tensor } from "onnxjs"
import Loader from "../component/Loader"
import AppProviders from "../component/AppProviders"
import AppSnackbar from "../component/AppSnackbar"
import * as lodash from "lodash"
import ListSelect from "../component/ListSelect"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import { FormHelperText, Input } from "@material-ui/core"
import { ImgCanvas } from "../component/ImgCanvas"
import Jimp from "jimp"
import {
  Button,
  ExpansionPanel,
  ExpansionPanelSummary,
  Typography,
  FormControl,
  ExpansionPanelDetails,
  InputLabel,
} from "@material-ui/core"

const centerCropSize = 224
function isFake(fileName: string) {
  return fileName.indexOf("1_fake") !== -1
}
function isReal(fileName: string) {
  return fileName.indexOf("0_real") !== -1
}

async function fetchImgData(fileName: string): Promise<{ img: Jimp; fileName: string }> {
  const img = await Jimp.read("/data/CNN_synth_testset/" + fileName)
  return { img, fileName }
  /*
  const ow = image.getWidth()
  const oh = image.getHeight()
  const scaleFactor = Math.max(ow / centerCropSize, oh / centerCropSize)
  const sw = Math.floor(ow / scaleFactor)
  const sh = Math.max(oh / scaleFactor)
  image = image.resize(sw, sh)
*/
}

// create a session
const myOnnxSession = new onnx.InferenceSession()

async function isItADeepFake(img: Jimp): Promise<number> {
  // first, CenterCrop(224)
  const ow = img.getWidth()
  const oh = img.getHeight()
  const cw = Math.min(centerCropSize, ow)
  const ch = Math.min(centerCropSize, oh)
  const cx = Math.max(Math.round(ow / 2 - centerCropSize / 2), 0)
  const cy = Math.max(Math.round(oh / 2 - centerCropSize / 2), 0)
  img = img.crop(cx, cy, cw, ch)

  // https://stackoverflow.com/a/10475622/2523414
  // imgData is now an array where every 4 places are each pixel.
  // So [0][1][2][3] are the [r][g][b][a] of the first pixel.
  const imgData = img.bitmap.data

  // we normalize and build the final data ((x - x̄) / s)
  const norm_mean = [0.485, 0.456, 0.406]
  const norm_std = [0.229, 0.224, 0.225]

  const model_input = new Float32Array(3 * centerCropSize * centerCropSize)
  // for each color channel
  for (let ci = 0; ci < 3; ci++) {
    for (let rowi = 0; rowi < centerCropSize; rowi++) {
      for (let coli = 0; coli < centerCropSize; coli++) {
        const idpi = (coli + rowi * centerCropSize) * 4 /* input from canvas has an alpha channel */
        const tensor_val_i = imgData[idpi + ci] / 255.0 /* torchvision.transforms.ToTensor */
        const norm_tensor_val_i = (tensor_val_i - norm_mean[ci]) / norm_std[ci] /* torchvision.transforms.Normalize */
        model_input[ci * centerCropSize * centerCropSize + rowi * centerCropSize + coli] = norm_tensor_val_i
      }
    }
  }

  // note that we used a trick to avoid the onnx Shape operator
  // that prevent us from having a batch size greater than 1
  // more info: https://github.com/microsoft/onnxjs/issues/84#issuecomment-461682909
  const inputs = [new Tensor(model_input, "float32", [1, 3, centerCropSize, centerCropSize])]

  const outputMap = await myOnnxSession.run(inputs)
  const outputTensor = outputMap.values().next().value
  const res = outputTensor.data[0]
  // const res = 11.138656 // fake
  // const res = -31.707857 // real
  const prob = 1 / (1 + Math.exp(-res)) /* sigmoid */

  return prob
}

const randomModeOptions: { value: "all" | "fake-only" | "real-only"; label: string }[] = [
  {
    label: "Any image",
    value: "all",
  },
  { label: "Only fakes images", value: "fake-only" },
  { label: "Only real images", value: "real-only" },
]

function App() {
  const filesState = useAsync<{ models: string[]; files: string[] }>(async () => {
    const response = await fetch("/data/file_list.txt")
    if (!response.ok) {
      throw new Error("Could not fetch image list")
    }
    const files = (await response.text()).split("\n")
    const models = lodash.uniq(files.map(fileName => fileName.split("/")[0]))
    return { files, models }
  })
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedRandomMode, setSelectedRandomMode] = useState<"all" | "fake-only" | "real-only">("all")
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [img, setImg] = useState<{ img: Jimp; fileName: string } | null>(null)
  const [fakeProb, setFakeProb] = useState<number | null>(null)
  const [modelLoadStatus, setModelLoadStatus] = useState<"not-loaded" | "loading" | "loaded">("not-loaded")

  function selectRandomFile(): string {
    if (!filesState.value) {
      throw new Error("Still loading data")
    }
    let availableFiles = filesState.value.files
    if (selectedModel) {
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
      await myOnnxSession.loadModel("/data/model/cnndetection.onnx")
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
        <div className={css.header}>
          <Typography variant="h1">IsThisADeepFake.js</Typography>
          <Typography variant="h2">Deep fake detection in the browser</Typography>
        </div>
        <div className={css.try}>
          <Typography variant="h3">Try it yourself</Typography>

          <div>
            {img && (
              <>
                <span>{img.fileName}</span>
                <ImgCanvas img={img.img} />
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
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
              <ExpansionPanel
                disabled={fakeProb === null && img !== null}
                expanded={optionsOpen}
                onChange={() => setOptionsOpen(!optionsOpen)}
              >
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Advanced options</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <FormControl>
                    <InputLabel>Random Image Mode</InputLabel>
                    <ListSelect
                      value={randomModeOptions.find(r => r.value === selectedRandomMode)}
                      items={randomModeOptions}
                      onSelect={r => setSelectedRandomMode(r.value)}
                      getLabel={r => r.label}
                      getValue={r => r.value}
                    />
                    <FormHelperText>Use this to use a random image from any open source deep fake model</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <InputLabel>Deep Fake Model</InputLabel>
                    <ListSelect
                      placeholder="From any deepfake model"
                      value={selectedModel}
                      items={filesState.value.models}
                      onSelect={setSelectedModel}
                    />
                    <FormHelperText>Use this to use a random image from any open source deep fake model</FormHelperText>
                  </FormControl>
                </ExpansionPanelDetails>
              </ExpansionPanel>
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
