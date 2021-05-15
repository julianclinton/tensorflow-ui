import { Switch, Route } from 'react-router-dom'
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
      <Switch>
        <Route exact path="/" component={Home} />
        { TASK_LINKS.map((entry, i) => <Route key={`task-${i}`} path={entry.ref} title={entry.label} component={entry.component}/>) }
        <Route path="*" component={NotFoundPage} />
      </Switch>
    </Container>
  )
}

export default App
