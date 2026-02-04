import React, { useState } from 'react';
import {
  FormField,
  Header,
  SpaceBetween,
  Alert,
  StatusIndicator,
  Spinner,
  FileUpload as CloudscapeFileUpload,
  SegmentedControl,
  Box
} from '@cloudscape-design/components';
import { FileUploadMode, UploadedFiles } from '../types';
import { HelpButton } from './utils/HelpButton';
import { useLanguage } from '../contexts/LanguageContext';
import { storageApi } from '../services/storage';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFiles, fileId: string) => void;
  acceptedFileTypes: string[];
}

// File size limits
const MAX_IAC_FILE_SIZE = 100 * 1024 * 1024; // 100MB for IaC files and ZIP projects
const MAX_IMAGE_FILE_SIZE = 3.75 * 1024 * 1024; // 3.75MB for images
const MAX_PDF_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB for PDFs

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes,
}) => {
  const [value, setValue] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'initial' | 'success' | 'error'>('initial');
  const [uploadMode, setUploadMode] = useState<FileUploadMode>(FileUploadMode.SINGLE_FILE);
  const { strings } = useLanguage();

  // Helper function to check if a file is an image based on its extension
  const isImageFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ['.png', '.jpg', '.jpeg'].includes(extension);
  };

  // Helper function to check if a file is a PDF
  const isPdfFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return extension === '.pdf';
  };

  // Helper function to check if a file is a ZIP
  const isZipFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return extension === '.zip';
  };

  // Helper function to check if a file is an IaC file
  const isIaCFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ['.yaml', '.yml', '.json', '.tf', '.ts', '.py', '.go', '.java', '.cs'].includes(extension);
  };

  // Helper function to format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter options based on the current mode
  const getAcceptedTypesForMode = (): string[] => {
    if (uploadMode === FileUploadMode.ZIP_FILE) {
      return ['.zip'];
    } else if (uploadMode === FileUploadMode.PDF_FILE) {
      return ['.pdf'];
    } else {
      // For single or multiple files, exclude zip files and PDF files
      return acceptedFileTypes.filter(type => type !== '.zip' && type !== '.pdf');
    }
  };

  const handleFileChange = async (files: File[]) => {
    setValue(files);
    setError(null);

    if (!files.length) {
      return;
    }

    // Determine the actual upload mode based on number of files and selected mode
    let actualUploadMode = uploadMode;
    if (uploadMode === FileUploadMode.SINGLE_FILE) {
      // If user uploaded more than 1 file in "Single or Multiple Files" mode,
      // switch to multiple files mode internally
      actualUploadMode = files.length > 1 ? FileUploadMode.MULTIPLE_FILES : FileUploadMode.SINGLE_FILE;
    }

    // Get accepted file types for current mode
    const acceptedTypes = getAcceptedTypesForMode();
    
    // PDF file mode specific validations
    if (uploadMode === FileUploadMode.PDF_FILE) {
      // Check if we have too many PDF files
      if (files.length > 5) {
        setError(`Maximum 5 PDF documents allowed. You've selected ${files.length} files.`);
        return;
      }

      // Validate file types
      const nonPdfFiles = files.filter(file => !isPdfFile(file));
      if (nonPdfFiles.length > 0) {
        const invalidNames = nonPdfFiles.map(f => f.name).join(', ');
        setError(`Only PDF files are allowed. Non-PDF files: ${invalidNames}`);
        return;
      }

      // Check file sizes (4.5MB each max)
      const oversizedFiles = files.filter(file => file.size > MAX_PDF_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        const oversizedNames = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
        setError(`Each PDF file must be less than 4.5MB. Oversized files: ${oversizedNames}`);
        return;
      }
    } else if (uploadMode === FileUploadMode.ZIP_FILE) {
      // ZIP file mode validations
      const file = files[0];
      
      // Validate file type
      if (!isZipFile(file)) {
        setError(`Only ZIP files are allowed in this mode. Selected file: ${file.name}`);
        return;
      }

      // Check file size (100MB max for ZIP)
      if (file.size > MAX_IAC_FILE_SIZE) {
        setError(`ZIP file must be less than 100MB. Selected file size: ${formatFileSize(file.size)}`);
        return;
      }
    } else {
      // Single or Multiple files mode validations
      
      // Validate file types for non-PDF modes
      const invalidFiles = files.filter(file => {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return !acceptedTypes.includes(extension);
      });

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.name).join(', ');
        setError(`The following files are not allowed: ${invalidNames}`);
        return;
      }

      // Check if there are multiple image files
      const imageFiles = files.filter(file => isImageFile(file));
      if (imageFiles.length > 1) {
        setError('Only one image file (.png, .jpg, .jpeg) can be uploaded at a time.');
        return;
      }
      
      // For multiple files, check if there are mixed file types that aren't allowed together
      if (actualUploadMode === FileUploadMode.MULTIPLE_FILES && files.length > 1) {
        // Check if there are image files mixed with non-image files
        if (imageFiles.length > 0 && files.length > imageFiles.length) {
          setError('Cannot mix image files (.png, .jpg, .jpeg) with other file types.');
          return;
        }
      }

      // Validate file sizes based on file type
      for (const file of files) {
        if (isImageFile(file)) {
          // Image file size validation (3.75MB max)
          if (file.size > MAX_IMAGE_FILE_SIZE) {
            setError(`Image file "${file.name}" exceeds the maximum size of 3.75MB. Selected file size: ${formatFileSize(file.size)}`);
            return;
          }
        } else if (isIaCFile(file)) {
          // IaC file size validation (100MB max)
          if (file.size > MAX_IAC_FILE_SIZE) {
            setError(`File "${file.name}" exceeds the maximum size of 100MB. Selected file size: ${formatFileSize(file.size)}`);
            return;
          }
        }
      }

      // For multiple IaC files, also check total size
      if (actualUploadMode === FileUploadMode.MULTIPLE_FILES) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > MAX_IAC_FILE_SIZE) {
          setError(`Total file size (${formatFileSize(totalSize)}) exceeds the maximum of 100MB.`);
          return;
        }
      }
    }

    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      
      // Add upload mode to the request
      formData.append('mode', actualUploadMode);
      
      // Add files to FormData
      files.forEach(file => {
        formData.append('files', file);
      });

      // Upload file(s) to S3 and create work item
      const response = await storageApi.uploadFiles(formData);

      if (!response || !response.fileId) {
        throw new Error('Invalid server response');
      }

      // Prepare response based on upload mode
      let uploadedFiles: UploadedFiles = {
        mode: actualUploadMode,
      };

      if (actualUploadMode === FileUploadMode.SINGLE_FILE) {
        const file = files[0];
        const fileType = determineFileType(file);

        uploadedFiles.singleFile = {
          name: file.name,
          content: '', // Content is stored in S3
          type: fileType,
          size: file.size,
        };
      } 
      else if (actualUploadMode === FileUploadMode.MULTIPLE_FILES) {
        uploadedFiles.multipleFiles = files.map(file => ({
          name: file.name,
          content: '', // Content is stored in S3
          type: determineFileType(file),
          size: file.size,
        }));
        
        // Add token count information if available
        if (response.tokenCount) {
          uploadedFiles.tokenCount = response.tokenCount;
          uploadedFiles.exceedsTokenLimit = response.exceedsTokenLimit;
        }
      }
      else if (actualUploadMode === FileUploadMode.ZIP_FILE) {
        const file = files[0];
        uploadedFiles.zipFile = {
          name: file.name,
          content: '', // Content is stored in S3
          type: file.type,
          size: file.size,
        };
        
        // Add token count information if available
        if (response.tokenCount) {
          uploadedFiles.tokenCount = response.tokenCount;
          uploadedFiles.exceedsTokenLimit = response.exceedsTokenLimit;
        }
      }
      else if (actualUploadMode === FileUploadMode.PDF_FILE) {
        // Handle PDF files upload results
        if (files.length === 1) {
          // Single PDF file
          const file = files[0];
          uploadedFiles.singleFile = {
            name: file.name,
            content: '', // Content is stored in S3
            type: file.type,
            size: file.size,
          };
        } else {
          // Multiple PDF files
          uploadedFiles.multipleFiles = files.map(file => ({
            name: file.name,
            content: '', // Content is stored in S3
            type: file.type,
            size: file.size,
          }));
        }
      }

      setUploadStatus('success');
      onFileUploaded(uploadedFiles, response.fileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.fileUpload.errorUploadingFile);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const determineFileType = (file: File): string => {
    // For files with special extensions
    if (file.name.endsWith('.tf')) return 'application/terraform';
    if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) return 'application/yaml';
    if (file.name.endsWith('.json')) return 'application/json';
    if (file.name.endsWith('.pdf')) return 'application/pdf';
    
    // For standard MIME types
    return file.type;
  };

  return (
    <SpaceBetween size="l">
      <FormField
        label={
          <>
            <Header variant="h3">
              1. {strings.fileUpload.title} <HelpButton contentId="fileUpload" />
            </Header>
          </>
        }
        errorText={error}
      >
        <SpaceBetween size="s">
          <SegmentedControl
            selectedId={uploadMode}
            onChange={({ detail }) => {
              setUploadMode(detail.selectedId as FileUploadMode);
              setValue([]);
              setError(null);
              setUploadStatus('initial');
            }}
            label={strings.fileUpload.uploadMode}
            options={[
              {
                id: FileUploadMode.SINGLE_FILE,
                text: strings.fileUpload.singleOrMultipleFiles
              },
              {
                id: FileUploadMode.ZIP_FILE,
                text: strings.fileUpload.completeIacProject
              },
              {
                id: FileUploadMode.PDF_FILE,
                text: strings.fileUpload.pdfDocuments
              }
            ]}
          />
          
          {uploadMode === FileUploadMode.SINGLE_FILE && (
            <Box>{strings.fileUpload.singleOrMultipleFilesDescription}</Box>
          )}
          
          {uploadMode === FileUploadMode.ZIP_FILE && (
            <Box>{strings.fileUpload.completeIacProjectDescription}</Box>
          )}
          
          {uploadMode === FileUploadMode.PDF_FILE && (
            <Box>{strings.fileUpload.pdfDocumentsDescription}</Box>
          )}

          <CloudscapeFileUpload
            onChange={({ detail }) => handleFileChange(detail.value)}
            value={value}
            accept={getAcceptedTypesForMode().join(',')}
            i18nStrings={{
              uploadButtonText: () => isUploading ? strings.fileUpload.uploading : strings.fileUpload.chooseFiles,
              dropzoneText: () => {
                if (isUploading) return strings.fileUpload.uploading;
                
                switch(uploadMode) {
                  case FileUploadMode.SINGLE_FILE:
                    return strings.fileUpload.dropFilesToUpload;
                  case FileUploadMode.ZIP_FILE:
                    return strings.fileUpload.dropZipFileToUpload;
                  case FileUploadMode.PDF_FILE:
                    return strings.fileUpload.dropPdfFilesToUpload;
                  default:
                    return strings.fileUpload.dropFilesToUpload;
                }
              },
              removeFileAriaLabel: i => `${strings.fileUpload.removeFile} ${i + 1}`,
            }}
            showFileLastModified
            showFileSize
            multiple={uploadMode === FileUploadMode.SINGLE_FILE || uploadMode === FileUploadMode.PDF_FILE}
            tokenLimit={uploadMode === FileUploadMode.ZIP_FILE ? 1 : undefined}
          />
          {isUploading && (
            <Spinner />
          )}
          {uploadStatus === 'success' && !isUploading && (
            <StatusIndicator type="success">
              {value.length > 1 ? strings.fileUpload.filesUploadedSuccessfully : strings.fileUpload.fileUploadedSuccessfully}
            </StatusIndicator>
          )}
        </SpaceBetween>
      </FormField>

      {error && (
        <Alert type="error" header={strings.fileUpload.errorUploadingFile}>
          {error}
        </Alert>
      )}
    </SpaceBetween>
  );
};