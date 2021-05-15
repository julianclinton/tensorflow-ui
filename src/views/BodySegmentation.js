import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BODY_PARTS } from '../util/constants'
import '@tensorflow/tfjs-backend-webgl'
const bodyPix = require('@tensorflow-models/body-pix')

const DISPLAY_OPTIONS = {
  chart: {
    id: 'basic-bar'
  },
  plotOptions: {
    bar: {
      horizontal: true
    }
  },
  xaxis: {
    categories: BODY_PARTS
  },
  yaxis: {
    min: 0.0,
    max: 1.0
  }
}

const createDefaultSeries = () => {
  return [{
    name: '-',
    data: BODY_PARTS.map(entry => {
      return {
        x: entry,
        y: 0.0
      }
    })
  }]
}

export const BodySegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    segmentationMode: 'segmentPersonParts',
    bodyThreshold: 0.3
  })
  const [segmentationData, setSegmentationData] = useState(createDefaultSeries())

  const loadModel = async () => {
    setModel(await bodyPix.load(/** optional arguments, see docs **/))
  }
  
  const updateApplyPanel = async (modelApplyData, settings) => {
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

    let data = []
    if (featureData) {
      featureData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
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
      data = createDefaultSeries()
    }

    setSegmentationData(data)
  }

  const applySegmentationModel = async (video, settings) => {
    console.log('applySegmentationModel')
    console.log(settings)
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

    if (fn) {
      const modelApplyData = await fn.call(model, video)
      if (modelApplyData) {
        updateApplyPanel(modelApplyData, settings)
      }
    }
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
    <Form.Group>
      <Form.Label>Segmentation</Form.Label>
      <Form.Control value={settings.segmentationMode} as='select' onChange={onSegmentationChange}>
        <option value='segmentPerson'>Person</option>
        <option value='segmentPersonParts'>Person parts</option>
        <option value='segmentMultiPerson'>Multi-person</option>
        <option value='segmentMultiPersonParts'>Multi-person parts</option>
      </Form.Control>
    </Form.Group>
    <Form.Group>
      <Form.Label>
        Body threshold
      </Form.Label>
      <RangeSlider
        value={settings.bodyThreshold}
        min={0.0}
        max={1.0}
        step={0.02}
        tooltip='on'
        onChange={onBodyThresholdChange}
      />   
    </Form.Group>
  </Form>

  console.log('Primary')
  console.log(settings)
  return (
    <Fragment>
      <h2>Body Segmentation</h2>
      { (model &&
        <VideoPanel
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={500}
          applyModel={(source) => applySegmentationModel(source, settings)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={segmentationData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default BodySegmentation
