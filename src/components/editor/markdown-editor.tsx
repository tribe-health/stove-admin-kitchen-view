import { useState, useEffect } from 'react';
import {
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin,
  linkPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  CodeToggle
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { cn } from '@/lib/utils';

export interface MarkdownEditorProps {
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

export default function MarkdownEditor({
  markdown = '# Hello World',
  onChange,
  onBlur,
  onSave,
  label,
  className
}: MarkdownEditorProps) {
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
          <TabsList className="grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="edit" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="flex-1 flex flex-col overflow-hidden border-0 p-0 m-0">
            <div className="flex-1 overflow-auto">
              <div className="p-2 border-b bg-muted/20">
                <div className="flex flex-wrap gap-1 items-center">
                  <UndoRedo />
                  <div className="w-px h-6 bg-border mx-1" />
                  <BoldItalicUnderlineToggles />
                  <div className="w-px h-6 bg-border mx-1" />
                  <BlockTypeSelect />
                  <div className="w-px h-6 bg-border mx-1" />
                  <CreateLink />
                  <div className="w-px h-6 bg-border mx-1" />
                  <ListsToggle />
                  <div className="w-px h-6 bg-border mx-1" />
                  <CodeToggle />
                </div>
              </div>
              
              <MDXEditor 
                markdown={content} 
                onChange={handleChange}
                onBlur={() => {
                  onBlur?.();
                }}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  thematicBreakPlugin(),
                  linkPlugin(),
                  markdownShortcutPlugin(),
                  tablePlugin(),
                  codeBlockPlugin(),
                  codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', html: 'HTML' } })
                ]}
                contentEditableClassName="min-h-[200px] px-4 py-3 focus:outline-none"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-auto border-0 p-0 m-0">
            <div className="p-4 prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
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
