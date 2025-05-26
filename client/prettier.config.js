//  @ts-check

/** @type {import('prettier').Config} */
const config = {
   singleQuote: true,
   trailingComma: 'all',
   tabWidth: 3,
   printWidth: 130,
   semi: false,
   plugins: ['prettier-plugin-organize-imports'],
}

export default config
