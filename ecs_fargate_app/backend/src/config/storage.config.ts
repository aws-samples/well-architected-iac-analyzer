export default () => ({
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    STORAGE_BUCKET_NAME: process.env.STORAGE_BUCKET_NAME || 'wa-analyzer-files'
});