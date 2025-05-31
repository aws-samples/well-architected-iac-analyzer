export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    devMode: process.env.AUTH_DEV_MODE === 'true',
    devEmail: process.env.AUTH_DEV_EMAIL,
    signOutUrl: process.env.AUTH_SIGN_OUT_URL || '',
  },
  storage: {
    enabled: process.env.STORAGE_ENABLED === 'true' || true,
    bucket: process.env.ANALYSIS_STORAGE_BUCKET,
    table: process.env.ANALYSIS_METADATA_TABLE,
  },
  aws: {
    region: process.env.AWS_REGION || process.env.CDK_DEPLOY_REGION,
    s3: {
      waDocsBucket: process.env.WA_DOCS_S3_BUCKET,
    },
    bedrock: {
      knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      modelId: process.env.MODEL_ID,
    },
    ddb: {
      lensMetadataTable: process.env.LENS_METADATA_TABLE,
    }    
  },
  // Language configuration for output
  language: {
    output: process.env.OUTPUT_LANGUAGE || 'en', // Default is English
  },
});