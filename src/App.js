import React from 'react'
import { Routes, Route } from 'react-router'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Home from './views/Home'
import NotFoundPage from './views/NotFoundPage'
import { TASK_LINKS } from './util/links'

const App = () => {
  return (
    <Container fluid>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="/">TensorFlow Play</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <NavDropdown title="Tasks" id="basic-nav-dropdown">
              { TASK_LINKS.map((entry, i) => <NavDropdown.Item key={`task-menu-${i}`} href={entry.ref}>{entry.label}</NavDropdown.Item>) }
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>      
      <Routes>
        <Route path="/" element={<Home />} />
        { TASK_LINKS.map((entry, i) => <Route key={`task-${i}`} path={entry.ref} title={entry.label} element={React.createElement(entry.component)} />) }
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Container>
  )
}

export default App
