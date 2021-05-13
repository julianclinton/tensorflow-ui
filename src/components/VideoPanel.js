import React, { Fragment, useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Chart from 'react-apexcharts'
import '@tensorflow/tfjs-backend-webgl'
const bodyPix = require('@tensorflow-models/body-pix')

const BODY_PARTS = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle"
]

const DISPLAY_OPTIONS = {
  chart: {
    id: "basic-bar"
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

export const BodySegmentation = (props) => {
  const [scanning, setScanning] = useState(false)
  const [model, setModel] = useState(null)
  const [predictor, setPredictor] = useState(null)
  const [chartData, setChartData] = useState([])
  const [videoAvailable, setVideoAvailable] = useState(false)
  const videoRef = useRef()

  const loadModel = async () => {
    setModel(await bodyPix.load(/** optional arguments, see below **/))
  }
  
  const displayConfidences = (allPoses) => {
    // For now assume a consistent order which is the same as BODY_PARTS
    const data = allPoses[0].keypoints.map((entry) => entry.score)
    console.log(data)
    setChartData([
      {
        name: "confidences",
        data: data
      }
    ])
  }

  const predict = async () => {
    /**
     * One of (see documentation below):
     *   - net.segmentPerson
     *   - net.segmentPersonParts
     *   - net.segmentMultiPerson
     *   - net.segmentMultiPersonParts
     * See documentation below for details on each method.
     */
    if (model && scanning && videoRef.current && videoAvailable) {
      try {
        const segmentation = await model.segmentPerson(videoRef.current)
        // console.log(segmentation)
        if (segmentation && segmentation.allPoses) {
          displayConfidences(segmentation.allPoses)
        }
      } catch (err) {
        console.log("Segmentation went wrong!", err)
      }
    }
  }
  
  const setCapture = async (scanning) => {
    if (videoRef.current && !videoRef.current.onloadeddata) {
      videoRef.current.onloadeddata = (event) => {
        console.log('setVideoAvailable=true')
        setVideoAvailable(true)
      }
      videoRef.current.onended = (event) => {
        console.log('setVideoAvailable=false')
        setVideoAvailable(false)
      }
      videoRef.current.onerror = (event) => {
        console.log('setVideoAvailable=false')
        setVideoAvailable(false)
      }
    }

    if (scanning) {
      if (videoRef.current && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            videoRef.current.srcObject = stream
          })
          .catch((err) => {
            console.log("Something went wrong!", err)
          })
      }
    } else {
      // Switch off
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop()
        })
        videoRef.current.srcObject = null        
      }
    }
  }
  
  useEffect(() => {
    loadModel()
  }, [])

  useEffect(() => {
    setCapture(scanning)
  }, [scanning])

  useEffect(() => {
    if (videoAvailable && !predictor) {
      setPredictor(setInterval(predict, 500))
    } else if (predictor) {
      clearInterval(predictor)
      setPredictor(null)
    }
  }, [videoAvailable])

  return (
    <Fragment>
      <h1>Body Segmentation</h1>
      <Container fluid>
        <Row>
          <Col>
            <ToggleButton
                enabled={model}
                type="checkbox"
                variant="secondary"
                checked={scanning}
                value="1"
                onChange={(e) => setScanning(e.currentTarget.checked)}
              > Scan</ToggleButton>
          </Col>
        </Row>
        <Row>
          <Col>
            <video ref={videoRef} autoPlay={true} width={640} height={480}/>
          </Col>
          <Col>
            <Chart options={DISPLAY_OPTIONS} series={chartData} type="bar" height={480} />
          </Col>
        </Row>
      </Container>      
    </Fragment>
  )
}

BodySegmentation.propTypes = {
  title: PropTypes.string.isRequired,
  loadModel: PropTypes.func.isRequired,
  applyModel: PropTypes.func.isRequired,
  getApplyPanel: PropTypes.func.isRequired
}

export default BodySegmentation
