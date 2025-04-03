import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link, Image, Code } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export interface SimpleMarkdownEditorProps {
  /**
   * The markdown content to display in the editor
   */
  markdown?: string;
  
  /**
   * Called when the markdown content changes
   */
  onChange?: (markdown: string) => void;
  
  /**
   * Called when the user has finished editing (on blur)
   */
  onBlur?: () => void;
  
  /**
   * Called when the save button is clicked
   */
  onSave?: (markdown: string) => void;
  
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Additional class name for the container
   */
  className?: string;
}

export default function SimpleMarkdownEditor({
  markdown = '# Hello World',
  onChange,
  onBlur,
  onSave,
  label,
  className
}: SimpleMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [content, setContent] = useState<string>(markdown);
  
  // Update content when markdown prop changes
  useEffect(() => {
    setContent(markdown);
  }, [markdown]);
  
  const handleChange = (newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  };
  
  const handleSave = () => {
    onSave?.(content);
  };
  
  return (
    <Card className={cn("flex flex-col", className)}>
      {/* Card header with label */}
      <CardHeader className="px-4 py-2 border-b bg-muted/40 sticky top-0 z-10">
        <CardTitle className="text-base font-medium">{label || "Markdown Editor"}</CardTitle>
      </CardHeader>
      
      {/* Card content with tabs */}
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs 
          defaultValue="edit" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col"
        >
          <TabsList className="grid grid-cols-2 rounded-none border-b sticky top-[57px] z-10 bg-background">
            <TabsTrigger value="edit" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="flex-1 flex flex-col overflow-hidden border-0 p-0 m-0">
            {/* Markdown Toolbar */}
            <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/20">
              <TooltipProvider>
                {/* Heading Buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `# ${selectedText}`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          // Set cursor position after the operation
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Heading1 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 1</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `## ${selectedText}`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 3, start + 3 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Heading2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 2</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `### ${selectedText}`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 4, start + 4 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Heading3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 3</TooltipContent>
                </Tooltip>

                {/* Text Formatting */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `**${selectedText}**`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `*${selectedText}*`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>

                {/* Lists */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          // Split by lines and add bullet points
                          const lines = selectedText.split('\n');
                          const bulletedLines = lines.map(line => `- ${line}`).join('\n');
                          const replacement = bulletedLines;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start, start + replacement.length);
                          }, 0);
                        }
                      }}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bulleted List</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          // Split by lines and add numbers
                          const lines = selectedText.split('\n');
                          const numberedLines = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
                          const replacement = numberedLines;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start, start + replacement.length);
                          }, 0);
                        }
                      }}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Numbered List</TooltipContent>
                </Tooltip>

                {/* Link and Image */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const linkText = selectedText || 'link text';
                          const replacement = `[${linkText}](https://example.com)`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            if (selectedText) {
                              textarea.setSelectionRange(start + linkText.length + 3, start + replacement.length - 1);
                            } else {
                              textarea.setSelectionRange(start + 1, start + linkText.length + 1);
                            }
                          }, 0);
                        }
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insert Link</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const altText = selectedText || 'alt text';
                          const replacement = `![${altText}](https://example.com/image.jpg)`;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            if (selectedText) {
                              textarea.setSelectionRange(start + altText.length + 4, start + replacement.length - 1);
                            } else {
                              textarea.setSelectionRange(start + 2, start + altText.length + 2);
                            }
                          }, 0);
                        }
                      }}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insert Image</TooltipContent>
                </Tooltip>

                {/* Code */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = content.substring(start, end);
                          const replacement = `\`${selectedText}\``;
                          const newContent = content.substring(0, start) + replacement + content.substring(end);
                          handleChange(newContent);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
                          }, 0);
                        }
                      }}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Inline Code</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <Textarea
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={onBlur}
                className="w-full h-full resize-none font-mono"
                placeholder="Enter markdown here..."
                style={{ minHeight: 'calc(100vh - 250px)' }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-auto border-0 p-0 m-0">
            <div className="p-4 prose prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 max-w-none" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <ReactMarkdown components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                li: ({node, ...props}) => <li className="my-1" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                code: ({node, ...props}) => <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-gray-100 rounded p-2 overflow-x-auto my-2 font-mono text-sm" {...props} />
              }}>
                {content}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Card footer with save button */}
      {onSave && (
        <CardFooter className="p-2 border-t sticky bottom-0 bg-background flex justify-end">
          <Button 
            size="sm" 
            onClick={handleSave}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
