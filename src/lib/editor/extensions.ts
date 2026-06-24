import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import { Comment } from '@/components/editor/extensions/Comment/Comment';
import { Node, mergeAttributes } from '@tiptap/core';

// Create a server-safe version of ImageBlock (no ReactNodeViewRenderer)
export const ServerImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  content: 'inline*',
  draggable: true,
  isolating: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      alignment: { default: 'center' },
      uploading: { default: false },
      progress: { default: 0 },
      error: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-type="imageBlock"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'imageBlock' }), ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }], ['figcaption', 0]];
  },
});

export const sharedEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Highlight,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: 'text-primary underline decoration-primary/50 underline-offset-4' }
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  ServerImageBlock,
  Underline,
  TextStyle,
  FontFamily,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Subscript,
  Superscript,
  Typography,
  Comment,
];
