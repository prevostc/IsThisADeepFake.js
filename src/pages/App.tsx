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
  ExpansionPanelDetails,
  InputLabel,
} from "@material-ui/core"

const centerCropSize = 224
const dataDir = process.env.REACT_APP_DATA_DIRECTORY || "/data_dev"

// const dataDir = "/data"
function isFake(fileName: string) {
  return fileName.indexOf("1_fake") !== -1
}
function isReal(fileName: string) {
  return fileName.indexOf("0_real") !== -1
}

async function fetchImgData(fileName: string): Promise<{ img: Jimp; fileName: string }> {
  const img = await Jimp.read(dataDir + "/CNN_synth_testset/" + fileName)
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
    label: "Fake or real images",
    value: "all",
  },
  { label: "Only fakes images", value: "fake-only" },
  { label: "Only real images", value: "real-only" },
]

const modelOptions: (
  | { value: "all"; label: string }
  | {
      value: string
      label: string
      authors: string
      paper?: string
      paperUrl: string
      date: string
    }
)[] = [
  {
    value: "all",
    label: "From any deepfake model",
  },
  {
    value: "biggan",
    label: "BigGAN",
    paper: "Large Scale GAN Training for High Fidelity Natural Image Synthesis",
    authors: "Andrew Brock, Jeff Donahue, Karen Simonyan",
    paperUrl: "https://arxiv.org/abs/1809.11096",
    date: "Submitted on 28 Sep 2018 (v1), last revised 25 Feb 2019 (this version, v2)",
  },
  {
    value: "deepfake",
    label: "Deep Fake",
    paper: "FaceForensics++: Learning to Detect Manipulated Facial Images",
    authors: "Andreas Rössler, Davide Cozzolino, Luisa Verdoliva, Christian Riess, Justus Thies, Matthias Nießner",
    paperUrl: "https://arxiv.org/abs/1901.08971",
    date: "Submitted on 25 Jan 2019 (v1), last revised 26 Aug 2019 (this version, v3)",
  },
  {
    value: "progan",
    label: "ProGAN",
    paper: "Progressive Growing of GANs for Improved Quality, Stability, and Variation",
    authors: "Tero Karras, Timo Aila, Samuli Laine, Jaakko Lehtinen",
    paperUrl: "https://arxiv.org/abs/1710.10196",
    date: "Submitted on 27 Oct 2017 (v1), last revised 26 Feb 2018 (this version, v3)",
  },
  {
    value: "stargan",
    label: "StarGAN",
    paper: "StarGAN: Unified Generative Adversarial Networks for Multi-Domain Image-to-Image Translation",
    authors: "Yunjey Choi, Minje Choi, Munyoung Kim, Jung-Woo Ha, Sunghun Kim, Jaegul Choo",
    paperUrl: "https://arxiv.org/abs/1711.09020",
    date: "Submitted on 24 Nov 2017 (v1), last revised 21 Sep 2018 (this version, v3)",
  },
  {
    value: "whichfaceisreal",
    label: "Which Face Is Real",
    authors: "Jevin West, Carl Bergstrom ",
    paperUrl: "http://www.whichfaceisreal.com",
    date: "2019",
  },
  {
    value: "crn",
    label: "CRN",
    paper: "Photographic Image Synthesis with Cascaded Refinement Networks",
    authors: "Qifeng Chen, Vladlen Koltun",
    paperUrl: "https://arxiv.org/abs/1707.09405",
    date: "Submitted on 28 Jul 2017",
  },
  {
    value: "gaugan",
    label: "GauGAN",
    paper: "Semantic Image Synthesis with Spatially-Adaptive Normalization",
    authors: "Taesung Park, Ming-Yu Liu, Ting-Chun Wang, Jun-Yan Zhu",
    paperUrl: "https://arxiv.org/abs/1903.07291",
    date: "Submitted on 18 Mar 2019 (v1), last revised 5 Nov 2019 (this version, v2)",
  },
  {
    value: "san",
    label: "SAN",
    paper: "Second-order Attention Network for Single Image Super-Resolution",
    authors: "Tao Dai, Jianrui Cai, Yongbing Zhang, Shu-Tao Xia, Lei Zhang",
    paperUrl: "https://www4.comp.polyu.edu.hk/~cslzhang/paper/CVPR19-SAN.pdf",
    date: "CVPR 2019",
  },
  {
    value: "cyclegan",
    label: "CycleGAN",
    paper: "Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks",
    authors: "Jun-Yan Zhu, Taesung Park, Phillip Isola, Alexei A. Efros",
    paperUrl: "https://arxiv.org/abs/1703.10593",
    date: "Submitted on 30 Mar 2017 (v1), last revised 15 Nov 2018 (this version, v6)",
  },
  {
    value: "imle",
    label: "IMLE",
    paper: "Diverse Image Synthesis from Semantic Layouts via Conditional IMLE",
    authors: "Ke Li, Tianhao Zhang, Jitendra Malik",
    paperUrl: "https://arxiv.org/abs/1811.12373",
    date: "Submitted on 29 Nov 2018 (v1), last revised 29 Aug 2019 (this version, v2)",
  },
  {
    value: "seeingdark",
    label: "Seeing Dark (SIDT)",
    paper: "Learning to See in the Dark",
    authors: "Chen Chen, Qifeng Chen, Jia Xu, Vladlen Koltun",
    paperUrl: "https://arxiv.org/abs/1805.01934",
    date: "Submitted on 4 May 2018",
  },
  {
    value: "stylegan",
    label: "StyleGAN 1",
    paper: "A Style-Based Generator Architecture for Generative Adversarial Networks",
    authors: "Tero Karras, Samuli Laine, Timo Aila",
    paperUrl: "https://arxiv.org/abs/1812.04948",
    date: "Submitted on 12 Dec 2018 (v1), last revised 29 Mar 2019 (this version, v3)",
  },
  {
    value: "stylegan2",
    label: "StyleGAN 2",
    paper: "Analyzing and Improving the Image Quality of StyleGAN",
    authors: "Tero Karras, Samuli Laine, Miika Aittala, Janne Hellsten, Jaakko Lehtinen, Timo Aila",
    paperUrl: "https://arxiv.org/abs/1912.04958",
    date: "Submitted on 3 Dec 2019",
  },
]

function App() {
  const filesState = useAsync<{ files: string[] }>(async () => {
    const response = await fetch(dataDir + "/file_list.json")
    if (!response.ok) {
      throw new Error("Could not fetch image list")
    }
    const files = (await response.json()) as string[]

    return { files }
  })
  const [selectedModel, setSelectedModel] = useState<string>("all")
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
        <div className={css.header}>
          <Typography variant="h3" component="h1">
            IsThisADeepFake.js
          </Typography>
          <Typography variant="h4" component="h2">
            Deep fake detection in the browser
          </Typography>
        </div>
        <div className={css.try}>
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "1em" }}>
                      <InputLabel>Random Image Mode</InputLabel>
                      <ListSelect
                        value={randomModeOptions.find(r => r.value === selectedRandomMode)}
                        items={randomModeOptions}
                        onSelect={r => setSelectedRandomMode(r.value)}
                        getLabel={r => r.label}
                        getValue={r => r.value}
                      />
                      <FormHelperText>Select which kind of image you want from the random generator</FormHelperText>
                    </div>
                    <div>
                      <InputLabel>Deep Fake Model</InputLabel>
                      <ListSelect
                        value={modelOptions.find(mo => mo.value === selectedModel)}
                        items={modelOptions}
                        onSelect={mo => setSelectedModel(mo.value)}
                        getLabel={r => r.label}
                        getValue={r => r.value}
                      />
                      <FormHelperText>
                        Use this to only use a specific deep fake model on the random generator
                      </FormHelperText>
                    </div>
                  </div>
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
