import React, { Fragment, useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
import { OBJECT_BOX_COLOR } from '../util/drawing'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

const DISPLAY_OPTIONS = { ...BAR_CHART_DEFAULTS }

const drawBoundingBoxes = (result, scale, ctx) => {
  for (let i = 0; i < result.length; i++) {
    const bbox = result[i].bbox.map(value => scale * value)
    ctx.beginPath()
    ctx.rect(...bbox)
    ctx.lineWidth = 1
    ctx.strokeStyle = OBJECT_BOX_COLOR
    ctx.fillStyle = OBJECT_BOX_COLOR
    ctx.stroke()
    ctx.fillText(
      result[i].score.toFixed(3) + ' ' + result[i].class, bbox[0],
      bbox[1] > 10 ? bbox[1] - 5 : 10)
  }
}

export const ObjectSegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [chartData, setChartData] = useState([])

  const loadModel = async () => {
    setModel(await cocoSsd.load())
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      // Presumably default resolution is 640x480 so factor relative to
      // the size of our canvas.
      const scale = canvas.width / 640.0
      drawBoundingBoxes(modelApplyData, scale, ctx)
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    if (modelApplyData) {
      const data = modelApplyData.map((entry) => {
        return {
          x: entry.class,
          y: entry.score
        }
      })
      setChartData([
        {
          name: "confidences",
          data: data
        }
      ])
    }
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData = await model.detect(video)
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel()
  }, [])

  console.log('chartData', chartData)
  return (
    <Fragment>
      <h2>Object Detection</h2>
      { (model &&
        <VideoPanel
          applyRateMS={250}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, null)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, null)}
        >
          {/* For some reason this particular bar chart doesn't handle empty data very well, possibly because of no xaxis data initially */}
          {chartData.length > 0 ? <Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/> : <div height='100%' width='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default ObjectSegmentation
