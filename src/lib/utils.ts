import Jimp from "jimp"
import { centerCropSize, myOnnxSession, dataDir } from "./options"
import { Tensor } from "onnxjs"
import { ImageModel } from "../component/OptionsPanel"

export async function isThisADeepFake(img: Jimp): Promise<number> {
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

// const dataDir = "/data"
export function isFake(fileName: string) {
  return fileName.indexOf("1_fake") !== -1
}
export function isReal(fileName: string) {
  return fileName.indexOf("0_real") !== -1
}
export function getModelFromFilename(fileName: string): ImageModel {
  const parts = fileName.split("/")
  // @todo: check that it's indeed an ImageModel
  return (parts.length > 0 ? parts[0] : "") as ImageModel
}

export async function fetchImgData(fileName: string): Promise<{ img: Jimp; fileName: string }> {
  const img = await Jimp.read(dataDir + "/CNN_synth_testset/" + fileName)
  return { img, fileName }
}

export async function downloadAndWarmupOnnxModel() {
  await myOnnxSession.loadModel(dataDir + "/model/cnndetection.onnx")
  // trigger dummy analysis to load the model in memory
  const fakeData = new Float32Array(centerCropSize * centerCropSize * 3)
  const inputs = [new Tensor(fakeData, "float32", [1, 3, centerCropSize, centerCropSize])]
  await myOnnxSession.run(inputs)
}
