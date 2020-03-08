import React, { PureComponent, RefObject } from "react"
import Jimp from "jimp"

export interface ImgCanvasProps {
  img: Jimp
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
      console.error("Canvas ref not defined")
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("Could not fet canvas 2d context")
      return
    }
    const w = this.props.img.getWidth()
    const h = this.props.img.getHeight()
    canvas.width = w
    canvas.height = h

    ctx.putImageData(new ImageData(new Uint8ClampedArray(this.props.img.bitmap.data), w, h), 0, 0)
  }

  public render() {
    return <canvas ref={this.canvasRef} />
  }
}
