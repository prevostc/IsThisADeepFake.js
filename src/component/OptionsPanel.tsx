import React, { useState } from "react"
import ListSelect from "../component/ListSelect"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import { FormHelperText, withStyles } from "@material-ui/core"
import { Typography } from "@material-ui/core"
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel"
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import MuiInputLabel from "@material-ui/core/InputLabel"

export type RandomModes = "all" | "fake-only" | "real-only"
export type ImageModel =
  | "biggan"
  | "deepfake"
  | "progan"
  | "stargan"
  | "whichfaceisreal"
  | "crn"
  | "gaugan"
  | "san"
  | "cyclegan"
  | "imle"
  | "seeingdark"
  | "stylegan"
  | "stylegan2"

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
      value: ImageModel
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

const ExpansionPanel = withStyles({
  root: {
    borderRadius: "7px",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiExpansionPanel)

const ExpansionPanelDetails = withStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    paddingTop: 0,
  },
}))(MuiExpansionPanelDetails)

const ExpansionPanelSummary = withStyles({
  root: {
    backgroundColor: "#282c34",
    color: "white",
    marginBottom: -1,
    borderRadius: "4px",
    minHeight: 56,
    "&$expanded": {
      minHeight: 56,
      backgroundColor: "white",
      color: "inherit",
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
  expandIcon: {
    color: "inherit",
  },
})(MuiExpansionPanelSummary)

const InputLabel = withStyles({
  root: {
    marginBottom: "0.5em",
  },
})(MuiInputLabel)

export function OptionsPanel({
  selectedRandomMode,
  setSelectedRandomMode,
  selectedModel,
  setSelectedModel,
}: {
  selectedRandomMode: RandomModes
  setSelectedRandomMode: (mode: RandomModes) => void
  selectedModel: ImageModel | "all"
  setSelectedModel: (model: ImageModel | "all") => void
}) {
  const [optionsOpen, setOptionsOpen] = useState(false)
  return (
    <ExpansionPanel expanded={optionsOpen} onChange={() => setOptionsOpen(!optionsOpen)}>
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
            <FormHelperText>Use this to only use a specific deep fake model on the random generator</FormHelperText>
          </div>
        </div>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
