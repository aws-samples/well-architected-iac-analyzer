import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as AdmZip from 'adm-zip';

import { ProjectFile, PackedProject } from '../interfaces/project-file.interface';
import { Logger } from '@nestjs/common';

/**
 * Class that provides functionality to pack a project from a zip file or multiple files
 */
export class ProjectPacker {
    private readonly logger = new Logger(ProjectPacker.name);

    // Limits
    private readonly MAX_EXTRACTION_SIZE = 500 * 1024 * 1024; // 500MB max extraction size
    private readonly MAX_FILE_COUNT = 10000; // Maximum number of files to extract
    private readonly MAX_SINGLE_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file  
    private readonly MAX_PATH_LENGTH = 260; // Maximum file path length

    // Media and binary file extensions to exclude
    private readonly excludeExtensions = [
        '.env', '.log', '.tmp', '.pdf', '.png', '.jpeg', '.jpg', '.gif',
        '.bmp', '.tiff', '.raw', '.cr2', '.nef', '.arw', '.dng', '.psd',
        '.ai', '.eps', '.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv',
        '.webm', '.m4v', '.3gp', '.mpeg', '.mpg', '.mp3', '.wav', '.aac',
        '.wma', '.ogg', '.flac', '.m4a', '.mid', '.midi', '.doc', '.docx',
        '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.7z', '.tar.gz',
        '.gz', '.iso', '.dmg', '.exe', '.dll', '.app', '.deb', '.rpm', '.msi',
        '.bin', '.dat', '.db', '.sqlite', '.mdb', '.pdb', '.obj', '.lib', '.so',
        '.dylib', '.class', '.jar', '.pyc', '.ico', '.cur', '.heic', '.heif',
        '.webp', '.svg', '.xcf', '.sketch', '.fig', '.dwg', '.dxf', '.blend',
        '.fbx', '.3ds', '.max', '.mb', '.ma', '.swf'
    ];

    // Patterns to exclude (directories and files)
    private readonly excludePatterns = [
        'node_modules', 'dist', 'cdk.out', '.git', '.github',
        'package-lock.json', 'yarn.lock', '__MACOSX'
    ];

    // Token limit warning threshold
    private readonly tokenLimitWarning = 200000;

    /**
     * Validates a file path to prevent directory traversal attacks
     * @param filePath The file path to validate
     * @param basePath The base extraction directory
     * @returns True if the path is safe, false otherwise
     */
    private isValidPath(filePath: string, basePath: string): boolean {
        try {
            // This is the validation function.
            // It uses path.resolve and path.relative to verify that the filePath stays within basePath.
            // All file operations elsewhere in this class go through this validation first.
            // The basePath is always a secure temp directory created by Node.js (fs.mkdtempSync).
            
            // Normalize the paths to resolve any '..' or '.' segments
            const normalizedPath = path.normalize(filePath);
            const normalizedBase = path.normalize(basePath);

            // Check for directory traversal patterns
            if (normalizedPath.includes('..') ||
                normalizedPath.startsWith('/') ||
                normalizedPath.match(/^[a-zA-Z]:/)) {
                return false;
            }

            // Resolve the full path and ensure it's within the base directory
            // nosemgrep: path-join-resolve-traversal
            const fullPath = path.resolve(basePath, normalizedPath);
            const relativePath = path.relative(normalizedBase, fullPath);

            // Path should not start with '..' and should not be empty
            return !relativePath.startsWith('..') && relativePath !== '' && !path.isAbsolute(relativePath);
        } catch (error) {
            this.logger.error(`Path validation error: ${error.message}`);
            return false;
        }
    }

    /**
     * Checks if a file path length exceeds the maximum allowed length
     * @param filePath The file path to check
     * @returns True if path length is acceptable
     */
    private isValidPathLength(filePath: string): boolean {
        return filePath.length <= this.MAX_PATH_LENGTH;
    }

    /**
     * Safely extracts a ZIP file with security validations
     * @param buffer The ZIP file as a Buffer
     * @returns Directory path where files were extracted
     */
    private async unzipBuffer(buffer: Buffer): Promise<string> {
        // The tempDir is created by Node.js's fs.mkdtempSync using os.tmpdir() - a secure system temp directory.
        // No user input is used in tempDir creation. All subsequent file operations within this tempDir
        // are validated through isValidPath() and extensive sanitization before any fs operations occur.
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-'));
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();

        let totalExtractedSize = 0;
        let extractedFileCount = 0;
        const zipSize = buffer.length;

        try {
            // Validate compression ratio
            const totalUncompressedSize = entries.reduce((sum, entry) => sum + entry.header.size, 0);
            const compressionRatio = totalUncompressedSize / zipSize;

            if (compressionRatio > 1000) { // Threshold: 1000:1 ratio
                throw new Error(`Uploaded file exceeded the compression ratio threshold`);
            }

            // Check if there are too many files
            if (entries.length > this.MAX_FILE_COUNT) {
                throw new Error(`ZIP file contains too many files. Maximum allowed: ${this.MAX_FILE_COUNT}`);
            }

            // Check if entries contain other archives
            const zipExtensions = ['.zip', '.jar', '.war', '.ear', '.7z', '.rar', '.tar', '.gz', '.tgz'];
            const nestedArchives = entries.filter(entry =>
                !entry.isDirectory &&
                zipExtensions.some(ext => entry.entryName.toLowerCase().endsWith(ext))
            );

            // Limit nested archives
            if (nestedArchives.length > 5) { // Threshold: 5 nested archives
                throw new Error(`Too many nested archive files detected. Maximum allowed: 5`);
            }

            // Validate all entries before extraction
            for (const entry of entries) {
                // Check file count limit
                if (extractedFileCount >= this.MAX_FILE_COUNT) {
                    throw new Error(`ZIP file contains too many files. Maximum allowed: ${this.MAX_FILE_COUNT}`);
                }

                // Skip directories
                if (entry.isDirectory) {
                    continue;
                }

                // Validate entry name
                if (!this.isValidPath(entry.entryName, tempDir)) {
                    throw new Error(`Invalid file path detected: ${entry.entryName}`);
                }

                // Validate path length
                if (!this.isValidPathLength(entry.entryName)) {
                    throw new Error(`File path too long: ${entry.entryName}`);
                }

                // Check for null bytes in filename (additional security check)
                if (entry.entryName.includes('\0')) {
                    throw new Error(`Invalid character in filename: ${entry.entryName}`);
                }

                // Check individual file size limit
                const uncompressedSize = entry.header.size;
                if (uncompressedSize > this.MAX_SINGLE_FILE_SIZE) {
                    throw new Error(`File too large: ${entry.entryName} (${uncompressedSize} bytes)`);
                }

                // Check total extraction size
                totalExtractedSize += uncompressedSize;
                if (totalExtractedSize > this.MAX_EXTRACTION_SIZE) {
                    throw new Error(`Total extraction size exceeds limit: ${totalExtractedSize} bytes`);
                }

                extractedFileCount++;
            }

            // Safely extract each file individually
            for (const entry of entries) {
                if (entry.isDirectory) {
                    continue;
                }

                // Sanitize the entry name by normalizing and removing any directory traversal
                const sanitizedEntryName = path.normalize(entry.entryName)
                    .replace(/^(\.\.[\/\\])+/, '') // Remove leading ../
                    .replace(/[\/\\]\.\.[\/\\]/g, '/') // Remove middle ../
                    .replace(/[\/\\]\.\.$/g, '') // Remove trailing ..
                    .replace(/^[\/\\]/, ''); // Remove leading slash

                // Double-check the sanitized path is still valid
                if (!this.isValidPath(sanitizedEntryName, tempDir)) {
                    throw new Error(`Path became invalid after sanitization: ${entry.entryName}`);
                }

                // The entryPath is constructed from sanitizedEntryName which has been:
                // 1. Validated through isValidPath() to ensure no directory traversal
                // 2. Sanitized to remove all '..' and leading slashes
                // 3. Double-checked after sanitization
                // The tempDir is a secure system temp directory created by Node.js
                const entryPath = path.join(tempDir, sanitizedEntryName);

                // The entryPath has been validated and sanitized as follows:
                // 1. Original entry.entryName validated through isValidPath()
                // 2. Sanitized to remove all directory traversal patterns
                // 3. Re-validated after sanitization
                // 4. Additional check below ensures resolved path is within tempDir
                // 5. tempDir itself is a secure system-created temp directory
                
                // Final security check: ensure the resolved path is still within tempDir
                const resolvedPath = path.resolve(entryPath);
                const resolvedTempDir = path.resolve(tempDir);
                if (!resolvedPath.startsWith(resolvedTempDir + path.sep) && resolvedPath !== resolvedTempDir) {
                    throw new Error(`Extracted path outside temp directory: ${entry.entryName}`);
                }

                const entryDir = path.dirname(entryPath);

                // Ensure the directory exists
                if (!fs.existsSync(entryDir)) { // nosemgrep: detect-non-literal-fs-filename
                    fs.mkdirSync(entryDir, { recursive: true }); // nosemgrep: detect-non-literal-fs-filename
                }

                // Extract the file data
                const fileData = entry.getData();

                // Verify the extracted size matches the expected size
                if (fileData.length !== entry.header.size) {
                    throw new Error(`File size mismatch for: ${entry.entryName}`);
                }

                // Write the file
                fs.writeFileSync(entryPath, fileData); // nosemgrep: detect-non-literal-fs-filename
            }

            return tempDir;
        } catch (error) {
            // Clean up on error
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            throw error;
        }
    }

    /**
     * Generates a directory tree structure for a given path
     * @param dirPath Directory path
     * @returns String representation of the directory tree
     */
    private generateDirectoryTree(dirPath: string): string {
        try {
            const files = this.getFilesRecursively(dirPath);
            return this.formatAsTree(files, dirPath);
        } catch (error) {
            this.logger.error(`Error generating directory tree: ${error}`);
            return `${path.basename(dirPath)} (directory tree generation failed)`;
        }
    }

    /**
     * Recursively gets all files from a directory, excluding patterns
     * @param dirPath Directory path
     * @returns Array of file paths relative to dirPath
     */
    private getFilesRecursively(dirPath: string): string[] {
        const files: string[] = [];
        let processedFileCount = 0;

        const traverse = (currentPath: string) => {
            // The currentPath parameter is always derived from validated paths:
            // 1. Initial call uses dirPath which is a secure temp directory
            // 2. Recursive calls construct paths using validated relative paths
            // 3. All paths are checked through isValidPath() before further processing
            // 4. The traverse function only operates within the initial dirPath boundary
            
            // Check file count limit
            if (processedFileCount >= this.MAX_FILE_COUNT) {
                throw new Error(`Too many files in project. Maximum allowed: ${this.MAX_FILE_COUNT}`);
            }

            const entries = fs.readdirSync(currentPath); // nosemgrep: detect-non-literal-fs-filename

            for (const entry of entries) {
                // The fullPath is constructed from currentPath (validated temp directory path)
                // and entry (directory entry name from fs.readdirSync).
                // Subsequent validation through isValidPath() ensures the resulting path
                // remains within the allowed directory structure.
                // nosemgrep: path-join-resolve-traversal
                const fullPath = path.join(currentPath, entry);
                const relativePath = path.relative(dirPath, fullPath);

                // Validate the path
                if (!this.isValidPath(relativePath, dirPath)) {
                    this.logger.warn(`Skipping invalid path: ${relativePath}`);
                    continue;
                }

                // Skip excluded patterns
                if (this.excludePatterns.some(pattern => relativePath.includes(pattern))) {
                    continue;
                }

                // Skip hidden files/directories
                if (entry.startsWith('.')) {
                    continue;
                }

                let stats;
                try {
                    // The fullPath has been constructed from validated components:
                    // 1. currentPath is from a secure temp directory
                    // 2. entry is from fs.readdirSync (filesystem-provided name)
                    // 3. The resulting relativePath was validated through isValidPath()
                    // 4. Additional checks above skip excluded patterns and hidden files
                    // Using lstatSync specifically to detect and reject symbolic links
                    // nosemgrep: detect-non-literal-fs-filename
                    stats = fs.lstatSync(fullPath);
                } catch (error) {
                    this.logger.warn(`Cannot stat file: ${fullPath}`);
                    continue;
                }

                // Skip symbolic links for security
                if (stats.isSymbolicLink()) {
                    this.logger.warn(`Skipping symbolic link: ${relativePath}`);
                    continue;
                }

                if (stats.isDirectory()) {
                    traverse(fullPath);
                } else if (stats.isFile()) {
                    // Check file size
                    if (stats.size > this.MAX_SINGLE_FILE_SIZE) {
                        this.logger.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
                        continue;
                    }

                    files.push(relativePath);
                    processedFileCount++;
                }
            }
        };

        traverse(dirPath);
        return files.sort();
    }

    /**
     * Formats file paths as a tree structure
     * @param files Array of file paths
     * @param basePath Base directory path
     * @returns Formatted tree string
     */
    private formatAsTree(files: string[], basePath: string): string {
        const baseDir = path.basename(basePath);
        let result = `${baseDir}\n.`;

        files.forEach(file => {
            const segments = file.split(path.sep).filter(s => s);
            let currentPath = '';

            segments.forEach((segment, index) => {
                const depth = index;
                const isLast = index === segments.length - 1;
                const prefix = '│   '.repeat(depth) + (isLast ? '└── ' : '├── ');

                if (index === 0 || !result.includes(currentPath + segment)) {
                    result += '\n' + prefix + segment;
                }
                currentPath += segment + '/';
            });
        });

        return result;
    }

    /**
     * Reads all files from a directory recursively with security checks
     * @param dirPath Directory path
     * @returns Array of ProjectFile objects
     */
    private async readFilesFromDirectory(dirPath: string): Promise<ProjectFile[]> {
        const files: ProjectFile[] = [];
        let totalSize = 0;

        const processDirectory = async (currentPath: string, basePath: string) => {
            // The currentPath is always a validated directory path:
            // 1. Initial call: dirPath is a secure temp directory created by Node.js
            // 2. Recursive calls: Constructed from validated fullPath entries
            // 3. All constructed paths are validated through isValidPath()
            // 4. Additional validation rejects symlinks and traversal attempts
            // nosemgrep: detect-non-literal-fs-filename
            const entries = fs.readdirSync(currentPath);

            for (const entry of entries) {
                // The fullPath is safely constructed:
                // 1. currentPath is validated (either initial dirPath or previously validated path)
                // 2. entry comes from fs.readdirSync (filesystem-provided name)
                // 3. The resulting path is immediately validated through isValidPath()
                // 4. Further checks below ensure security (no symlinks, size limits, etc.)
                // nosemgrep: path-join-resolve-traversal
                const fullPath = path.join(currentPath, entry);
                const relativePath = path.relative(basePath, fullPath);

                // Validate the path
                if (!this.isValidPath(relativePath, basePath)) {
                    this.logger.warn(`Skipping invalid path: ${relativePath}`);
                    continue;
                }

                // Skip excluded directories
                if (this.excludePatterns.some(pattern => fullPath.includes(pattern))) {
                    continue;
                }

                let stats;
                try {
                    // The fullPath has been validated through multiple checks:
                    // 1. Constructed from validated currentPath and filesystem-provided entry name
                    // 2. The relativePath was validated through isValidPath()
                    // 3. Excluded patterns were checked
                    // 4. Using lstatSync to detect symbolic links (security feature to prevent symlink attacks)
                    // nosemgrep: detect-non-literal-fs-filename
                    stats = fs.lstatSync(fullPath);
                } catch (error) {
                    this.logger.warn(`Cannot stat file: ${fullPath}`);
                    continue;
                }

                // Skip symbolic links
                if (stats.isSymbolicLink()) {
                    this.logger.warn(`Skipping symbolic link: ${relativePath}`);
                    continue;
                }

                if (stats.isDirectory()) {
                    // Recursive call with fullPath which has been validated as:
                    // 1. Constructed from validated components
                    // 2. Checked through isValidPath()
                    // 3. Verified not to be a symlink
                    // 4. Within the base directory structure
                    await processDirectory(fullPath, basePath);
                } else if (stats.isFile()) {
                    // Skip excluded file extensions
                    const ext = path.extname(fullPath).toLowerCase();
                    if (this.excludeExtensions.includes(ext)) {
                        continue;
                    }

                    // Check file size
                    if (stats.size > this.MAX_SINGLE_FILE_SIZE) {
                        this.logger.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
                        continue;
                    }

                    // Check total size limit
                    totalSize += stats.size;
                    if (totalSize > this.MAX_EXTRACTION_SIZE) {
                        throw new Error(`Total file size exceeds limit: ${totalSize} bytes`);
                    }

                    try {
                        // The fullPath used here is validated:
                        // 1. Passed isValidPath() validation
                        // 2. Verified not to be a symlink
                        // 3. Checked against excluded patterns
                        // 4. Size-limited to prevent DoS
                        // 5. Within the secure temp directory structure
                        // This multi-layer validation ensures safe file reading
                        // nosemgrep: detect-non-literal-fs-filename
                        const content = fs.readFileSync(fullPath, 'utf8');
                        files.push({
                            path: relativePath,
                            filename: path.basename(fullPath),
                            content,
                            size: stats.size
                        });
                    } catch (error) {
                        // Skip files that can't be read as text
                        this.logger.warn(`Skipping file ${fullPath}: ${error.message}`);
                    }
                }
            }
        };

        await processDirectory(dirPath, dirPath);
        return files;
    }

    /**
     * Creates a packed representation of a project
     * @param files Array of ProjectFile objects
     * @param directoryStructure Directory tree string
     * @param source Source information
     * @returns PackedProject object
     */
    private createPackedProject(
        files: ProjectFile[],
        directoryStructure: string,
        source: string
    ): PackedProject {
        // Create the packed content
        let packedContent = `================================================================
Project Packed File Summary
================================================================

Purpose:
--------
This Project Packed file contains a packed representation of an entire project or repository's contents.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Directory structure
3. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line (================)
  d. The full contents of the file

Notes:
------
- Some files have been excluded based on exclusion rules when generating this packed file.
- Binary files are not included in this packed representation.
- Source: ${source}

================================================================
Directory Structure
================================================================
${directoryStructure}

================================================================
Files
================================================================

Below is the content of each file in the project:

`;

        // Add each file to the packed content
        files.forEach(file => {
            packedContent += `\n================\n`;
            packedContent += `File: ${file.path}\n`;
            packedContent += `================\n`;
            packedContent += `${file.content}\n`;
        });

        // Calculate token count (rough estimate: 4 chars per token)
        const tokenCount = Math.ceil(packedContent.length / 4);
        const exceedsTokenLimit = tokenCount > this.tokenLimitWarning;

        return {
            source,
            directoryStructure,
            files,
            tokenCount,
            exceedsTokenLimit,
            packedContent
        };
    }

    private async executeWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number = 30000
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            operation()
                .then((result) => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    /**
     * Process a zip file and create a packed project with security validations
     * @param buffer Zip file buffer
     * @param originalFilename Original zip filename
     * @returns PackedProject object
     */
    public async processZipFile(buffer: Buffer, originalFilename: string): Promise<PackedProject> {
        let tempDir: string | null = null;

        try {
            // Validate buffer size
            if (buffer.length > this.MAX_EXTRACTION_SIZE) {
                throw new Error(`ZIP file too large: ${buffer.length} bytes. Maximum allowed: ${this.MAX_EXTRACTION_SIZE} bytes`);
            }

            // Validate filename
            if (!originalFilename || originalFilename.includes('..') || originalFilename.includes('\0')) {
                throw new Error(`Invalid filename: ${originalFilename}`);
            }

            // Unzip the file to a temporary directory with extraction with timeout and validation checks
            tempDir = await this.executeWithTimeout(() => this.unzipBuffer(buffer), 60000); // 60 second timeout

            // Generate directory tree
            const directoryStructure = this.generateDirectoryTree(tempDir);

            // Read all files with security validations
            const files = await this.readFilesFromDirectory(tempDir);

            // Create packed project
            const packedProject = this.createPackedProject(files, directoryStructure, `Zip file: ${originalFilename}`);

            return packedProject;
        } catch (error) {
            this.logger.error(`Error processing zip file: ${error.message}`);
            throw new Error(`Failed to process zip file: ${error.message}`);
        } finally {
            // Clean up temp directory
            if (tempDir && fs.existsSync(tempDir)) {
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    this.logger.error(`Error cleaning up temp directory: ${cleanupError.message}`);
                }
            }
        }
    }

    /**
     * Process multiple files and create a packed project
     * @param files Array of {filename, buffer, type} objects
     * @returns PackedProject object
     */
    public async processMultipleFiles(
        files: Array<{ filename: string, buffer: Buffer, type: string }>
    ): Promise<PackedProject> {
        let tempDir: string | null = null;

        try {
            // Validate inputs
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            if (files.length > this.MAX_FILE_COUNT) {
                throw new Error(`Too many files: ${files.length}. Maximum allowed: ${this.MAX_FILE_COUNT}`);
            }

            // Create temporary directory
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-files-'));

            let totalSize = 0;

            // Write files to temp directory with validation
            files.forEach(file => {
                try {
                    // Validate filename
                    if (!file.filename || file.filename.includes('..') || file.filename.includes('\0')) {
                        throw new Error(`Invalid filename: ${file.filename}`);
                    }

                    // Validate file size
                    if (file.buffer.length > this.MAX_SINGLE_FILE_SIZE) {
                        throw new Error(`File too large: ${file.filename} (${file.buffer.length} bytes)`);
                    }

                    totalSize += file.buffer.length;
                    if (totalSize > this.MAX_EXTRACTION_SIZE) {
                        throw new Error(`Total files size exceeds limit: ${totalSize} bytes`);
                    }

                    // Validate path
                    if (!this.isValidPath(file.filename, tempDir)) {
                        throw new Error(`Invalid file path: ${file.filename}`);
                    }

                    // The filePath is constructed from:
                    // 1. tempDir: Secure system temp directory created by Node.js
                    // 2. file.filename: Validated through isValidPath() above
                    // 3. Additional validation checks performed (no '..', no null bytes)
                    // 4. Path is verified to remain within tempDir boundaries
                    // nosemgrep: path-join-resolve-traversal
                    const filePath = path.join(tempDir, file.filename);
                    const fileDir = path.dirname(filePath);

                    // The fileDir is derived from filePath which has been:
                    // 1. Constructed from validated components (secure tempDir + validated filename)
                    // 2. The filename was checked through isValidPath()
                    // 3. Additional security checks performed (no '..', no null bytes)
                    // Ensure directory exists
                    // nosemgrep: detect-non-literal-fs-filename
                    if (!fs.existsSync(fileDir)) {
                        // Creating directory for validated path. The fileDir is safely constructed:
                        // 1. Derived from validated filePath
                        // 2. Within secure tempDir boundaries
                        // 3. No user-controlled traversal possible
                        // nosemgrep: detect-non-literal-fs-filename
                        fs.mkdirSync(fileDir, { recursive: true });
                    }

                    // Writing to validated file path. Security measures:
                    // 1. filePath constructed from secure tempDir + validated filename
                    // 2. filename validated through isValidPath()
                    // 3. Size limits enforced
                    // 4. No directory traversal possible due to validation
                    // 5. file.buffer comes from multipart upload, not from filesystem
                    // nosemgrep: detect-non-literal-fs-filename
                    fs.writeFileSync(filePath, file.buffer);
                } catch (error) {
                    this.logger.error(`Error writing file ${file.filename}: ${error.message}`);
                    throw error;
                }
            });

            // Generate directory tree
            const directoryStructure = this.generateDirectoryTree(tempDir);

            // Read all files
            const projectFiles = await this.readFilesFromDirectory(tempDir);

            // Create packed project
            const packedProject = this.createPackedProject(
                projectFiles,
                directoryStructure,
                `Multiple files: ${files.map(f => f.filename).join(', ')}`
            );

            return packedProject;
        } catch (error) {
            this.logger.error(`Error processing multiple files: ${error.message}`);
            throw new Error(`Failed to process multiple files: ${error.message}`);
        } finally {
            // Clean up temp directory
            if (tempDir && fs.existsSync(tempDir)) {
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    this.logger.error(`Error cleaning up temp directory: ${cleanupError.message}`);
                }
            }
        }
    }

    /**
     * Creates a zip file from multiple files
     * @param files Array of {filename, buffer, type} objects
     * @returns Buffer containing the zip file
     */
    public createZipFromFiles(
        files: Array<{ filename: string, buffer: Buffer, type: string }>
    ): Buffer {
        try {
            // Validate inputs
            if (!files || files.length === 0) {
                throw new Error('No files provided for ZIP creation');
            }

            if (files.length > this.MAX_FILE_COUNT) {
                throw new Error(`Too many files for ZIP creation: ${files.length}`);
            }

            const zip = new AdmZip();
            let totalSize = 0;

            // Add each file to the zip with validation
            files.forEach(file => {
                // Validate filename
                if (!file.filename || file.filename.includes('..') || file.filename.includes('\0')) {
                    throw new Error(`Invalid filename for ZIP: ${file.filename}`);
                }

                // Validate file size
                if (file.buffer.length > this.MAX_SINGLE_FILE_SIZE) {
                    throw new Error(`File too large for ZIP: ${file.filename} (${file.buffer.length} bytes)`);
                }

                totalSize += file.buffer.length;
                if (totalSize > this.MAX_EXTRACTION_SIZE) {
                    throw new Error(`Total ZIP content size exceeds limit: ${totalSize} bytes`);
                }

                zip.addFile(file.filename, file.buffer);
            });

            // Generate zip buffer
            return zip.toBuffer();
        } catch (error) {
            this.logger.error(`Error creating zip file: ${error.message}`);
            throw new Error(`Failed to create zip file: ${error.message}`);
        }
    }
}