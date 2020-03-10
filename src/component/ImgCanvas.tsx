import React, { PureComponent, RefObject } from "react"
import Jimp from "jimp"

export interface ImgCanvasProps {
  img: Jimp
  maxWH: number
}

export class ImgCanvas extends PureComponent<ImgCanvasProps> {
  private canvasRef: RefObject<HTMLCanvasElement>

  constructor(props: ImgCanvasProps) {
    super(props)
    this.canvasRef = React.createRef()
  }

  public componentDidUpdate() {
    this.applyProps()
  }
  public componentDidMount() {
    this.applyProps()
  }

  protected applyProps() {
    const canvas = this.canvasRef.current
    if (!canvas) {
      throw new Error("Canvas ref not defined")
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not fet canvas 2d context")
    }
    const ow = this.props.img.getWidth()
    const oh = this.props.img.getHeight()

    // scale the image to fit max WH
    const scaleFactor = Math.max(ow / this.props.maxWH, oh / this.props.maxWH)
    const sw = Math.floor(ow / scaleFactor)
    const sh = Math.floor(oh / scaleFactor)
    const image = this.props.img.resize(sw, sh)

    canvas.width = sw
    canvas.height = sh

    ctx.putImageData(new ImageData(new Uint8ClampedArray(image.bitmap.data), sw, sh), 0, 0)
  }

  public render() {
    return <canvas ref={this.canvasRef} />
  }
}
