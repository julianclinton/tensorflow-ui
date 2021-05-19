import React, { Fragment, useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
import { OBJECT_BOX_COLOR } from '../util/drawing'
require('@tensorflow/tfjs-backend-cpu')
require('@tensorflow/tfjs-backend-webgl')
const cocoSsd = require('@tensorflow-models/coco-ssd')

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
      // Why scale of 0.5? Presumably default resolution is 640x480 which is double
      // the size of our canvas.
      drawBoundingBoxes(modelApplyData, 0.5, ctx)
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

  const applySegmentationModel = async (video, settings) => {
    let modelApplyData = await model.detect(video)
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h2>Object Detection</h2>
      { (model &&
        <VideoPanel
          applyRateMS={250}
          applyModel={(source) => applySegmentationModel(source, null)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, null)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default ObjectSegmentation
