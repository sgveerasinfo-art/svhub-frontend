import { useParams } from 'react-router-dom'
import ProductWorkspace from './ProductWorkspace.jsx'

export default function ProductEdit() {
  const { id } = useParams()
  return <ProductWorkspace mode="edit" productId={id} />
}
