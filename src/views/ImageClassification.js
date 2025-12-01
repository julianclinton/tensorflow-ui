import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
import { padChartSeries, createDefaultSeries } from '../util/charts'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as mobilenet from '@tensorflow-models/mobilenet'

const Y_AXIS_WIDTH = 240

const DISPLAY_OPTIONS = { 
  ...BAR_CHART_DEFAULTS,
  plotOptions: {
    bar: {
      horizontal: true
    }
  },
  yaxis: {
    min: 0.0,
    max: 1.0,
    decimalsInFloat: 1,
    labels: {
      minWidth: Y_AXIS_WIDTH,
      maxWidth: Y_AXIS_WIDTH
    }
  }
}

const version = 2
const alpha = 0.75

export const ImageClassification = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    classThreshold: 0.1,
    topN: 3,
  })
  const [chartData, setChartData] = useState(createDefaultSeries(3))

  const loadModel = async () => {
    setModel(await mobilenet.load({version, alpha}))
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    const data = []
    if (modelApplyData) {
      modelApplyData.forEach((entry) => {
        if (entry.probability > settings.classThreshold) {
          data.push({
            x: entry.className,
            y: entry.probability
          })
        }
      })
    }
    padChartSeries(data, settings.topN)

    setChartData([
      {
        name: "probability",
        data: data
      }
    ])
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData = await model.classify(video, settings.topN)
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel()
  }, [])

  const onClassThresholdChange = (event) => {
    setSettings({ ...settings, classThreshold: event.target.value })
  }
  
  const onTopNChange = (event) => {
    setSettings({ ...settings, topN: event.target.value })
  }
  
  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Class threshold</Form.Label>
        <RangeSlider
          value={settings.classThreshold}
          min={0.0}
          max={1.0}
          step={0.02}
          onChange={onClassThresholdChange}
        />   
      </Col>
      <Col>
        <Form.Label>Top N</Form.Label>
        <RangeSlider
          value={settings.topN}
          min={1}
          max={20}
          step={1}
          onChange={onTopNChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Image Classification</h2>
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

export default ImageClassification
