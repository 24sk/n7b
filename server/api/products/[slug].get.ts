import { getProductBySlug } from '~~/server/utils/products'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug)
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  const product = await getProductBySlug(slug)
  if (!product)
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return product
})
