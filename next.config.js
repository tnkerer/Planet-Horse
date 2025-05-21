/** @type {import('next').NextConfig} */

module.exports = {
  exportPathMap: () => {
    return {
      '/': { page: '/' }
    }
  }
}
