import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ToggleButton from 'react-bootstrap/ToggleButton'

export const VideoPanel = (props) => {
  const [scanning, setScanning] = useState(false)
  const [predictor, setPredictor] = useState(null)
  const [videoAvailable, setVideoAvailable] = useState(false)
  const videoRef = useRef()

  const predict = async () => {
    console.log('predict')
    if (scanning && videoRef.current && videoAvailable) {
      try {
        await props.applyModel(videoRef.current)
      } catch (err) {
        console.log("Segmentation went wrong!", err)
      }
    }
  }
  
  const setCapture = async (scanning) => {
    console.log('setCapture: scanning=' + scanning)
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
      setVideoAvailable(false)
    }
  }
  
  useEffect(() => {
    setCapture(scanning)
  }, [scanning])

  useEffect(() => {
    if (videoAvailable && !predictor) {
      setPredictor(setInterval(predict, props.applyRateMS || 500))
    } else if (predictor) {
      clearInterval(predictor)
      setPredictor(null)
    }
  }, [videoAvailable])

  return (
    <Container fluid>
      <Row>
        <Col>
          <ToggleButton
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
          {props.applyPanel}
        </Col>
      </Row>
    </Container>      
  )
}

VideoPanel.propTypes = {
  applyRateMS: PropTypes.number,
  applyModel: PropTypes.func.isRequired,
  applyPanel: PropTypes.object.isRequired
}

export default VideoPanel
