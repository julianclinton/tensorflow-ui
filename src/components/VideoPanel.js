import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ToggleButton from 'react-bootstrap/ToggleButton'

export const VideoPanel = (props) => {
  const [scanning, setScanning] = useState(false)
  const [videoAvailable, setVideoAvailable] = useState(false)
  const scanTimer = useRef()
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
    const video = videoRef.current
    if (video) {
      if (!video.onloadeddata) {
        video.onloadeddata = (event) => {
          console.log('setVideoAvailable=true')
          setVideoAvailable(true)
        }
        video.onended = (event) => {
          console.log('setVideoAvailable=false')
          setVideoAvailable(false)
        }
        video.onerror = (event) => {
          console.log('setVideoAvailable=false')
          setVideoAvailable(false)
        }

        if (navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              video.srcObject = stream
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
    const video = videoRef.current
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => {
        track.stop()
      })
      video.srcObject = null        
    }
    setVideoAvailable(false)
  }

  useEffect(() => {
    enableVideo()
    return () => disableVideo()
  }, [])

  useEffect(() => {
    updateScanTimer(scanning)
  }, [scanning, props.settings])

  const updateScanTimer = (scan) => {
    if (scanTimer.current) {
      clearInterval(scanTimer.current)
      scanTimer.current = null
    }
    if (scan) {
      scanTimer.current = setInterval(performScan, props.applyRateMS || 500)
    }
  }

  return (
    <Container fluid>
      <Row>
        <Col xs={4}>
          <ToggleButton
              type="checkbox"
              variant="secondary"
              checked={scanning}
              onChange={(e) => setScanning(e.currentTarget.checked)}
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
  settings: PropTypes.object, // required if controlPanel supplied
  applyRateMS: PropTypes.number,
  applyModel: PropTypes.func.isRequired
}

VideoPanel.constants = {
  defaultWidth: 320,
  defaultHeight: 240,
  defaultStyle: { border: '1px solid #000000' }
}

export default VideoPanel
