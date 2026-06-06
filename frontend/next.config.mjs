import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    optimizePackageImports: ['antd', '@ant-design/icons'],
};

export default withNextIntl(nextConfig);
