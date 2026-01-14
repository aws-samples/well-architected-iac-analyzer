import React, { ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './CodeBlock.css';

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
}

interface PropsWithChildren {
  children?: ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  // Convert ReactNode to string safely
  const getStringContent = (node: ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (typeof node === 'number') {
      return String(node);
    }
    if (React.isValidElement<PropsWithChildren>(node)) {
      // If it's a React element, try to extract text content
      if (typeof node.props.children === 'string') {
        return node.props.children;
      }
      if (Array.isArray(node.props.children)) {
        return node.props.children.map(getStringContent).join('');
      }
      return getStringContent(node.props.children);
    }
    if (Array.isArray(node)) {
      return node.map(getStringContent).join('');
    }
    // For null, undefined, boolean, or other types
    return String(node || '');
  };

  const content = getStringContent(children);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // Map common IaC languages to supported syntax highlighter languages
  const getLanguage = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case 'cloudformation':
      case 'cfn':
        return 'yaml';
      case 'terraform':
      case 'tf':
      case 'hcl':
        return 'hcl';
      case 'json':
        return 'json';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return lang || 'text';
    }
  };

  // Handle empty content
  if (!content.trim()) {
    return <code className="inline-code"></code>;
  }

  if (language) {
    return (
      <div className="code-block-container">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={getLanguage(language)}
          PreTag="div"
        >
          {content.replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="inline-code">
      {content}
    </code>
  );
};

export default CodeBlock;