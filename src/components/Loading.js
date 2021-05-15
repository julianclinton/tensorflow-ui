import React from 'react'
import PropTypes from 'prop-types'
import Spinner from 'react-bootstrap/Spinner'
import './Loading.css'

export const Loading = (props) => (
  <span className='spinner' >
    <Spinner className='spinner-icon' animation='border' variant='primary'/>
    {props.message || 'Loading...'}
  </span>
)

Loading.propTypes = {
  message: PropTypes.string
}

export default Loading
