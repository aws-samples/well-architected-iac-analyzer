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
      let fileContent: string;

      // Handle image files differently
      if (file.type.startsWith('image/')) {
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        fileContent = await file.text();
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        content: fileContent,
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