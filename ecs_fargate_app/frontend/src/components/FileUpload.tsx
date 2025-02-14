import React, { useState } from 'react';
import {
  FormField,
  Header,
  SpaceBetween,
  Alert,
  StatusIndicator,
  FileUpload as CloudscapeFileUpload
} from '@cloudscape-design/components';
import { UploadedFile } from '../types';
import { HelpButton } from './utils/HelpButton';
import  { analyzerApi } from '../services/api';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  acceptedFileTypes: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes,
}) => {
  const [value, setValue] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'initial' | 'success' | 'error'>('initial');

  const handleFileChange = async (files: File[]) => {
    setValue(files);
    setError(null);

    if (!files.length) {
      return;
    }

    try {
      const file = files[0];
      
      // Validate JSON files before upload
      if (file.type === 'application/json') {
        try {
          const content = await file.text();
          JSON.parse(content); // Validate JSON structure
        } catch (error) {
          setError('Invalid JSON format');
          setUploadStatus('error');
          return;
        }
      }
      
      // Upload the file to get a fileId
      const responseObject = await analyzerApi.uploadFile(file);

      const uploadedFile: UploadedFile = {
        name: responseObject.fileName,
        type: file.type,
        size: file.size,
      };

      onFileUploaded(uploadedFile);
      setUploadStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadStatus('error');
    }
  };

  return (
    <SpaceBetween size="l">
      <FormField
        label={
          <>
            <Header variant="h3">
              1. Upload your IaC document or architecture diagram image <HelpButton contentId="fileUpload" />
            </Header>
          </>
        }
        errorText={error}
      >
        <SpaceBetween size="s">
          <CloudscapeFileUpload
            onChange={({ detail }) => handleFileChange(detail.value)}
            value={value}
            constraintText={`Supported file types ${acceptedFileTypes.join(' or ')}`}
            accept={acceptedFileTypes.join(',')}
            i18nStrings={{
              uploadButtonText: () => 'Choose file',
              dropzoneText: () => 'Drop file to upload',
            }}
            showFileLastModified
            showFileSize
            tokenLimit={1}
            multiple={false}
          />
          {uploadStatus === 'success' && (
            <StatusIndicator type="success">
              File uploaded successfully
            </StatusIndicator>
          )}
        </SpaceBetween>
      </FormField>

      {error && (
        <Alert type="error" header="Error uploading file">
          {error}
        </Alert>
      )}
    </SpaceBetween>
  );
};
