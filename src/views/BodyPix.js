import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BODY_PARTS, BAR_CHART_DEFAULTS } from '../util/constants'
import { drawBoundingBox, drawSkeleton } from '../util/drawing'
import { createDefaultCategorySeries } from '../util/charts'
import '@tensorflow/tfjs-backend-webgl'
const bodyPix = require('@tensorflow-models/body-pix')

const DISPLAY_OPTIONS = {
  ...BAR_CHART_DEFAULTS,
  xaxis: {
    categories: BODY_PARTS
  }
}

export const BodySegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    segmentationMode: 'segmentPersonParts',
    bodyThreshold: 0.3
  })
  const [chartData, setChartData] = useState(createDefaultCategorySeries(BODY_PARTS))

  const loadModel = async () => {
    setModel(await bodyPix.load(/** optional arguments, see docs **/))
  }
  
  const getFeatureData = (modelApplyData, settings) => {
    let featureData
    switch (settings.segmentationMode) {
      case 'segmentPerson':
      case 'segmentPersonParts':
        featureData = modelApplyData.allPoses; break
      case 'segmentMultiPerson':
      case 'segmentMultiPersonParts':
        featureData = modelApplyData.map(entry => entry.pose); break
      default:
        featureData = null
    }
    return featureData
  }

  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    const featureData = getFeatureData(modelApplyData, settings)
    if (featureData) {
      featureData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          drawBoundingBox(body.keypoints, ctx)
          drawSkeleton(body.keypoints, 0.1, ctx, 1)
        }
      })
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    const featureData = getFeatureData(modelApplyData, settings)

    let data = []
    if (featureData) {
      featureData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          const bodyData = body.keypoints.map((entry) => {
              return {
              x: entry.part,
              y: entry.score
            }
          })

          data.push({
            name: `body-${bodyIndex + 1}`,
            data: bodyData
          })
        }
      })
    } else {
      data = createDefaultCategorySeries(BODY_PARTS)
    }

    setChartData(data)
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    /**
     * One of:
     *   - net.segmentPerson
     *   - net.segmentPersonParts
     *   - net.segmentMultiPerson
     *   - net.segmentMultiPersonParts
     * See documentation for details on each method.
     */
    let fn
    switch (settings.segmentationMode) {
      case 'segmentPerson':
        fn = model.segmentPerson; break
      case 'segmentPersonParts':
        fn = model.segmentPersonParts; break
      case 'segmentMultiPerson':
        fn = model.segmentMultiPerson; break
      case 'segmentMultiPersonParts':
        fn = model.segmentMultiPersonParts; break
      default:
        fn = null
    }

    let modelApplyData
    if (fn) {
      modelApplyData = await fn.call(model, video)
      updateApplyPanel(modelApplyData, settings)
    }
    return modelApplyData
  }

  const onSegmentationChange = (event) => {
    setSettings({ ...settings, segmentationMode: event.target.value })
  }

  const onBodyThresholdChange = (event) => {
    setSettings({ ...settings, bodyThreshold: event.target.value })
  }
  
  useEffect(() => {
    loadModel()
  }, [])

  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Segmentation</Form.Label>
        <Form.Control value={settings.segmentationMode} as='select' onChange={onSegmentationChange}>
          <option value='segmentPerson'>Person</option>
          <option value='segmentPersonParts'>Person parts</option>
          <option value='segmentMultiPerson'>Multi-person</option>
          <option value='segmentMultiPersonParts'>Multi-person parts</option>
        </Form.Control>
      </Col>
      <Col>
        <Form.Label>Body threshold</Form.Label>
        <RangeSlider
          value={settings.bodyThreshold}
          min={0.0}
          max={1.0}
          step={0.02}
          onChange={onBodyThresholdChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Body Pix (Legacy)</h2>
      { (model &&
        <VideoPanel
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={250}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default BodySegmentation
