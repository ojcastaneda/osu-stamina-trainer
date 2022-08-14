const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
module.exports = {
	i18n,
	images: {
		domains: ['assets.ppy.sh']
	},
	output: 'standalone',
	reactStrictMode: true,
	async rewrites() {
		return process.env.NODE_ENV !== 'production'
			? [
					{
						source: '/api/:path*',
						destination: `${process.env.API_URL}/api/:path*`
					}
			  ]
			: [];
	},
	swcMinify: true
};
