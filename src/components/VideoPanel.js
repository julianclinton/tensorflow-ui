import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ToggleButton from 'react-bootstrap/ToggleButton'

const VIDEO_WIDTH = 320
const VIDEO_HEIGHT = 240
const PANEL_STYLE = { border: '1px solid #000000' }

export const VideoPanel = (props) => {
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
        const modelData = await props.applyModel(video)
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
        <Col xs={3}>
          {message}
        </Col>
        <Col xs={8}>
          {props.controlPanel}
        </Col>
      </Row>
      <Row>
        <Col xs={4}>
          <div>
            <video ref={videoRef} autoPlay={true} playsInline
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              style={PANEL_STYLE}
            />
            <canvas ref={canvasRef}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              style={PANEL_STYLE}>
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
  applyModel: PropTypes.func.isRequired,
  updateCanvas: PropTypes.func
}

export default VideoPanel
