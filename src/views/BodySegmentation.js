import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/selfie_segmentation'
import * as bodySegmentation from '@tensorflow-models/body-segmentation'

const MASK_OPTIONS = [
  {
    label: 'Binary',
    value: 'binary'
  },
  {
    label: 'Coloured',
    value: 'coloured'
  }
]

const DRAW_OPTIONS = [
  {
    label: 'Mask',
    value: 'mask'
  },
  {
    label: 'Pixelated mask',
    value: 'pixelatedMask'
  },
  {
    label: 'Bokeh',
    value: 'bokeh'
  }
]

// const BODY_SEGMENTATION_CONFIG = {
//   runtime: 'mediapipe', // or 'tfjs'
//   solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
//   modelType: 'general'
// }

const BLAZE_POSE_CONFIG = {
  maxPoses: 1,
  type: 'full',
  visualization: 'binaryMask'
}

export const BodySegmentation = (props) => {
  // Hack to get around React.StrictMode double invoking useEffect twice
  const [retry, setRetry] = useState(false)
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    multiSegmentation: true,
    segmentBodyParts: true,
    maskMode: MASK_OPTIONS[0].value,
    drawMode: DRAW_OPTIONS[0].value,
    opacity: 0.7,
    blurAmount: 0,
    foregroundThreshold: 0.5,
    backgroundBlurAmount: 3,
    edgeBlurAmount: 3,
    pixelCellWidth: 10.0
  })

  const loadModel = async () => {
    try {
      // const segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      //   {
      //     ...BODY_SEGMENTATION_CONFIG
      //   })
      // const segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      //   { runtime: 'tfjs', modelType: 'general' }
      // )
      const segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.BodyPix)
      setModel(segmenter)
    } catch (err) {
      // This can be called in parallel when React.StrictMode is enabled so just catch and ignore
      console.log(`Error loading model: ${err.message}`)
      setRetry(true) // Trigger another attempt
    }
  }
  
  const getFeatureData = (modelApplyData, settings) => {
    return modelApplyData
  }

  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    const featureData = getFeatureData(modelApplyData, settings)
    if (featureData) {
      let coloredPartImage
      const flipHorizontal = false
      if (settings.maskMode === 'binary') {
        coloredPartImage = await bodySegmentation.toBinaryMask(featureData);
      } else if (settings.maskMode === 'coloured') {
        coloredPartImage = await bodySegmentation.toColoredMask(featureData, bodySegmentation.bodyPixMaskValueToRainbowColor, {r: 255, g: 255, b: 255, a: 255});
      }

      if (coloredPartImage) {
        if (settings.drawMode === 'pixelatedMask') {
          bodySegmentation.drawPixelatedMask(
            canvas, source, coloredPartImage, settings.opacity, settings.blurAmount,
            flipHorizontal, settings.pixelCellWidth)
          } else if (settings.drawMode === 'bokeh') {
          bodySegmentation.drawBokehEffect(
            canvas, source, featureData, settings.foregroundThreshold,
            settings.backgroundBlurAmount, settings.edgeBlurAmount,
            flipHorizontal)
        } else {
          bodySegmentation.drawMask(
            canvas, source, coloredPartImage, settings.opacity, settings.blurAmount,
            flipHorizontal)
        }
      }
    }
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData
    try {
      modelApplyData = await model.segmentPeople(video,
        { multiSegmentation: settings.multiSegmentation, segmentBodyParts: settings.segmentBodyParts })
    } catch (err) {
      console.log(`Error: ${err.message}`)
    }

    return modelApplyData
  }

  // Control panel handlers
  const onMaskChange = (event) => {
    setSettings({ ...settings, maskMode: event.target.value })
  }
  const onDrawChange = (event) => {
    setSettings({ ...settings, drawMode: event.target.value })
  }
  const onOpacityChange = (event) => {
    setSettings({ ...settings, opacity: event.target.value })
  }
  const onBlurAmountChange = (event) => {
    setSettings({ ...settings, blurAmount: event.target.value })
  }
  const onPixelSizeChange = (event) => {
    setSettings({ ...settings, pixelCellWidth: event.target.value })
  }
  const onForegroundThresholdAmountChange = (event) => {
    setSettings({ ...settings, foregroundThreshold: event.target.value })
  }
  const onBackgroundBlurAmountChange = (event) => {
    setSettings({ ...settings, backgroundBlurAmount: event.target.value })
  }
  const onEdgeBlurAmountChange = (event) => {
    setSettings({ ...settings, edgeBlurAmount: event.target.value })
  }

  useEffect(() => {
    loadModel()
  }, [retry])

  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Mask options</Form.Label>
        <Form.Control value={settings.maskMode} as='select' onChange={onMaskChange}>
          {MASK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Form.Control>
      </Col>
      <Col>
        <Form.Label>Draw options</Form.Label>
        <Form.Control value={settings.drawMode} as='select' onChange={onDrawChange}>
          {DRAW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Form.Control>
      </Col>
    </Row>
    <Row>
      <Col>
        <Form.Label>Opacity</Form.Label>
        <RangeSlider
          value={settings.opacity}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={onOpacityChange}
        />   
      </Col>
      <Col>
        <Form.Label>Blur (Mask options)</Form.Label>
        <RangeSlider
          value={settings.blurAmount}
          min={0}
          max={20}
          step={1}
          onChange={onBlurAmountChange}
        />   
      </Col>
      <Col>
        <Form.Label>Pixel size (Pixelated)</Form.Label>
        <RangeSlider
          value={settings.pixelCellWidth}
          min={1.0}
          max={20.0}
          step={1}
          onChange={onPixelSizeChange}
        />   
      </Col>
    </Row>
    <Row>
      <Col>
        <Form.Label>Threshold (Bokeh)</Form.Label>
        <RangeSlider
          value={settings.foregroundThreshold}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={onForegroundThresholdAmountChange}
        />   
      </Col>
      <Col>
        <Form.Label>Background blur (Bokeh)</Form.Label>
        <RangeSlider
          value={settings.backgroundBlurAmount}
          min={1}
          max={20}
          step={1}
          onChange={onBackgroundBlurAmountChange}
        />   
      </Col>
      <Col>
        <Form.Label>Edge blur (Bokeh)</Form.Label>
        <RangeSlider
          value={settings.edgeBlurAmount}
          min={0}
          max={20}
          step={1}
          onChange={onEdgeBlurAmountChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Body Segmentation</h2>
      { (model &&
        <VideoPanel
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={250}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default BodySegmentation
