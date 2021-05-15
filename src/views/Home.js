import React, { Fragment } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { TASK_LINKS } from '../util/links'

export const Home = (props) => {

  return (
    <Fragment>
      <h2>Home</h2>
      <Container fluid>
        <Row>
          <Col xs={3}>
            <ListGroup>
              { TASK_LINKS.map((entry, i) => <ListGroup.Item key={`home-task-${i}`} action href={entry.ref}>{entry.label}</ListGroup.Item>) }
            </ListGroup>
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

export default Home
