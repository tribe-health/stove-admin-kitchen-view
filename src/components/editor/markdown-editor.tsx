import {MDXEditor, headingsPlugin} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';


export default function MarkdownEditor() {
  return <MDXEditor markdown={'# Hello World'} plugins={[headingsPlugin()]} />;
}