import { Switch, Route } from "react-router-dom";
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Home from './views/Home';
import NotFoundPage from './views/NotFoundPage';
import BodySegmentation from './views/BodySegmentation';
import ObjectDetection from './views/ObjectDetection';

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
              <NavDropdown.Item href="/bodysegmentation">Body segmentation</NavDropdown.Item>
              <NavDropdown.Item href="/modeldetection">Object detection</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>      
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/bodysegmentation" title="Body Segmentation" component={BodySegmentation} />
        <Route path="/modeldetection" title="Object Detection" component={ObjectDetection} />
        <Route path="*" component={NotFoundPage} />
      </Switch>
    </Container>
  );
}

export default App;
