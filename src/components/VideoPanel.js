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
  const canvasRef = useRef()

  const performScan = async () => {
    if (videoRef.current && videoAvailable) {
      try {
        await props.applyModel(videoRef.current)
      } catch (err) {
        console.log("Segmentation went wrong!", err)
      }
      if (canvasRef.current) {

      }
    }
  }
  
  const enableVideo = () => {
    console.log('enableVideo')
    if (videoRef.current) {
      if (!videoRef.current.onloadeddata) {
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

        if (navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              videoRef.current.srcObject = stream
            })
            .catch((err) => {
              console.log("Something went wrong!", err)
            })
        }
      }
    }
  }

  const disableVideo = () => {
    console.log('disableVideo')
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => {
        track.stop()
      })
      videoRef.current.srcObject = null        
    }
    setVideoAvailable(false)
  }

  useEffect(() => {
    enableVideo()
    return () => disableVideo()
  }, [])

  const onScanningChange = (event) => {
    const scanning = event.currentTarget.checked
    if (scanning && !predictor) {
      setPredictor(setInterval(performScan, props.applyRateMS || 500))
    } else if (predictor) {
      clearInterval(predictor)
      setPredictor(null)
    }
    setScanning(scanning)
  }

  return (
    <Container fluid>
      <Row>
        <Col xs={4}>
          <ToggleButton
              type="checkbox"
              variant="secondary"
              checked={scanning}
              onChange={onScanningChange}
            > Scan</ToggleButton>
        </Col>
        <Col xs={8}>
          {props.controlPanel}
        </Col>
      </Row>
      <Row>
        <Col xs={4}>
          <div>
            <video ref={videoRef} autoPlay={true} playsInline
              width={VideoPanel.constants.defaultWidth}
              height={VideoPanel.constants.defaultHeight}
              style={VideoPanel.constants.defaultStyle}
            />
            <canvas ref={canvasRef}
              width={VideoPanel.constants.defaultWidth}
              height={VideoPanel.constants.defaultHeight}
              style={VideoPanel.constants.defaultStyle}>
            </canvas> 
          </div>
        </Col>
        <Col xs={8}>
          {props.children}
        </Col>
      </Row>
    </Container>      
  )
}

VideoPanel.propTypes = {
  controlPanel: PropTypes.object,
  applyRateMS: PropTypes.number,
  applyModel: PropTypes.func.isRequired
}

VideoPanel.constants = {
  defaultWidth: 320,
  defaultHeight: 240,
  defaultStyle: { border: '1px solid #000000' }
}

export default VideoPanel
