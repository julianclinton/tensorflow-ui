import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

test('renders learn react link', () => {
  render(<BrowserRouter><App /></BrowserRouter>)
  const element = screen.getByText(/TensorFlow Play/i)
  expect(element).toBeInTheDocument()
})
