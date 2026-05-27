import { listProducts } from '~~/server/utils/products'

export default defineEventHandler(() => listProducts())
