export const centerCropSize = 224
export const dataDir = process.env.REACT_APP_DATA_DIRECTORY || "/data_dev"

// create a session
export const myOnnxSession = new onnx.InferenceSession()
