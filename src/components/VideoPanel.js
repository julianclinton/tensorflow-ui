import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ToggleButton from 'react-bootstrap/ToggleButton'

export const VIDEO_WIDTH = 320
export const VIDEO_HEIGHT = 240
export const PANEL_STYLE = { border: '1px solid #000000' }

const VideoPanel = (props) => {
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState(null)
  const [videoAvailable, setVideoAvailable] = useState(false)
  const scanTimer = useRef()
  const videoRef = useRef()
  const canvasRef = useRef()

  const performScan = async () => {
    if (videoRef.current && videoAvailable) {
      const video = videoRef.current
      const canvas = canvasRef.current
      try {
        const modelData = await props.applyModel(video, canvas)
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0, video.width, video.height)
          if (modelData && props.updateCanvas) {
            props.updateCanvas(video, canvas, ctx, modelData)
          }
        }
      } catch (err) {
        console.log('Segmentation went wrong!', err)
        setMessage('Segmentation went wrong: ' + err.message)
      }
    }
  }
  
  const enableVideo = () => {
    console.log('enableVideo')
    const video = videoRef.current
    if (video) {
      if (!video.onloadeddata) {
        video.onloadeddata = (event) => {
          console.log('onloadeddata: setVideoAvailable=true')
          setVideoAvailable(true)
          setMessage(null)
        }
        video.onended = (event) => {
          console.log('onended: setVideoAvailable=false')
          setVideoAvailable(false)
          setMessage(null)
        }
        video.onerror = (event) => {
          console.log('onerror: setVideoAvailable=false')
          console.log(event)
          setVideoAvailable(false)
          setMessage('Video went wrong: ' + event)
        }

        if (navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              video.srcObject = stream
            })
            .catch((err) => {
              console.log('Something went wrong!', err)
              console.log(err)
              setMessage(err.message)
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

  // If no children are in the right-hand panel then put the canvas there
  // and make both the video and canvas larger
  const hasRightPanel = props.children
  const columnsFactor = (props.sourceSize === 'large' || !hasRightPanel) ? 1 : 0
  const videoFactor = hasRightPanel ? columnsFactor : 2

  const video = <video key='vid' ref={videoRef} autoPlay={true} playsInline
      width={VIDEO_WIDTH + (VIDEO_WIDTH/2 * videoFactor)}
      height={VIDEO_HEIGHT + (VIDEO_HEIGHT/2 * videoFactor)}
      style={PANEL_STYLE}
    />

  const canvas = <canvas key='canvas' ref={canvasRef}
      width={VIDEO_WIDTH + (VIDEO_WIDTH/2 * videoFactor)}
      height={VIDEO_HEIGHT + (VIDEO_HEIGHT/2 * videoFactor)}
      style={PANEL_STYLE}>
    </canvas> 

  const leftItems = hasRightPanel ? [video, canvas] : [video]
  const rightItems = hasRightPanel ? props.children : canvas
  const leftPanelWidth = 4 + (2 * columnsFactor)
  const rightPanelWidth = 8 - (2 * columnsFactor)

  return (
    <Container fluid>
      <Row>
        <Col xs={1}>
          <ToggleButton
              type='checkbox'
              variant='secondary'
              checked={scanning}
              onChange={(e) => setScanning(e.currentTarget.checked)}
            > Scan</ToggleButton>
        </Col>
        <Col xs={leftPanelWidth - 1}>
          {message}
        </Col>
        <Col key={3} xs={rightPanelWidth}>
          {props.controlPanel}
        </Col>
      </Row>
      <Row>
        <Col key={1} xs={leftPanelWidth}>
          {leftItems}
        </Col>
        <Col key={2} xs={rightPanelWidth} style={{ height: 2 * VIDEO_HEIGHT }}>
          {rightItems}
        </Col>
      </Row>
    </Container>      
  )
}

VideoPanel.propTypes = {
  controlPanel: PropTypes.object,
  settings: PropTypes.object, // required if controlPanel supplied
  sourceSize: PropTypes.string,
  applyRateMS: PropTypes.number,
  applyModel: PropTypes.func.isRequired,
  updateCanvas: PropTypes.func
}

export default VideoPanel
