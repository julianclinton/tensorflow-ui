import React, { Fragment } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { TASK_LINKS } from '../util/constants'

export const Home = (props) => {

  return (
    <Fragment>
      <h1>Home</h1>
      <ListGroup>
        { TASK_LINKS.map(entry => <ListGroup.Item action href={entry.ref}>{entry.label}</ListGroup.Item>) }
      </ListGroup>
    </Fragment>
  )
}

export default Home
